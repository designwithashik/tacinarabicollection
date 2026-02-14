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

const app = new Hono<AppType>()

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

export default app
