import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

export type Env = {
  DB: D1Database
  ADMIN_API_TOKEN?: string
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

const app = new Hono<Bindings>()

app.use('*', async (c, next) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  await next()
})

const requireAdmin: MiddlewareHandler<Bindings> = async (c, next) => {
  const expectedToken = c.env.ADMIN_API_TOKEN
  const authHeader = c.req.header('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  if (!expectedToken || !token || token !== expectedToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
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

app.get('/admin/orders', requireAdmin, async (c) => {
  const status = c.req.query('status')
  const date = c.req.query('date')
  const limitParam = Number(c.req.query('limit') ?? '50')
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50

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
