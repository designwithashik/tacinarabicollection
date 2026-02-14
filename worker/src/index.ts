import { Hono } from 'hono'

export type Env = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

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

export default app
