export type Env = {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
  IMAGEKIT_PRIVATE_KEY?: string;
  IMAGEKIT_PUBLIC_KEY?: string;
  IMAGEKIT_URL_ENDPOINT?: string;
};

type ProductRecord = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  image_file_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

const json = (data: unknown, status = 200, origin = "*") =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });

const corsPreflight = (origin = "*") =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });

const getOrigin = (request: Request) => request.headers.get("Origin") ?? "*";

const ensureSchema = async (db: D1Database) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image_url TEXT,
        image_file_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();

  const pragma = await db.prepare("PRAGMA table_info(products)").all<{ name: string }>();
  const cols = new Set((pragma.results ?? []).map((c) => c.name));

  if (!cols.has("image_file_id")) await db.prepare("ALTER TABLE products ADD COLUMN image_file_id TEXT").run();
  if (!cols.has("updated_at")) await db.prepare("ALTER TABLE products ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP").run();
};

const requireAdmin = (request: Request, env: Env) => {
  if (!env.ADMIN_API_TOKEN) return true;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  return token === env.ADMIN_API_TOKEN;
};

const imagekitAuthHeader = (env: Env) => {
  if (!env.IMAGEKIT_PRIVATE_KEY) return null;
  return `Basic ${btoa(`${env.IMAGEKIT_PRIVATE_KEY}:`)}`;
};

const uploadToImagekit = async (env: Env, file: File) => {
  const auth = imagekitAuthHeader(env);
  if (!auth) throw new Error("ImageKit credentials are missing");

  const form = new FormData();
  form.set("file", file);
  form.set("fileName", file.name || `product-${Date.now()}`);

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: auth },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status})`);
  }

  const payload = (await response.json()) as { url?: string; fileId?: string };
  if (!payload.url || !payload.fileId) throw new Error("ImageKit upload response invalid");
  return payload;
};

const deleteFromImagekit = async (env: Env, fileId: string | null) => {
  if (!fileId) return;
  const auth = imagekitAuthHeader(env);
  if (!auth) return;

  await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: auth },
  });
};

const routePath = (url: URL) => (url.pathname.startsWith("/api/") ? url.pathname.slice(4) : url.pathname);

export default {
  async fetch(request, env): Promise<Response> {
    const origin = getOrigin(request);
    const url = new URL(request.url);
    const path = routePath(url);

    if (request.method === "OPTIONS") return corsPreflight(origin);

    try {
      if (path === "/health" && request.method === "GET") {
        return json({ status: "ok", service: "tacin-api" }, 200, origin);
      }

      await ensureSchema(env.DB);

      if (path === "/products" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT id, name, price, image_url, image_file_id, is_active, created_at, updated_at FROM products WHERE is_active = 1 ORDER BY created_at DESC"
        ).all<ProductRecord>();
        return json(result.results ?? [], 200, origin);
      }

      if (path === "/admin/products" && request.method === "GET") {
        if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401, origin);
        const result = await env.DB.prepare(
          "SELECT id, name, price, image_url, image_file_id, is_active, created_at, updated_at FROM products ORDER BY created_at DESC"
        ).all<ProductRecord>();
        return json(result.results ?? [], 200, origin);
      }

      if (path === "/admin/products" && request.method === "POST") {
        if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401, origin);

        const form = await request.formData();
        const name = String(form.get("name") ?? "").trim();
        const price = Number(form.get("price"));
        const file = form.get("image");

        if (!name || !Number.isFinite(price) || !(file instanceof File)) {
          return json({ error: "name, price, and image are required" }, 400, origin);
        }

        const uploaded = await uploadToImagekit(env, file);

        const insert = await env.DB
          .prepare(
            `INSERT INTO products (name, price, image_url, image_file_id, is_active, updated_at)
             VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`
          )
          .bind(name, price, uploaded.url, uploaded.fileId)
          .run();

        const id = Number(insert.meta.last_row_id ?? 0);
        const product = await env.DB
          .prepare(
            "SELECT id, name, price, image_url, image_file_id, is_active, created_at, updated_at FROM products WHERE id = ? LIMIT 1"
          )
          .bind(id)
          .first<ProductRecord>();

        return json(product ?? { id }, 201, origin);
      }

      const productIdMatch = path.match(/^\/admin\/products\/(\d+)$/);
      if (productIdMatch && request.method === "PUT") {
        if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401, origin);
        const id = Number(productIdMatch[1]);
        const body = (await request.json().catch(() => null)) as { name?: string; price?: number; is_active?: boolean } | null;
        const name = String(body?.name ?? "").trim();
        const price = Number(body?.price);
        const isActive = body?.is_active === false ? 0 : 1;

        if (!name || !Number.isFinite(price)) return json({ error: "Validation error" }, 400, origin);

        const update = await env.DB
          .prepare("UPDATE products SET name = ?, price = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(name, price, isActive, id)
          .run();

        if ((update.meta.changes ?? 0) === 0) return json({ error: "Product not found" }, 404, origin);

        const product = await env.DB
          .prepare(
            "SELECT id, name, price, image_url, image_file_id, is_active, created_at, updated_at FROM products WHERE id = ? LIMIT 1"
          )
          .bind(id)
          .first<ProductRecord>();

        return json(product ?? { success: true }, 200, origin);
      }

      if (productIdMatch && request.method === "DELETE") {
        if (!requireAdmin(request, env)) return json({ error: "Unauthorized" }, 401, origin);
        const id = Number(productIdMatch[1]);

        const product = await env.DB
          .prepare("SELECT id, image_file_id FROM products WHERE id = ? LIMIT 1")
          .bind(id)
          .first<{ id: number; image_file_id: string | null }>();

        if (!product) return json({ error: "Product not found" }, 404, origin);

        await deleteFromImagekit(env, product.image_file_id ?? null);

        await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

        return json({ success: true, id }, 200, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Server error" }, 500, origin);
    }
  },
} satisfies ExportedHandler<Env>;
