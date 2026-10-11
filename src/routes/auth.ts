import { Hono } from 'hono'
import { type Env, hashPassword, randomToken, loadUser, getToken, audit } from '../lib/auth'

const auth = new Hono<Env>()

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>().catch(() => ({ username: '', password: '' }))
  if (!username || !password) return c.json({ error: '请输入账号与密码' }, 400)
  const u = await c.env.DB.prepare(`SELECT * FROM users WHERE username=? AND status='active'`).bind(username).first<any>()
  if (!u) return c.json({ error: '账号或密码错误' }, 401)
  const h = await hashPassword(u.salt, password)
  if (h !== u.password_hash) return c.json({ error: '账号或密码错误' }, 401)
  const token = randomToken()
  await c.env.DB.prepare(`INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,datetime('now','+12 hours'))`).bind(token, u.id).run()
  await audit(c.env.DB, u, 'LOGIN', `user:${u.id}`, '登录成功')
  c.header('Set-Cookie', `cw_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`)
  return c.json({ token, user: { id: u.id, username: u.username, role: u.role, display_name: u.display_name, enterprise_id: u.enterprise_id, opc_id: u.opc_id } })
})

auth.post('/logout', async (c) => {
  const t = getToken(c)
  if (t) await c.env.DB.prepare(`DELETE FROM sessions WHERE token=?`).bind(t).run()
  c.header('Set-Cookie', `cw_token=; Path=/; HttpOnly; Max-Age=0`)
  return c.json({ ok: true })
})

auth.get('/me', async (c) => {
  const u = await loadUser(c)
  if (!u) return c.json({ error: '未登录' }, 401)
  let extra: any = {}
  if (u.role === 'enterprise' && u.enterprise_id) extra.enterprise = await c.env.DB.prepare(`SELECT id,name,taxpayer_type,industry,region,service_rate,risk_level FROM enterprises WHERE id=?`).bind(u.enterprise_id).first()
  if (u.role === 'opc' && u.opc_id) extra.opc = await c.env.DB.prepare(`SELECT * FROM opcs WHERE id=?`).bind(u.opc_id).first()
  return c.json({ user: u, ...extra })
})

export default auth
