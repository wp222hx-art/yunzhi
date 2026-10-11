import type { Context, Next } from 'hono'

export type Bindings = { DB: D1Database }
export type User = { id: number; username: string; role: 'admin' | 'enterprise' | 'opc'; display_name: string; enterprise_id: number | null; opc_id: number | null }
export type Env = { Bindings: Bindings; Variables: { user: User } }

export async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}
export const hashPassword = (salt: string, pwd: string) => sha256Hex(`${salt}:${pwd}`)
export const randomToken = () => [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join('')

export function getToken(c: Context) {
  const h = c.req.header('Authorization')
  if (h?.startsWith('Bearer ')) return h.slice(7)
  const cookie = c.req.header('Cookie') || ''
  const m = cookie.match(/(?:^|;\s*)cw_token=([^;]+)/)
  return m ? m[1] : null
}

export async function loadUser(c: Context<Env>) {
  const token = getToken(c)
  if (!token) return null
  const row = await c.env.DB.prepare(
    `SELECT u.id,u.username,u.role,u.display_name,u.enterprise_id,u.opc_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>datetime('now') AND u.status='active'`
  ).bind(token).first<User>()
  return row || null
}

export function requireRole(...roles: string[]) {
  return async (c: Context<Env>, next: Next) => {
    const user = await loadUser(c)
    if (!user) return c.json({ error: '未登录或会话已过期' }, 401)
    if (roles.length && !roles.includes(user.role)) return c.json({ error: '无权访问该资源' }, 403)
    c.set('user', user)
    await next()
  }
}

export async function audit(db: D1Database, user: User | null, action: string, target: string, detail = '') {
  await db.prepare(`INSERT INTO audit_logs (user_id,user_name,role,action,target,detail) VALUES (?,?,?,?,?,?)`)
    .bind(user?.id ?? null, user?.display_name ?? '系统', user?.role ?? 'system', action, target, detail).run()
}

export const nowPeriod = () => new Date().toISOString().slice(0, 7)
export const genNo = (prefix: string) => `${prefix}${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`
export const periodMonths = (period: string) => parseInt(period.slice(5, 7), 10)
export const yearOf = (period: string) => period.slice(0, 4)
