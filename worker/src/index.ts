import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'

export type Env = {
  DB: D1Database
  ADMIN_API_TOKEN?: string
  JWT_SECRET: string
}

type Bindings = { Bindings: Env }

type OrderItemInput = {
  product_id: number
  quantity: number
}

type CreateOrderBody = {
  customer_name: string
  phone: string
  address?: string
  delivery_zone?: string
  payment_method?: string
  transaction_id?: string
  items: OrderItemInput[]
}

const ORDER_STATUSES = new Set(['pending', 'confirmed', 'shipped', 'delivered', 'failed'])

const resolveLimit = (rawLimit: string | undefined, max = 200) => {
  const limitParam = Number(rawLimit ?? '50')
  if (!Number.isInteger(limitParam) || limitParam <= 0) return 50
  return Math.min(limitParam, max)
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const app = new Hono<Bindings>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin
      if (origin.endsWith('.tacinarabicollection.pages.dev')) return origin
      return ''
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: [],
    credentials: true,
    maxAge: 86400,
  })
)

app.use('*', async (c, next) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  await next()
})

const requireAdmin: MiddlewareHandler<Bindings> = async (_c, next) => {
  return next()
}

const parseOrderBody = (payload: unknown): CreateOrderBody | null => {
  if (!payload || typeof payload !== 'object') return null
  const candidate = payload as Record<string, unknown>
  if (!Array.isArray(candidate.items)) return null

  const items = candidate.items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const entry = item as Record<string, unknown>
      const productId = Number(entry.product_id)
      const quantity = Number(entry.quantity)

      if (!Number.isInteger(productId) || productId <= 0) return null
      if (!Number.isInteger(quantity) || quantity <= 0) return null

      return {
        product_id: productId,
        quantity,
      }
    })
    .filter((item): item is OrderItemInput => Boolean(item))

  if (!items.length || items.length !== candidate.items.length) return null

  return {
    customer_name: String(candidate.customer_name ?? '').trim(),
    phone: String(candidate.phone ?? '').trim(),
    address: typeof candidate.address === 'string' ? candidate.address.trim() : '',
    delivery_zone: typeof candidate.delivery_zone === 'string' ? candidate.delivery_zone.trim() : '',
    payment_method: typeof candidate.payment_method === 'string' ? candidate.payment_method.trim() : '',
    transaction_id: typeof candidate.transaction_id === 'string' ? candidate.transaction_id.trim() : '',
    items,
  }
}

const ensureProductsSchema = async (db: D1Database) => {
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`)
    .run()

  const existingColumns = await db.prepare('PRAGMA table_info(products)').all<{ name: string }>()
  const names = new Set((existingColumns.results ?? []).map((c) => c.name))

  const alterations: Array<{ name: string; sql: string }> = [
    { name: 'slug', sql: 'ALTER TABLE products ADD COLUMN slug TEXT' },
    { name: 'stock', sql: 'ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0' },
    { name: 'image_url', sql: 'ALTER TABLE products ADD COLUMN image_url TEXT' },
    { name: 'description', sql: 'ALTER TABLE products ADD COLUMN description TEXT' },
    { name: 'is_active', sql: 'ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1' },
    { name: 'created_at', sql: 'ALTER TABLE products ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP' },
  ]

  for (const column of alterations) {
    if (!names.has(column.name)) {
      await db.prepare(column.sql).run()
    }
  }
}

const decrementStock = async (db: D1Database, productId: number, quantity: number) => {
  const result = await db
    .prepare(
      `UPDATE products
       SET stock = stock - ?
       WHERE id = ? AND stock >= ?`
    )
    .bind(quantity, productId, quantity)
    .run()

  return (result.meta.changes ?? 0) > 0
}

const generateUniqueSlug = async (db: D1Database, name: string) => {
  const base = slugify(name) || `product-${Date.now()}`
  let candidate = base
  let attempt = 1

  while (true) {
    const exists = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(candidate).first<{ id: number }>()
    if (!exists) return candidate
    attempt += 1
    candidate = `${base}-${attempt}`
  }
}

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'tacin-api',
    timestamp: Date.now(),
  })
})

app.get('/products', async (c) => {
  await ensureProductsSchema(c.env.DB)
  const products = await c.env.DB
    .prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC')
    .all()

  return c.json(products.results ?? [])
})

app.get('/products/:slug', async (c) => {
  await ensureProductsSchema(c.env.DB)
  const slug = c.req.param('slug')
  const product = await c.env.DB
    .prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1 LIMIT 1')
    .bind(slug)
    .first()

  if (!product) {
    return c.json({ error: 'Product not found' }, 404)
  }

  return c.json(product)
})

app.get('/admin/products', requireAdmin, async (c) => {
  await ensureProductsSchema(c.env.DB)
  const products = await c.env.DB
    .prepare('SELECT * FROM products ORDER BY created_at DESC')
    .all()

  return c.json(products.results ?? [])
})

app.post('/admin/products', requireAdmin, async (c) => {
  await ensureProductsSchema(c.env.DB)
  const payload = (await c.req.json().catch(() => null)) as Record<string, unknown> | null

  const name = String(payload?.name ?? '').trim()
  const price = Number(payload?.price)
  const stock = Number.isInteger(Number(payload?.stock)) ? Number(payload?.stock) : 0
  const imageUrl = typeof payload?.image_url === 'string' ? payload.image_url : null
  const description = typeof payload?.description === 'string' ? payload.description : null
  const isActive = payload?.is_active === 0 ? 0 : 1

  if (!name || !Number.isFinite(price)) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const slug = await generateUniqueSlug(c.env.DB, name)

  const result = await c.env.DB
    .prepare(
      `INSERT INTO products (name, slug, price, stock, image_url, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(name, slug, price, stock, imageUrl, description, isActive)
    .run()

  return c.json({ success: true, id: result.meta.last_row_id, slug }, 201)
})

app.put('/admin/products/:id', requireAdmin, async (c) => {
  await ensureProductsSchema(c.env.DB)
  const id = Number(c.req.param('id'))
  const payload = (await c.req.json().catch(() => null)) as Record<string, unknown> | null

  const name = String(payload?.name ?? '').trim()
  const price = Number(payload?.price)
  const description = typeof payload?.description === 'string' ? payload.description : null
  const imageUrl = typeof payload?.image_url === 'string' ? payload.image_url : null
  const isActive = payload?.is_active === 0 ? 0 : 1

  if (!Number.isInteger(id) || id <= 0 || !name || !Number.isFinite(price)) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const result = await c.env.DB
    .prepare('UPDATE products SET name = ?, price = ?, description = ?, image_url = ?, is_active = ? WHERE id = ?')
    .bind(name, price, description, imageUrl, isActive, id)
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Product not found' }, 404)
  }

  return c.json({ success: true })
})

app.patch('/admin/products/:id/stock', requireAdmin, async (c) => {
  await ensureProductsSchema(c.env.DB)
  const id = Number(c.req.param('id'))
  const payload = (await c.req.json().catch(() => null)) as Record<string, unknown> | null
  const stock = Number(payload?.stock)

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(stock)) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const result = await c.env.DB
    .prepare('UPDATE products SET stock = ? WHERE id = ?')
    .bind(stock, id)
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Product not found' }, 404)
  }

  return c.json({ success: true })
})

app.delete('/admin/products/:id', requireAdmin, async (c) => {
  await ensureProductsSchema(c.env.DB)
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const result = await c.env.DB
    .prepare('UPDATE products SET is_active = 0 WHERE id = ?')
    .bind(id)
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Product not found' }, 404)
  }

  return c.json({ success: true })
})

app.post('/orders', async (c) => {
  await ensureProductsSchema(c.env.DB)
  const body = parseOrderBody(await c.req.json().catch(() => null))
  if (!body || !body.customer_name || !body.phone) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const db = c.env.DB

  await db.prepare('BEGIN TRANSACTION').run()

  try {
    let totalAmount = 0
    const productsById = new Map<number, { id: number; name: string; price: number; stock: number }>()

    for (const item of body.items) {
      const productResult = await db
        .prepare('SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1')
        .bind(item.product_id)
        .first<{ id: number; name: string; price: number; stock: number }>()

      if (!productResult) {
        await db.prepare('ROLLBACK').run()
        return c.json({ error: `Product ${item.product_id} not found` }, 400)
      }

      if (productResult.stock < item.quantity) {
        await db.prepare('ROLLBACK').run()
        return c.json({ error: `Insufficient stock for product ${item.product_id}` }, 409)
      }

      productsById.set(item.product_id, productResult)
      totalAmount += productResult.price * item.quantity
    }

    const orderInsert = await db
      .prepare(
        `INSERT INTO orders (customer_name, phone, address, total_amount, delivery_zone, payment_method, transaction_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
      )
      .bind(
        body.customer_name,
        body.phone,
        body.address ?? null,
        totalAmount,
        body.delivery_zone ?? null,
        body.payment_method ?? null,
        body.transaction_id ?? null
      )
      .run()

    const orderId = Number(orderInsert.meta.last_row_id ?? 0)
    if (!orderId) {
      throw new Error('Unable to create order')
    }

    for (const item of body.items) {
      const product = productsById.get(item.product_id)
      if (!product) {
        throw new Error(`Product ${item.product_id} not loaded`)
      }

      await db
        .prepare('INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)')
        .bind(orderId, product.id, product.name, item.quantity, product.price)
        .run()

      const decremented = await decrementStock(db, product.id, item.quantity)
      if (!decremented) {
        await db.prepare('ROLLBACK').run()
        return c.json({ error: `Insufficient stock for product ${item.product_id}` }, 409)
      }
    }

    await db.prepare('COMMIT').run()

    return c.json(
      {
        id: orderId,
        total_amount: totalAmount,
        status: 'pending',
      },
      201
    )
  } catch (error) {
    await db.prepare('ROLLBACK').run()
    return c.json({ error: (error as Error).message || 'Unable to create order' }, 500)
  }
})

app.put('/admin/orders/:id/status', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const payload = (await c.req.json().catch(() => null)) as { status?: string } | null
  const status = payload?.status

  if (!Number.isInteger(id) || id <= 0 || !status || !ORDER_STATUSES.has(status)) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const update = await c.env.DB.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, id).run()

  if ((update.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Order not found' }, 404)
  }

  return c.json({ success: true, id, status })
})

app.get('/admin/me', requireAdmin, (c) => {
  return c.json({
    id: 1,
    email: 'admin@tacin.local',
    role: 'super_admin',
  })
})

app.get('/admin/dashboard/summary', requireAdmin, async (c) => {
  const [products, orders, pendingOrders, revenue, todayOrders, todayRevenue] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM products').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM orders').first<{ count: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'").first<{ count: number }>(),
    c.env.DB.prepare("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'failed'").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = DATE('now')").first<{ count: number }>(),
    c.env.DB
      .prepare("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'failed' AND DATE(created_at) = DATE('now')")
      .first<{ total: number }>(),
  ])

  return c.json({
    totalProducts: Number(products?.count ?? 0),
    totalOrders: Number(orders?.count ?? 0),
    pendingOrders: Number(pendingOrders?.count ?? 0),
    totalRevenue: Number(revenue?.total ?? 0),
    todayOrders: Number(todayOrders?.count ?? 0),
    todayRevenue: Number(todayRevenue?.total ?? 0),
    lowStockCount: 0,
  })
})

app.get('/admin/dashboard/revenue', requireAdmin, async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')

  if (!from || !to) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const result = await c.env.DB
    .prepare(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       WHERE status != 'failed' AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    )
    .bind(from, to)
    .all<{ date: string; revenue: number }>()

  return c.json(
    (result.results ?? []).map((row) => ({
      date: row.date,
      revenue: Number(row.revenue ?? 0),
    }))
  )
})

app.get('/admin/orders', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const date = c.req.query('date')
  const limit = resolveLimit(c.req.query('limit'))

  let sql = 'SELECT id, customer_name, phone, total_amount, status, created_at FROM orders'
  const conditions: string[] = []
  const bindings: Array<string | number> = []

  if (status) {
    conditions.push('status = ?')
    bindings.push(status)
  }

  if (date) {
    conditions.push('DATE(created_at) = DATE(?)')
    bindings.push(date)
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`
  }

  sql += ' ORDER BY created_at DESC LIMIT ?'
  bindings.push(limit)

  const result = await c.env.DB.prepare(sql).bind(...bindings).all()

  return c.json(result.results ?? [])
})

app.get('/admin/orders/export', requireAdmin, async (c) => {
  const limit = resolveLimit(c.req.query('limit'), 1000)
  const orders = await c.env.DB
    .prepare(
      `SELECT id, customer_name, phone, total_amount, status, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<{
      id: number
      customer_name: string
      phone: string
      total_amount: number
      status: string
      created_at: string
    }>()

  const escapeCsv = (value: unknown) => {
    const text = String(value ?? '')
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const header = 'id,customer_name,phone,total_amount,status,created_at'
  const lines = (orders.results ?? []).map((order) =>
    [order.id, order.customer_name, order.phone, Number(order.total_amount ?? 0).toFixed(2), order.status, order.created_at]
      .map(escapeCsv)
      .join(',')
  )

  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="orders.csv"')
  return c.body([header, ...lines].join('\n'))
})

app.get('/admin/orders/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first()

  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const orderItems = await c.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC').bind(id).all()

  return c.json({
    order,
    order_items: orderItems.results ?? [],
  })
})

export default app
