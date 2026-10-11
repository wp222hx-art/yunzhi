import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './lib/auth'
import { loadUser } from './lib/auth'
import authRoutes from './routes/auth'
import enterpriseRoutes from './routes/enterprise'
import opcRoutes from './routes/opc'
import adminRoutes from './routes/admin'
import workerRoutes from './routes/worker'
import guideRoutes from './routes/guide'
import { laborCumulative, laborLegacy, vatAgent, opcCompare, enterpriseCostCompare, wageCumulative, socialInsurance, DEFAULT_SOCIAL, r2 } from './lib/tax'
import { scoreLaborRisk } from './lib/risk'
import { landingPage, loginPage, appShell, guidePage } from './pages'

const app = new Hono<Env>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// ---------- API ----------
app.route('/api/auth', authRoutes)
app.route('/api/enterprise', enterpriseRoutes)
app.route('/api/opc', opcRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/worker', workerRoutes)
app.route('/api/guide', guideRoutes)

// 公共测算器（门户免费工具 · PLG 入口）
app.get('/api/public/health', (c) => c.json({ ok: true, name: '云工智合佳 Compliance OS', policy_baseline: '2026-10-09' }))
app.post('/api/public/calc/labor', async (c) => {
  const b = await c.req.json<any>()
  const monthly = +b.monthly || 8000
  const months = Math.min(12, Math.max(1, +b.months || 12))
  let cumTax = 0
  const rows: any[] = []
  for (let m = 1; m <= months; m++) {
    const l = laborCumulative({ cumIncome: monthly * m, months: m, cumTaxPaid: cumTax })
    cumTax += l.tax
    const leg = laborLegacy(monthly)
    const v = vatAgent(monthly)
    rows.push({ month: m, income: monthly, platform_tax: l.tax, legacy_tax: leg.tax, vat: v.vat + v.surcharge, net: r2(monthly - l.tax - v.vat - v.surcharge) })
  }
  const legacyTotal = r2(rows.reduce((s, r) => s + r.legacy_tax, 0))
  return c.json({ monthly, months, rows, platform_total: r2(cumTax), legacy_total: legacyTotal, saving: r2(legacyTotal - cumTax), note: '预缴口径；年度汇算须与工资薪金等综合所得合并，可能补税或退税' })
})
app.post('/api/public/calc/opc', async (c) => {
  const b = await c.req.json<any>()
  return c.json(opcCompare({ annualIncome: +b.income || 300000, costRatio: b.cost_ratio != null ? +b.cost_ratio : 0.3, ownerSalaryMonthly: b.salary != null ? +b.salary : 6000, bookkeepingFee: b.book != null ? +b.book : 5000 }))
})
app.post('/api/public/calc/enterprise', async (c) => {
  const b = await c.req.json<any>()
  return c.json(enterpriseCostCompare(+b.payout || 300000, b.taxpayer_type === 'small' ? 'small' : 'general', +b.rate || 0.05))
})
app.post('/api/public/calc/wage', async (c) => {
  const b = await c.req.json<any>()
  const salary = +b.salary || 15000, sd = +b.special_deduction || 0
  const si = socialInsurance(DEFAULT_SOCIAL, salary, salary)
  let cumTax = 0
  const rows: any[] = []
  for (let m = 1; m <= 12; m++) {
    const w = wageCumulative({ cumIncome: salary * m, cumInsurance: (si.personal + si.personalHousing) * m, cumSpecialDeduction: sd * m, months: m, cumTaxPaid: cumTax })
    cumTax += w.tax
    rows.push({ month: m, tax: w.tax, net: r2(salary - si.personal - si.personalHousing - w.tax), rate: w.rate })
  }
  return c.json({ salary, insurance: si, rows, annual_tax: r2(cumTax), employer_cost: r2(salary + si.employer + si.employerHousing) })
})
app.post('/api/public/risk', async (c) => c.json(scoreLaborRisk(await c.req.json())))

// ---------- 页面 ----------
app.get('/', (c) => c.html(landingPage()))
app.get('/guide', (c) => c.html(guidePage()))
app.get('/login', (c) => c.html(loginPage()))
// 演示快捷登录（仅用于演示账号）
app.get('/demo/:role', async (c) => {
  const map: Record<string, [string, string]> = { admin: ['admin', 'Admin@2026'], enterprise: ['hr_demo', 'Ent@2026'], opc: ['opc_demo', 'Opc@2026'], worker: ['worker_demo', 'Worker@2026'] }
  const m = map[c.req.param('role')]
  if (!m) return c.redirect('/login')
  const u = await c.env.DB.prepare(`SELECT * FROM users WHERE username=?`).bind(m[0]).first<any>()
  if (!u) return c.redirect('/login')
  const { randomToken } = await import('./lib/auth')
  const token = randomToken()
  await c.env.DB.prepare(`INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,datetime('now','+12 hours'))`).bind(token, u.id).run()
  c.header('Set-Cookie', `cw_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`)
  return c.html(`<script>localStorage.setItem('cw_token','${token}');location.href='/${c.req.param('role')}'</script>`)
})
app.get('/admin', async (c) => { const u = await loadUser(c); if (!u || u.role !== 'admin') return c.redirect('/login?next=/admin'); return c.html(appShell('admin', u)) })
app.get('/enterprise', async (c) => { const u = await loadUser(c); if (!u || !['enterprise', 'admin'].includes(u.role)) return c.redirect('/login?next=/enterprise'); return c.html(appShell('enterprise', u)) })
app.get('/worker', async (c) => { const u = await loadUser(c); if (!u || !['worker', 'admin'].includes(u.role)) return c.redirect('/login?next=/worker'); return c.html(appShell('worker', u)) })
app.get('/opc', async (c) => { const u = await loadUser(c); if (!u || !['opc', 'admin'].includes(u.role)) return c.redirect('/login?next=/opc'); return c.html(appShell('opc', u)) })

export default app
