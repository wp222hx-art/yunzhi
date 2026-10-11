import { Hono } from 'hono'
import { type Env, requireRole, audit, nowPeriod, yearOf } from '../lib/auth'
import { laborCumulative, laborLegacy, vatAgent, opcCompare, r2 } from '../lib/tax'

/** 从业人员端：接单 → 交付 → 收款 → 看税 → 成长 */
const w = new Hono<Env>()
w.use('*', requireRole('worker', 'admin'))
const wid = (c: any) => { const u = c.get('user'); return u.role === 'worker' ? u.worker_id : Number(c.req.query('worker_id') || 2) }

w.get('/home', async (c) => {
  const id = wid(c), db = c.env.DB
  const me = await db.prepare(`SELECT * FROM workers WHERE id=?`).bind(id).first<any>()
  const year = new Date().getFullYear().toString()
  const ytd = await db.prepare(`SELECT COALESCE(SUM(amount),0) inc, COALESCE(SUM(iit),0) tax, COALESCE(SUM(net),0) net, COUNT(*) n FROM settlements WHERE worker_id=? AND period LIKE ?`).bind(id, `${year}-%`).first<any>()
  const orders = await db.prepare(`SELECT o.*, t.title, t.pricing_mode, t.unit_price, t.quantity, t.deadline, e.name enterprise FROM task_orders o JOIN tasks t ON t.id=o.task_id JOIN enterprises e ON e.id=t.enterprise_id WHERE o.worker_id=? ORDER BY o.id DESC`).bind(id).all<any>()
  const apps = await db.prepare(`SELECT a.*, t.title FROM task_applications a JOIN tasks t ON t.id=a.task_id WHERE a.worker_id=? AND a.status='pending'`).bind(id).all()
  const monthly = await db.prepare(`SELECT period, SUM(amount) amt, SUM(net) net, SUM(iit) tax FROM settlements WHERE worker_id=? GROUP BY period ORDER BY period`).bind(id).all()
  // 下一步待办
  const todos: any[] = []
  if (!me.verified) todos.push({ step: 1, text: '完成实名核验（人脸活体 + 三要素）', action: 'verify', urgent: true })
  if (!me.authorized_filing) todos.push({ step: 1, text: '签署《代办申报授权书》', action: 'verify', urgent: true })
  const signed = orders.results.filter(o => o.status === 'signed')
  const delivered = orders.results.filter(o => o.status === 'delivered')
  const accepted = orders.results.filter(o => o.status === 'accepted')
  if (signed.length) todos.push({ step: 3, text: `${signed.length} 个任务待交付成果`, action: 'orders' })
  if (delivered.length) todos.push({ step: 4, text: `${delivered.length} 个任务等待企业验收`, action: 'orders', passive: true })
  if (accepted.length) todos.push({ step: 5, text: `${accepted.length} 个任务已验收，等待企业本期发放`, action: 'orders', passive: true })
  if (!todos.length) todos.push({ step: 2, text: '去任务大厅接新任务', action: 'hall' })
  const annualized = ytd.n ? r2(ytd.inc / Math.max(1, new Set(monthly.results.map((m: any) => m.period)).size) * 12) : 0
  return c.json({ me: { ...me, id_no: (me.id_no || '').replace(/^(\d{6})\d{8}(\d{4})$/, '$1********$2') }, ytd, orders: orders.results, applications: apps.results, monthly: monthly.results, todos, annualized, growthHint: annualized > 200000 ? '年化收入超过20万元，可评估升级为个体工商户（需真实多客户经营）' : '年化收入20万元以下，留在平台作为从业人员最简单、税负最低' })
})

w.get('/hall', async (c) => {
  const id = wid(c)
  const rows = await c.env.DB.prepare(`SELECT t.*, e.name enterprise, e.industry, (SELECT status FROM task_applications WHERE task_id=t.id AND worker_id=?) my_application, (SELECT COUNT(*) FROM task_orders WHERE task_id=t.id AND worker_id=?) my_order FROM tasks t JOIN enterprises e ON e.id=t.enterprise_id WHERE t.status='published' ORDER BY t.id DESC`).bind(id, id).all()
  return c.json(rows.results)
})
w.post('/hall/:task_id/apply', async (c) => {
  const id = wid(c)
  const me = await c.env.DB.prepare(`SELECT verified, authorized_filing, name FROM workers WHERE id=?`).bind(id).first<any>()
  if (!me.verified) return c.json({ error: '请先完成实名核验（16号公告强制要求）' }, 422)
  if (!me.authorized_filing) return c.json({ error: '请先签署代办申报授权书' }, 422)
  const { message } = await c.req.json<any>().catch(() => ({}))
  await c.env.DB.prepare(`INSERT OR IGNORE INTO task_applications (task_id,worker_id,message) VALUES (?,?,?)`).bind(c.req.param('task_id'), id, message || null).run()
  await audit(c.env.DB, c.get('user'), 'APPLY_TASK', `task:${c.req.param('task_id')}`, me.name)
  return c.json({ ok: true })
})
/** 自助实名（演示：模拟人脸活体 + 三要素通过） */
w.post('/verify', async (c) => {
  const id = wid(c)
  await c.env.DB.prepare(`UPDATE workers SET verified=1, verified_at=datetime('now'), authorized_filing=1 WHERE id=?`).bind(id).run()
  await audit(c.env.DB, c.get('user'), 'SELF_VERIFY', `worker:${id}`, '人脸活体+运营商三要素核验通过；签署代办申报授权书（单独同意）')
  return c.json({ ok: true })
})
/** 从业人员自助交付 */
w.post('/orders/:id/deliver', async (c) => {
  const id = wid(c)
  const b = await c.req.json<any>()
  const o = await c.env.DB.prepare(`SELECT o.*, t.unit_price, t.quantity FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE o.id=? AND o.worker_id=?`).bind(c.req.param('id'), id).first<any>()
  if (!o) return c.json({ error: '订单不存在' }, 404)
  if (o.status !== 'signed') return c.json({ error: '当前状态不可交付' }, 422)
  const qty = +b.quantity_done || o.quantity
  const amount = r2(qty * o.unit_price)
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${o.id}|${b.deliverable_desc || ''}|${Date.now()}`))
  const hash = [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('')
  await c.env.DB.prepare(`UPDATE task_orders SET status='delivered', quantity_done=?, amount=?, deliverable_desc=?, deliverable_hash=?, delivered_at=datetime('now') WHERE id=?`).bind(qty, amount, b.deliverable_desc || null, hash, o.id).run()
  await audit(c.env.DB, c.get('user'), 'WORKER_DELIVER', `order:${o.id}`, `交付${qty}，金额${amount}，存证${hash.slice(0, 12)}`)
  return c.json({ ok: true, amount, hash })
})

w.get('/income', async (c) => {
  const id = wid(c)
  const rows = await c.env.DB.prepare(`SELECT s.*, e.name enterprise FROM settlements s JOIN enterprises e ON e.id=s.enterprise_id WHERE s.worker_id=? ORDER BY s.id DESC`).bind(id).all<any>()
  rows.results.forEach(s => { s.evidence = s.evidence_json ? JSON.parse(s.evidence_json) : null; delete s.evidence_json })
  return c.json(rows.results)
})
/** 税负测算：本年已累计 + 预期月收入 → 全年预缴 + 汇算提示 */
w.get('/tax', async (c) => {
  const id = wid(c)
  const monthly = +(c.req.query('monthly') || 8000)
  const year = yearOf(nowPeriod())
  const hist = await c.env.DB.prepare(`SELECT COALESCE(SUM(amount),0) inc, COALESCE(SUM(iit),0) tax, COUNT(DISTINCT period) n FROM settlements WHERE worker_id=? AND period LIKE ?`).bind(id, `${year}-%`).first<any>()
  const rows: any[] = []
  let cumInc = hist.inc, cumTax = hist.tax
  const startM = hist.n + 1
  for (let m = startM; m <= 12; m++) {
    cumInc += monthly
    const l = laborCumulative({ cumIncome: cumInc, months: m, cumTaxPaid: cumTax })
    cumTax += l.tax
    const v = vatAgent(monthly)
    rows.push({ month: m, income: monthly, tax: l.tax, legacy: laborLegacy(monthly).tax, vat: r2(v.vat + v.surcharge), net: r2(monthly - l.tax - v.vat - v.surcharge), rate: l.rate })
  }
  const annual = cumInc
  const cmp = opcCompare({ annualIncome: annual })
  return c.json({ ytd: hist, monthly, rows, annual_income: r2(annual), annual_tax: r2(cumTax), legacy_tax: r2(hist.tax + rows.reduce((s, r) => s + r.legacy, 0)), compare: cmp, note: '预缴口径；次年3-6月需进行年度综合所得汇算，若另有工资薪金等收入，可能补税或退税。平台将在汇算期提醒您。' })
})

export default w
