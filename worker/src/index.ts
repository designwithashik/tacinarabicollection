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

const app = new Hono<Bindings>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin
      if (origin.endsWith('.tacinarabicollection.pages.dev')) return origin
      return ''
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

const decrementStock = async (db: D1Database, productId: number, quantity: number) => {
  const result = await db
    .prepare(
      `UPDATE products
       SET stock = stock - ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND stock >= ?`
    )
    .bind(quantity, productId, quantity)
    .run()

  return (result.meta.changes ?? 0) > 0
}

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'tacin-api',
    timestamp: Date.now(),
  })
})

app.get('/products', async (c) => {
  const products = await c.env.DB.prepare(
    'SELECT id, name, price, stock, image_url, status, featured, created_at, updated_at FROM products ORDER BY id DESC'
  ).all()

  return c.json(products.results ?? [])
})

app.post('/orders', async (c) => {
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
        .prepare('SELECT id, name, price, stock FROM products WHERE id = ?')
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
        .prepare(
          'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)'
        )
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

  const update = await c.env.DB.prepare(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  )
    .bind(status, id)
    .run()

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

app.get('/admin/products/low-stock', requireAdmin, async (c) => {
  const limit = resolveLimit(c.req.query('limit'))
  const result = await c.env.DB.prepare(
    `SELECT id, name, stock, low_stock_threshold
     FROM products
     WHERE status = 'active' AND stock <= low_stock_threshold
     ORDER BY stock ASC, id DESC
     LIMIT ?`
  )
    .bind(limit)
    .all()

  return c.json(result.results ?? [])
})

app.get('/admin/dashboard/summary', requireAdmin, async (c) => {
  const [products, orders, pendingOrders, revenue, todayOrders, todayRevenue, lowStock] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM products').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM orders').first<{ count: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'").first<{ count: number }>(),
    c.env.DB.prepare("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'failed'").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = DATE('now')").first<{ count: number }>(),
    c.env.DB
      .prepare(
        "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'failed' AND DATE(created_at) = DATE('now')"
      )
      .first<{ total: number }>(),
    c.env.DB
      .prepare("SELECT COUNT(*) AS count FROM products WHERE status = 'active' AND stock <= low_stock_threshold")
      .first<{ count: number }>(),
  ])

  return c.json({
    totalProducts: Number(products?.count ?? 0),
    totalOrders: Number(orders?.count ?? 0),
    pendingOrders: Number(pendingOrders?.count ?? 0),
    totalRevenue: Number(revenue?.total ?? 0),
    todayOrders: Number(todayOrders?.count ?? 0),
    todayRevenue: Number(todayRevenue?.total ?? 0),
    lowStockCount: Number(lowStock?.count ?? 0),
  })
})

app.get('/admin/dashboard/revenue', requireAdmin, async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')

  if (!from || !to) {
    return c.json({ error: 'Validation error' }, 400)
  }

  const result = await c.env.DB.prepare(
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

  const result = await c.env.DB.prepare(sql)
    .bind(...bindings)
    .all()

  return c.json(result.results ?? [])
})

app.get('/admin/orders/export', requireAdmin, async (c) => {
  const limit = resolveLimit(c.req.query('limit'), 1000)
  const orders = await c.env.DB.prepare(
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
    [
      order.id,
      order.customer_name,
      order.phone,
      Number(order.total_amount ?? 0).toFixed(2),
      order.status,
      order.created_at,
    ]
      .map(escapeCsv)
      .join(',')
  )

  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="orders.csv"')
  return c.body([header, ...lines].join('\n'))
})

app.get('/admin/inventory/logs', requireAdmin, async (c) => {
  const productId = c.req.query('product_id')
  const limit = resolveLimit(c.req.query('limit'))

  let sql = 'SELECT change_type, quantity, created_at FROM inventory_logs'
  const bindings: Array<number> = []

  if (productId !== undefined) {
    const parsedProductId = Number(productId)
    if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
      return c.json({ error: 'Validation error' }, 400)
    }
    sql += ' WHERE product_id = ?'
    bindings.push(parsedProductId)
  }

  sql += ' ORDER BY created_at DESC LIMIT ?'

  const result = await c.env.DB.prepare(sql)
    .bind(...bindings, limit)
    .all()

  return c.json(result.results ?? [])
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

  const orderItems = await c.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .bind(id)
    .all()

  return c.json({
    order,
    order_items: orderItems.results ?? [],
  })
})

export default app
