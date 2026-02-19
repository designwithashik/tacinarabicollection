export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const method = request.method

    // ============================
    // GET PRODUCTS
    // ============================
    if (url.pathname === "/api/products" && method === "GET") {
      try {
        const { results } = await env.DB
          .prepare("SELECT * FROM products ORDER BY id DESC")
          .all()

        return json(results)
      } catch (err) {
        return json({ error: "Failed to fetch products" }, 500)
      }
    }

    // ============================
    // ADD PRODUCT
    // ============================
    if (url.pathname === "/api/admin/add-product" && method === "POST") {
      try {
        const formData = await request.formData()

        const name = formData.get("name")
        const price = formData.get("price")
        const imageFile = formData.get("image")

        if (!name || !price || !imageFile) {
          return json({ error: "Missing fields" }, 400)
        }

        const buffer = await imageFile.arrayBuffer()
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(buffer))
        )

        const uploadResponse = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            headers: {
              Authorization:
                "Basic " + btoa(env.IMAGEKIT_PRIVATE_KEY + ":"),
              "Content-Type":
                "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              file: `data:${imageFile.type};base64,${base64}`,
              fileName: imageFile.name
            })
          }
        )

        const imageData = await uploadResponse.json()

        if (!imageData.url || !imageData.fileId) {
          return json({ error: "Image upload failed" }, 500)
        }

        await env.DB.prepare(
          `INSERT INTO products
           (name, price, image_url, image_file_id)
           VALUES (?, ?, ?, ?)`
        )
          .bind(name, price, imageData.url, imageData.fileId)
          .run()

        return json({ success: true })
      } catch (err) {
        return json({ error: "Add failed" }, 500)
      }
    }

    // ============================
    // DELETE PRODUCT
    // ============================
    if (
      url.pathname.startsWith("/api/admin/delete-product/") &&
      method === "DELETE"
    ) {
      try {
        const id = url.pathname.split("/").pop()

        const product = await env.DB
          .prepare(
            "SELECT image_file_id FROM products WHERE id = ?"
          )
          .bind(id)
          .first()

        if (!product) {
          return json({ error: "Product not found" }, 404)
        }

        await fetch(
          `https://api.imagekit.io/v1/files/${product.image_file_id}`,
          {
            method: "DELETE",
            headers: {
              Authorization:
                "Basic " + btoa(env.IMAGEKIT_PRIVATE_KEY + ":")
            }
          }
        )

        await env.DB
          .prepare("DELETE FROM products WHERE id = ?")
          .bind(id)
          .run()

        return json({ success: true })
      } catch (err) {
        return json({ error: "Delete failed" }, 500)
      }
    }

    return new Response("Not Found", { status: 404 })
  }
}

// ============================
// Helper
// ============================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  })
}
