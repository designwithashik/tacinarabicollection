import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'

export type Env = {
  DB: D1Database
  JWT_SECRET: string
}

type AdminTokenPayload = {
  id: number
  email: string
  role: string
  exp: number
}

type AppType = {
  Bindings: Env
  Variables: {
    admin: AdminTokenPayload
  }
}

type ProductRow = {
  id: number
  name: string
  price: number
  stock: number
  low_stock_threshold: number
  image_url: string | null
  image_folder: string | null
  status: string
  featured: number
  created_at: string
  updated_at: string
}

type ProductInput = {
  name?: string
  price?: number
  stock?: number
  low_stock_threshold?: number
  image_url?: string | null
  image_folder?: string | null
  status?: string
  featured?: number
}

const app = new Hono<AppType>()

const toProductResponse = (product: ProductRow) => ({
  ...product,
  lowStock: product.stock <= product.low_stock_threshold,
})

const decrementStock = async (
  db: D1Database,
  productId: number,
  quantity: number,
  adminId: number | null,
): Promise<void> => {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero.')
  }

  await db.exec('BEGIN IMMEDIATE TRANSACTION')

  try {
    const product = await db
      .prepare('SELECT stock FROM products WHERE id = ? LIMIT 1')
      .bind(productId)
      .first<{ stock: number }>()

    if (!product) {
      throw new Error('Product not found.')
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock.')
    }

    await db
      .prepare(
        'UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      )
      .bind(quantity, productId)
      .run()

    await db
      .prepare(
        'INSERT INTO inventory_logs (product_id, change_type, quantity, admin_id) VALUES (?, ?, ?, ?)',
      )
      .bind(productId, 'sale', -quantity, adminId)
      .run()

    await db.exec('COMMIT')
  } catch (error) {
    await db.exec('ROLLBACK')
    throw error
  }
}

app.use('*', async (c, next) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  await next()
})

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'tacin-api',
    timestamp: Date.now(),
  })
})

app.get('/products', (c) => {
  return c.json([])
})

app.post('/admin/seed', async (c) => {
  let body: { email?: string; password?: string }

  try {
    body = await c.req.json<{ email?: string; password?: string }>()
  } catch {
    return c.json({ error: 'Invalid request payload.' }, 400)
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password || password.length < 8) {
    return c.json(
      { error: 'Email and password (min 8 chars) are required.' },
      400,
    )
  }

  try {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM admins LIMIT 1',
    ).first<{ id: number }>()

    if (existing) {
      return c.json({ error: 'Admin already initialized.' }, 409)
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await c.env.DB.prepare(
      'INSERT INTO admins (email, password_hash, role) VALUES (?, ?, ?)',
    )
      .bind(email, passwordHash, 'super_admin')
      .run()

    return c.json({ success: true, message: 'Admin seeded successfully.' }, 201)
  } catch {
    return c.json({ error: 'Failed to seed admin.' }, 500)
  }
})

app.post('/admin/login', async (c) => {
  let body: { email?: string; password?: string }

  try {
    body = await c.req.json<{ email?: string; password?: string }>()
  } catch {
    return c.json({ error: 'Invalid request payload.' }, 400)
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return c.json({ error: 'Email and password are required.' }, 400)
  }

  try {
    const admin = await c.env.DB.prepare(
      'SELECT id, email, password_hash, role FROM admins WHERE email = ? LIMIT 1',
    )
      .bind(email)
      .first<{ id: number; email: string; password_hash: string; role: string }>()

    if (!admin) {
      return c.json({ error: 'Invalid credentials.' }, 401)
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash)

    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials.' }, 401)
    }

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    const payload: AdminTokenPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      exp,
    }

    const token = await sign(payload, c.env.JWT_SECRET)

    setCookie(c, 'admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return c.json({ success: true, message: 'Login successful.' })
  } catch {
    return c.json({ error: 'Failed to login.' }, 500)
  }
})

app.use('/admin/*', async (c, next) => {
  if (c.req.path === '/admin/login' || c.req.path === '/admin/seed') {
    await next()
    return
  }

  const token = getCookie(c, 'admin_token')

  if (!token) {
    return c.json({ error: 'Unauthorized.' }, 401)
  }

  try {
    const payload = (await verify(token, c.env.JWT_SECRET)) as AdminTokenPayload

    if (
      typeof payload.id !== 'number' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return c.json({ error: 'Unauthorized.' }, 401)
    }

    c.set('admin', payload)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized.' }, 401)
  }
})

app.get('/admin/me', (c) => {
  const admin = c.get('admin')

  return c.json({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  })
})

app.post('/admin/products', async (c) => {
  let body: ProductInput

  try {
    body = await c.req.json<ProductInput>()
  } catch {
    return c.json({ error: 'Invalid request payload.' }, 400)
  }

  const name = body.name?.trim()
  const price = body.price
  const stock = body.stock ?? 0
  const lowStockThreshold = body.low_stock_threshold ?? 5
  const imageUrl = body.image_url ?? null
  const imageFolder = body.image_folder ?? null
  const status = body.status ?? 'active'
  const featured = body.featured ?? 0
  const admin = c.get('admin')

  if (!name || typeof price !== 'number' || Number.isNaN(price)) {
    return c.json({ error: 'Valid name and price are required.' }, 400)
  }

  if (price < 0 || stock < 0 || lowStockThreshold < 0) {
    return c.json({ error: 'Price, stock, and threshold must be >= 0.' }, 400)
  }

  try {
    const insertResult = await c.env.DB.prepare(
      `INSERT INTO products (
        name, price, stock, low_stock_threshold, image_url, image_folder, status, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        name,
        price,
        stock,
        lowStockThreshold,
        imageUrl,
        imageFolder,
        status,
        featured,
      )
      .run()

    const productId = Number(insertResult.meta.last_row_id)

    await c.env.DB.prepare(
      'INSERT INTO inventory_logs (product_id, change_type, quantity, admin_id) VALUES (?, ?, ?, ?)',
    )
      .bind(productId, 'manual_create', stock, admin.id)
      .run()

    const created = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
      .bind(productId)
      .first<ProductRow>()

    if (!created) {
      return c.json({ error: 'Created product not found.' }, 404)
    }

    return c.json({ success: true, product: toProductResponse(created) }, 201)
  } catch {
    return c.json({ error: 'Failed to create product.' }, 500)
  }
})

app.get('/admin/products', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM products ORDER BY id DESC').all<ProductRow>()
    const products = (result.results ?? []).map(toProductResponse)

    return c.json({ products })
  } catch {
    return c.json({ error: 'Failed to fetch products.' }, 500)
  }
})

app.put('/admin/products/:id', async (c) => {
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid product id.' }, 400)
  }

  let body: ProductInput

  try {
    body = await c.req.json<ProductInput>()
  } catch {
    return c.json({ error: 'Invalid request payload.' }, 400)
  }

  try {
    const existing = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProductRow>()

    if (!existing) {
      return c.json({ error: 'Product not found.' }, 404)
    }

    const nextName = body.name !== undefined ? body.name.trim() : existing.name
    const nextPrice = body.price !== undefined ? body.price : existing.price
    const nextStock = body.stock !== undefined ? body.stock : existing.stock
    const nextThreshold =
      body.low_stock_threshold !== undefined
        ? body.low_stock_threshold
        : existing.low_stock_threshold
    const nextImageUrl = body.image_url !== undefined ? body.image_url : existing.image_url
    const nextStatus = body.status !== undefined ? body.status : existing.status
    const nextFeatured = body.featured !== undefined ? body.featured : existing.featured

    if (!nextName || nextPrice < 0 || nextStock < 0 || nextThreshold < 0) {
      return c.json({ error: 'Invalid product payload.' }, 400)
    }

    await c.env.DB.prepare(
      `UPDATE products
       SET name = ?, price = ?, stock = ?, low_stock_threshold = ?, image_url = ?, status = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        nextName,
        nextPrice,
        nextStock,
        nextThreshold,
        nextImageUrl,
        nextStatus,
        nextFeatured,
        id,
      )
      .run()

    const stockDiff = nextStock - existing.stock
    if (stockDiff !== 0) {
      const admin = c.get('admin')
      await c.env.DB.prepare(
        'INSERT INTO inventory_logs (product_id, change_type, quantity, admin_id) VALUES (?, ?, ?, ?)',
      )
        .bind(id, 'manual_update', stockDiff, admin.id)
        .run()
    }

    const updated = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProductRow>()

    if (!updated) {
      return c.json({ error: 'Product not found after update.' }, 404)
    }

    return c.json({ success: true, product: toProductResponse(updated) })
  } catch {
    return c.json({ error: 'Failed to update product.' }, 500)
  }
})

app.delete('/admin/products/:id', async (c) => {
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid product id.' }, 400)
  }

  try {
    const product = await c.env.DB.prepare('SELECT id FROM products WHERE id = ? LIMIT 1')
      .bind(id)
      .first<{ id: number }>()

    if (!product) {
      return c.json({ error: 'Product not found.' }, 404)
    }

    await c.env.DB.prepare(
      'UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
      .bind('inactive', id)
      .run()

    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Failed to delete product.' }, 500)
  }
})

// Internal route for core engine verification/use; keep protected by admin middleware.
app.post('/admin/products/:id/decrement', async (c) => {
  const id = Number(c.req.param('id'))
  let body: { quantity?: number }

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'Invalid product id.' }, 400)
  }

  try {
    body = await c.req.json<{ quantity?: number }>()
  } catch {
    return c.json({ error: 'Invalid request payload.' }, 400)
  }

  const quantity = body.quantity
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    return c.json({ error: 'Quantity must be a positive integer.' }, 400)
  }

  try {
    const admin = c.get('admin')
    await decrementStock(c.env.DB, id, quantity, admin.id)
    return c.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found.') {
      return c.json({ error: 'Product not found.' }, 404)
    }

    if (error instanceof Error && error.message === 'Insufficient stock.') {
      return c.json({ error: 'Insufficient stock.' }, 400)
    }

    return c.json({ error: 'Failed to decrement stock.' }, 500)
  }
})

export default app
