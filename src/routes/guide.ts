import { Hono } from 'hono'
import { type Env, requireRole, nowPeriod } from '../lib/auth'

/**
 * 流程引导：告诉每个角色"现在走到哪一步、下一步做什么"
 * 主流程（8步）：企业入驻 → 发布任务 → 接单签约 → 交付验收 → 一键发放 → 扣缴申报 → 代征解缴 → 凭证归档
 */
const g = new Hono<Env>()
g.use('*', requireRole('admin', 'enterprise', 'opc', 'worker'))

export const MAIN_FLOW = [
  { key: 'onboard', name: '企业入驻', owner: 'admin', desc: '尽调准入、配置纳税人身份与服务费率、开通企业账号' },
  { key: 'task', name: '发布任务', owner: 'enterprise', desc: '按成果计价发布任务，AI风控评分放行' },
  { key: 'sign', name: '接单签约', owner: 'worker', desc: '从业人员实名后申请，企业确认，生成电子合同' },
  { key: 'deliver', name: '交付验收', owner: 'worker', desc: '上传交付物存证，企业验收签署' },
  { key: 'pay', name: '一键发放', owner: 'enterprise', desc: '三层薪酬试算→审批→发放，平台受托分账' },
  { key: 'file', name: '扣缴申报', owner: 'admin', desc: '累计预扣/增值税代办申报，双人复核后提交' },
  { key: 'collect', name: '代征解缴', owner: 'admin', desc: '委托代征税款解缴，出具完税凭证' },
  { key: 'evidence', name: '凭证归档', owner: 'enterprise', desc: '五流合一凭证包，支持税前扣除，保存≥10年' },
]

g.get('/progress', async (c) => {
  const u = c.get('user'), db = c.env.DB
  const period = c.req.query('period') || nowPeriod()
  const eid = u.role === 'enterprise' ? u.enterprise_id : Number(c.req.query('enterprise_id') || 1)
  const q = async (sql: string, ...b: any[]) => (await db.prepare(sql).bind(...b).first<any>())?.n || 0
  const steps = await Promise.all([
    q(`SELECT COUNT(*) n FROM enterprises WHERE status='active'`),
    q(`SELECT COUNT(*) n FROM tasks WHERE status='published' ${u.role === 'enterprise' ? 'AND enterprise_id=' + eid : ''}`),
    q(`SELECT COUNT(*) n FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE o.status IN ('signed','delivered','accepted','settled') ${u.role === 'enterprise' ? 'AND t.enterprise_id=' + eid : ''}`),
    q(`SELECT COUNT(*) n FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE o.status IN ('accepted','settled') ${u.role === 'enterprise' ? 'AND t.enterprise_id=' + eid : ''}`),
    q(`SELECT COUNT(*) n FROM payroll_batches WHERE status='paid' AND period=? ${u.role === 'enterprise' ? 'AND enterprise_id=' + eid : ''}`, period),
    q(`SELECT COUNT(*) n FROM tax_filings WHERE status IN ('accepted','corrected') AND period=?`, period),
    q(`SELECT COUNT(*) n FROM collection_records WHERE status IN ('remitted','certified') AND period=?`, period),
    q(`SELECT COUNT(*) n FROM settlements WHERE period=? AND evidence_json IS NOT NULL ${u.role === 'enterprise' ? 'AND enterprise_id=' + eid : ''}`, period),
  ])
  const flow = MAIN_FLOW.map((s, i) => ({ ...s, done: steps[i] > 0, count: steps[i], mine: s.owner === u.role || u.role === 'admin' }))
  const current = flow.findIndex(s => !s.done)
  return c.json({ period, flow, current: current < 0 ? flow.length : current })
})

/** 角色待办清单：按"本期必须做的事"排序 */
g.get('/todos', async (c) => {
  const u = c.get('user'), db = c.env.DB
  const period = c.req.query('period') || nowPeriod()
  const todos: Array<{ title: string; desc: string; view: string; level: 'red' | 'yellow' | 'blue' | 'green'; count?: number }> = []
  const n = async (sql: string, ...b: any[]) => (await db.prepare(sql).bind(...b).first<any>())?.n || 0

  if (u.role === 'enterprise') {
    const eid = u.enterprise_id
    const emp = await n(`SELECT COUNT(*) n FROM employees WHERE enterprise_id=? AND status='active'`, eid)
    if (!emp) todos.push({ title: '录入人员花名册', desc: '先把核心层（劳动合同）、弹性层、任务层人员录进来，系统才能算薪', view: 'employees', level: 'red' })
    const review = await n(`SELECT COUNT(*) n FROM tasks WHERE enterprise_id=? AND status='review'`, eid)
    if (review) todos.push({ title: `${review} 个任务待平台复核（黄）`, desc: '可补充交付物与验收标准、改为按成果计价后重新发布', view: 'tasks', level: 'yellow', count: review })
    const apps = await n(`SELECT COUNT(*) n FROM task_applications a JOIN tasks t ON t.id=a.task_id WHERE t.enterprise_id=? AND a.status='pending'`, eid)
    if (apps) todos.push({ title: `${apps} 位从业人员申请接单`, desc: '确认后自动生成电子合同并存证', view: 'tasks', level: 'blue', count: apps })
    const deliv = await n(`SELECT COUNT(*) n FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE t.enterprise_id=? AND o.status='delivered'`, eid)
    if (deliv) todos.push({ title: `${deliv} 个交付物待验收`, desc: '验收通过后才能进入本期结算（"真交付"是税前扣除的前提）', view: 'tasks', level: 'yellow', count: deliv })
    for (const layer of ['core', 'flex', 'task']) {
      const has = await n(`SELECT COUNT(*) n FROM employees WHERE enterprise_id=? AND layer=? AND status='active'`, eid, layer)
      if (!has) continue
      const b = await db.prepare(`SELECT status FROM payroll_batches WHERE enterprise_id=? AND period=? AND layer=?`).bind(eid, period, layer).first<any>()
      const name = { core: '核心层', flex: '弹性层', task: '任务层' }[layer]
      if (!b) todos.push({ title: `${period} ${name}薪酬尚未试算`, desc: layer === 'task' ? '已验收任务金额将自动带入，按16号公告累计预扣' : '一键试算，附计算公式', view: 'payroll', level: 'blue' })
      else if (b.status === 'calculated') todos.push({ title: `${period} ${name}薪酬待审批`, desc: '核对明细后审批', view: 'payroll', level: 'yellow' })
      else if (b.status === 'approved') todos.push({ title: `${period} ${name}薪酬待发放`, desc: '发放后自动生成扣缴申报草稿与凭证包', view: 'payroll', level: 'red' })
    }
    const diag = await db.prepare(`SELECT COUNT(*) n FROM employees WHERE enterprise_id=? AND status='active' AND layer='core'`).bind(eid).first<any>()
    if (emp && diag.n / emp < 0.5) todos.push({ title: '用工结构体检：核心层占比低于50%', desc: '警惕核心岗位过度灵活化带来的穿透认定风险', view: 'dashboard', level: 'yellow' })
    if (!todos.length) todos.push({ title: '本期事项已全部完成', desc: '可查看凭证包或做用工方案成本对比', view: 'settlements', level: 'green' })
  }

  if (u.role === 'admin') {
    const unverified = await n(`SELECT COUNT(*) n FROM workers WHERE verified=0 AND status='active'`)
    if (unverified) todos.push({ title: `${unverified} 位从业人员未实名`, desc: '未实名不可签约与结算（16号公告强制）', view: 'workers', level: 'yellow', count: unverified })
    const risk = await n(`SELECT COUNT(*) n FROM tasks WHERE status='review'`)
    if (risk) todos.push({ title: `${risk} 个黄色任务待人工复核`, desc: '查看评分因子，决定放行或拦截（PIPL第24条：须有人工节点）', view: 'risk', level: 'yellow', count: risk })
    const draft = await n(`SELECT COUNT(*) n FROM tax_filings WHERE status='draft'`)
    if (draft) todos.push({ title: `${draft} 份申报草稿待复核`, desc: '规则引擎重算一致后方可提交', view: 'filings', level: 'red', count: draft })
    const reviewed = await n(`SELECT COUNT(*) n FROM tax_filings WHERE status='reviewed'`)
    if (reviewed) todos.push({ title: `${reviewed} 份申报已复核待提交`, desc: '次月15日前提交至电子税务局', view: 'filings', level: 'red', count: reviewed })
    const toCert = await n(`SELECT COUNT(*) n FROM collection_records WHERE status='remitted'`)
    if (toCert) todos.push({ title: `${toCert} 条代征税款已解缴待出凭证`, desc: '出具完税凭证后从业人员与企业可下载', view: 'collection', level: 'blue', count: toCert })
    const infoR = await db.prepare(`SELECT id FROM tax_filings WHERE filing_type='info_report' AND period=?`).bind(period).first()
    if (!infoR) todos.push({ title: `${period} 涉税信息报送未生成`, desc: '国务院令第810号 / 15号公告要求按期报送', view: 'filings', level: 'blue' })
    if (!todos.length) todos.push({ title: '本期合规事项已全部完成', desc: '可查看风控监测或审计日志', view: 'risk', level: 'green' })
  }

  if (u.role === 'opc') {
    const oid = u.opc_id
    const o = await db.prepare(`SELECT * FROM opcs WHERE id=?`).bind(oid).first<any>()
    const inc = await n(`SELECT COUNT(*) n FROM opc_incomes WHERE opc_id=? AND period=?`, oid, period)
    if (!inc) todos.push({ title: `${period} 尚未记录收入`, desc: '记录每笔收入与开票情况，系统自动算增值税与所得税', view: 'income', level: 'blue' })
    const nov = await n(`SELECT COUNT(*) n FROM opc_expenses WHERE opc_id=? AND has_voucher=0`, oid)
    if (nov) todos.push({ title: `${nov} 笔成本无合规凭证`, desc: '无凭证不得税前列支，请补票或剔除', view: 'income', level: 'yellow', count: nov })
    if (o.entity_type === 'company') {
      const p = await db.prepare(`SELECT status FROM opc_payrolls WHERE opc_id=? AND period=?`).bind(oid, period).first<any>()
      if (!p) todos.push({ title: `${period} 股东薪酬未生成`, desc: '工资+分红最优配比试算，生成薪酬单', view: 'payroll', level: 'red' })
      else if (p.status === 'calculated') todos.push({ title: `${period} 股东薪酬待发放`, desc: '发放后自动生成扣缴申报', view: 'payroll', level: 'yellow' })
    }
    const conc = await db.prepare(`SELECT client_name, SUM(amount) a, (SELECT SUM(amount) FROM opc_incomes WHERE opc_id=?) t FROM opc_incomes WHERE opc_id=? GROUP BY client_name ORDER BY a DESC LIMIT 1`).bind(oid, oid).first<any>()
    if (conc && conc.t && conc.a / conc.t > 0.7) todos.push({ title: `客户集中度 ${Math.round(conc.a / conc.t * 100)}% 超预警线`, desc: '单一客户>70%可能被认定为转换收入性质，建议拓展客户', view: 'dashboard', level: 'red' })
    if (!todos.length) todos.push({ title: '本期经营事项已完成', desc: '看看三阶跃迁建议或一站式服务', view: 'growth', level: 'green' })
  }

  if (u.role === 'worker') {
    const me = await db.prepare(`SELECT * FROM workers WHERE id=?`).bind(u.worker_id).first<any>()
    if (!me?.verified) todos.push({ title: '完成实名核验', desc: '人脸活体 + 三要素，1分钟完成，之后才能接单', view: 'home', level: 'red' })
    const signed = await n(`SELECT COUNT(*) n FROM task_orders WHERE worker_id=? AND status='signed'`, u.worker_id)
    if (signed) todos.push({ title: `${signed} 个任务待交付`, desc: '上传交付成果，系统自动存证', view: 'orders', level: 'yellow', count: signed })
    if (!signed && me?.verified) todos.push({ title: '去任务大厅接单', desc: '按成果计价的任务，收入按累计预扣法预扣，到手更多', view: 'hall', level: 'blue' })
  }
  return c.json({ period, todos })
})

export default g
