import { Hono } from 'hono'
import { type Env, requireRole, audit, nowPeriod, genNo, periodMonths, yearOf } from '../lib/auth'
import { wageCumulative, socialInsurance, DEFAULT_SOCIAL, vatAgent, businessIncomeTax, corporateIncomeTax, dividendTax, opcCompare, laborCumulative, r2 } from '../lib/tax'

const opc = new Hono<Env>()
opc.use('*', requireRole('opc', 'admin'))

function opcId(c: any): number {
  const u = c.get('user')
  if (u.role === 'opc') return u.opc_id
  return Number(c.req.query('opc_id') || 1)
}
const STAGE_NAME: Record<string, string> = { individual: 'L1 平台从业人员', sole_proprietor: 'L2 个体工商户', company: 'L3 一人有限公司' }

opc.get('/profile', async (c) => {
  const o = await c.env.DB.prepare(`SELECT * FROM opcs WHERE id=?`).bind(opcId(c)).first<any>()
  if (!o) return c.json({ error: 'OPC不存在' }, 404)
  return c.json({ ...o, stage_name: STAGE_NAME[o.entity_type] })
})
opc.put('/profile', async (c) => {
  const b = await c.req.json<any>()
  await c.env.DB.prepare(`UPDATE opcs SET name=COALESCE(?,name), entity_type=COALESCE(?,entity_type), registered_capital=COALESCE(?,registered_capital), paid_capital=COALESCE(?,paid_capital), owner_salary=COALESCE(?,owner_salary), owner_social_base=COALESCE(?,owner_social_base), owner_special_deduction=COALESCE(?,owner_special_deduction), bookkeeping_fee=COALESCE(?,bookkeeping_fee), industry=COALESCE(?,industry), region=COALESCE(?,region) WHERE id=?`)
    .bind(b.name ?? null, b.entity_type ?? null, b.registered_capital ?? null, b.paid_capital ?? null, b.owner_salary ?? null, b.owner_social_base ?? null, b.owner_special_deduction ?? null, b.bookkeeping_fee ?? null, b.industry ?? null, b.region ?? null, opcId(c)).run()
  await audit(c.env.DB, c.get('user'), 'UPDATE_OPC', `opc:${opcId(c)}`)
  return c.json({ ok: true })
})

// ---------------- 收入/支出 ----------------
opc.get('/incomes', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM opc_incomes WHERE opc_id=? ORDER BY income_date DESC, id DESC`).bind(opcId(c)).all()
  return c.json(rows.results)
})
opc.post('/incomes', async (c) => {
  const b = await c.req.json<any>()
  if (!b.client_name || !b.amount) return c.json({ error: '客户与金额必填' }, 400)
  const period = b.period || (b.income_date || new Date().toISOString()).slice(0, 7)
  const r = await c.env.DB.prepare(`INSERT INTO opc_incomes (opc_id,period,client_name,enterprise_id,amount,invoice_type,invoice_no,project,income_date) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(opcId(c), period, b.client_name, b.enterprise_id || null, +b.amount, b.invoice_type || 'none', b.invoice_no || null, b.project || null, b.income_date || new Date().toISOString().slice(0, 10)).run()
  await audit(c.env.DB, c.get('user'), 'OPC_INCOME', `income:${r.meta.last_row_id}`, `${b.client_name} ${b.amount}`)
  return c.json({ id: r.meta.last_row_id })
})
opc.delete('/incomes/:id', async (c) => {
  await c.env.DB.prepare(`DELETE FROM opc_incomes WHERE id=? AND opc_id=?`).bind(c.req.param('id'), opcId(c)).run()
  return c.json({ ok: true })
})
opc.get('/expenses', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM opc_expenses WHERE opc_id=? ORDER BY expense_date DESC, id DESC`).bind(opcId(c)).all()
  return c.json(rows.results)
})
opc.post('/expenses', async (c) => {
  const b = await c.req.json<any>()
  if (!b.category || !b.amount) return c.json({ error: '类别与金额必填' }, 400)
  const period = b.period || (b.expense_date || new Date().toISOString()).slice(0, 7)
  const r = await c.env.DB.prepare(`INSERT INTO opc_expenses (opc_id,period,category,amount,has_voucher,remark,expense_date) VALUES (?,?,?,?,?,?,?)`)
    .bind(opcId(c), period, b.category, +b.amount, b.has_voucher === false ? 0 : 1, b.remark || null, b.expense_date || new Date().toISOString().slice(0, 10)).run()
  return c.json({ id: r.meta.last_row_id })
})
opc.delete('/expenses/:id', async (c) => {
  await c.env.DB.prepare(`DELETE FROM opc_expenses WHERE id=? AND opc_id=?`).bind(c.req.param('id'), opcId(c)).run()
  return c.json({ ok: true })
})

// ---------------- 经营舱仪表盘（含四道防火墙） ----------------
opc.get('/dashboard', async (c) => {
  const id = opcId(c)
  const db = c.env.DB
  const o = await db.prepare(`SELECT * FROM opcs WHERE id=?`).bind(id).first<any>()
  const year = new Date().getFullYear().toString()
  const inc = await db.prepare(`SELECT period, SUM(amount) amt FROM opc_incomes WHERE opc_id=? AND period LIKE ? GROUP BY period ORDER BY period`).bind(id, `${year}-%`).all<any>()
  const exp = await db.prepare(`SELECT period, SUM(amount) amt FROM opc_expenses WHERE opc_id=? AND period LIKE ? GROUP BY period ORDER BY period`).bind(id, `${year}-%`).all<any>()
  const byClient = await db.prepare(`SELECT client_name, SUM(amount) amt, COUNT(*) n FROM opc_incomes WHERE opc_id=? AND period >= ? GROUP BY client_name ORDER BY amt DESC`).bind(id, periodShift(nowPeriod(), -6)).all<any>()
  const totalIncome = r2(inc.results.reduce((s, x) => s + x.amt, 0))
  const totalExpense = r2(exp.results.reduce((s, x) => s + x.amt, 0))
  const noVoucher = await db.prepare(`SELECT COALESCE(SUM(amount),0) amt FROM opc_expenses WHERE opc_id=? AND has_voucher=0`).bind(id).first<any>()
  const sixMonthTotal = byClient.results.reduce((s, x) => s + x.amt, 0)
  const topShare = sixMonthTotal > 0 ? byClient.results[0].amt / sixMonthTotal : 0

  // 四道防火墙
  const firewalls = [
    { name: '财产独立', ok: true, text: '公私账户分离、年度审计留档（新《公司法》第23条）', level: 'green' },
    { name: '注册资本', ok: (o.registered_capital || 0) <= 500000, text: `认缴${o.registered_capital || 0}元 / 实缴${o.paid_capital || 0}元；建议按实际需要认缴（如10万元以内），5年内实缴`, level: (o.registered_capital || 0) > 500000 ? 'yellow' : 'green' },
    { name: '客户集中度', ok: topShare <= 0.7, text: byClient.results.length ? `近6个月最大客户「${byClient.results[0].client_name}」占比${Math.round(topShare * 100)}%${topShare > 0.7 ? '，超过70%预警线：提示业务多元化或回归劳动/劳务关系' : '，处于安全区间'}` : '暂无收入数据', level: topShare > 0.7 ? 'red' : topShare > 0.5 ? 'yellow' : 'green' },
    { name: '发票与成本', ok: noVoucher.amt === 0, text: noVoucher.amt > 0 ? `存在无凭证支出${noVoucher.amt}元，不得税前列支；严禁“买票冲成本”` : '全部成本有真实凭证', level: noVoucher.amt > 0 ? 'yellow' : 'green' },
  ]
  // 年化税负估算
  const monthsElapsed = Math.max(1, inc.results.length)
  const annualized = r2(totalIncome / monthsElapsed * 12)
  const compare = opcCompare({ annualIncome: annualized || 1, costRatio: totalIncome > 0 ? Math.min(0.9, totalExpense / totalIncome) : 0.3, ownerSalaryMonthly: o.owner_salary || 0, bookkeepingFee: o.bookkeeping_fee || 0, specialDeduction: (o.owner_special_deduction || 0) * 12 })
  const payrolls = await db.prepare(`SELECT period, owner_salary, tax, net, dividend, dividend_tax FROM opc_payrolls WHERE opc_id=? ORDER BY period DESC LIMIT 6`).bind(id).all()
  return c.json({ opc: { ...o, stage_name: STAGE_NAME[o.entity_type] }, year, totalIncome, totalExpense, profit: r2(totalIncome - totalExpense), incomeTrend: inc.results, expenseTrend: exp.results, byClient: byClient.results, topShare: r2(topShare * 100), firewalls, annualized, compare, payrolls: payrolls.results.reverse() })
})

function periodShift(p: string, delta: number) {
  const d = new Date(`${p}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + delta); return d.toISOString().slice(0, 7)
}

// ---------------- OPC 薪酬：股东工资 + 分红 ----------------
opc.get('/payrolls', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM opc_payrolls WHERE opc_id=? ORDER BY period DESC`).bind(opcId(c)).all<any>()
  rows.results.forEach(r => { r.detail = r.detail_json ? JSON.parse(r.detail_json) : null; delete r.detail_json })
  return c.json(rows.results)
})
/** body: { period, owner_salary?, dividend?, dry_run? } */
opc.post('/payrolls/calculate', async (c) => {
  const id = opcId(c)
  const db = c.env.DB
  const b = await c.req.json<any>()
  const period = b.period || nowPeriod()
  const o = await db.prepare(`SELECT * FROM opcs WHERE id=?`).bind(id).first<any>()
  if (o.entity_type !== 'company') return c.json({ error: '仅一人有限公司（L3）适用股东工资+分红模式；个体户业主所得按经营所得计税，见“税务测算”' }, 422)
  const salary = b.owner_salary != null ? +b.owner_salary : +o.owner_salary
  const dividend = +b.dividend || 0
  const si = socialInsurance(DEFAULT_SOCIAL, o.owner_social_base || salary, o.owner_social_base || salary)
  const year = yearOf(period)
  const hist = await db.prepare(`SELECT COALESCE(SUM(owner_salary),0) inc, COALESCE(SUM(personal_insurance),0) ins, COALESCE(SUM(special_deduction),0) sd, COALESCE(SUM(tax),0) tax, COUNT(*) n FROM opc_payrolls WHERE opc_id=? AND period LIKE ? AND period<?`).bind(id, `${year}-%`, period).first<any>()
  const months = Math.max(1, hist.n + 1)
  const sd = +o.owner_special_deduction || 0
  const w = wageCumulative({ cumIncome: hist.inc + salary, cumInsurance: hist.ins + si.personal + si.personalHousing, cumSpecialDeduction: hist.sd + sd, months, cumTaxPaid: hist.tax })
  const dTax = dividendTax(dividend)
  const net = r2(salary - si.personal - si.personalHousing - w.tax)
  // 分红可行性：本年度累计税后利润
  const inc = await db.prepare(`SELECT COALESCE(SUM(amount),0) a FROM opc_incomes WHERE opc_id=? AND period LIKE ?`).bind(id, `${year}-%`).first<any>()
  const exp = await db.prepare(`SELECT COALESCE(SUM(amount),0) a FROM opc_expenses WHERE opc_id=? AND period LIKE ? AND has_voucher=1`).bind(id, `${year}-%`).first<any>()
  const paidSalary = hist.inc + salary
  const profit = Math.max(0, inc.a - exp.a - paidSalary - (si.employer + si.employerHousing) * months - (o.bookkeeping_fee || 0) * months / 12)
  const cit = corporateIncomeTax(profit)
  const distributable = r2(profit - cit.tax)
  const paidDiv = await db.prepare(`SELECT COALESCE(SUM(dividend),0) d FROM opc_payrolls WHERE opc_id=? AND period LIKE ? AND period<>?`).bind(id, `${year}-%`, period).first<any>()
  const warn = dividend > 0 && dividend + paidDiv.d > distributable ? `警告：本年累计分红${r2(dividend + paidDiv.d)}元超过可分配税后利润${distributable}元，可能被视为抽逃出资或股东借款（视同分红计税）` : null
  const detail = { method: '股东工资：工资薪金累计预扣；分红：股息红利20%', months, formula: w.formula, insurance: si.items, profit: r2(profit), cit: cit.tax, cit_rule: cit.rule, distributable, paid_dividend: paidDiv.d, warn,
    tip: `在小微企业5%税负下，“工资”每元综合税负取决于累计预扣档位（当前${w.rate * 100}%）+社保；“分红”每元综合税负≈5%+95%×20%=24%。当工资累计预扣率低于24%时，适当提高工资比分红更优。` }
  const result = { period, owner_salary: salary, personal_insurance: r2(si.personal + si.personalHousing), employer_insurance: r2(si.employer + si.employerHousing), special_deduction: sd, cum_income: r2(hist.inc + salary), cum_taxable: w.cumTaxable, cum_tax: w.cumTax, tax: w.tax, net, dividend, dividend_tax: dTax, dividend_net: r2(dividend - dTax), total_cash_to_owner: r2(net + dividend - dTax), detail }
  if (b.dry_run) return c.json({ ...result, dry_run: true })
  await db.prepare(`INSERT INTO opc_payrolls (opc_id,period,owner_salary,personal_insurance,employer_insurance,special_deduction,cum_income,cum_taxable,cum_tax,tax,net,dividend,dividend_tax,status,detail_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'calculated',?) ON CONFLICT(opc_id,period) DO UPDATE SET owner_salary=excluded.owner_salary,personal_insurance=excluded.personal_insurance,employer_insurance=excluded.employer_insurance,special_deduction=excluded.special_deduction,cum_income=excluded.cum_income,cum_taxable=excluded.cum_taxable,cum_tax=excluded.cum_tax,tax=excluded.tax,net=excluded.net,dividend=excluded.dividend,dividend_tax=excluded.dividend_tax,status='calculated',detail_json=excluded.detail_json`)
    .bind(id, period, salary, result.personal_insurance, result.employer_insurance, sd, result.cum_income, w.cumTaxable, w.cumTax, w.tax, net, dividend, dTax, JSON.stringify(detail)).run()
  await audit(db, c.get('user'), 'OPC_PAYROLL', `opc:${id}/${period}`, `工资${salary} 分红${dividend}`)
  return c.json(result)
})
opc.post('/payrolls/:period/pay', async (c) => {
  const id = opcId(c)
  const period = c.req.param('period')
  const p = await c.env.DB.prepare(`SELECT * FROM opc_payrolls WHERE opc_id=? AND period=?`).bind(id, period).first<any>()
  if (!p) return c.json({ error: '不存在' }, 404)
  const o = await c.env.DB.prepare(`SELECT name FROM opcs WHERE id=?`).bind(id).first<any>()
  await c.env.DB.prepare(`UPDATE opc_payrolls SET status='paid' WHERE id=?`).bind(p.id).run()
  // 生成申报草稿：工资薪金扣缴 + 股息红利扣缴
  await c.env.DB.prepare(`INSERT INTO tax_filings (filing_no,filing_type,period,subject_type,subject_id,subject_name,record_count,total_income,total_tax,status,payload_json) VALUES (?,?,?,?,?,?,?,?,?,'draft',?)`)
    .bind(genNo('TF'), 'iit_wage', period, 'opc', id, o.name, 1, p.owner_salary + p.dividend, p.tax + p.dividend_tax, JSON.stringify({ salary: p.owner_salary, salary_tax: p.tax, dividend: p.dividend, dividend_tax: p.dividend_tax })).run()
  await audit(c.env.DB, c.get('user'), 'OPC_PAYROLL_PAY', `opc:${id}/${period}`)
  return c.json({ ok: true })
})

// ---------------- 税务测算 ----------------
opc.get('/tax/period', async (c) => {
  const id = opcId(c)
  const db = c.env.DB
  const period = c.req.query('period') || nowPeriod()
  const o = await db.prepare(`SELECT * FROM opcs WHERE id=?`).bind(id).first<any>()
  const inc = (await db.prepare(`SELECT COALESCE(SUM(amount),0) a FROM opc_incomes WHERE opc_id=? AND period=?`).bind(id, period).first<any>()).a
  const exp = (await db.prepare(`SELECT COALESCE(SUM(amount),0) a FROM opc_expenses WHERE opc_id=? AND period=? AND has_voucher=1`).bind(id, period).first<any>()).a
  const year = yearOf(period)
  const yInc = (await db.prepare(`SELECT COALESCE(SUM(amount),0) a FROM opc_incomes WHERE opc_id=? AND period LIKE ? AND period<=?`).bind(id, `${year}-%`, period).first<any>()).a
  const yExp = (await db.prepare(`SELECT COALESCE(SUM(amount),0) a FROM opc_expenses WHERE opc_id=? AND period LIKE ? AND period<=? AND has_voucher=1`).bind(id, `${year}-%`, period).first<any>()).a
  const vat = vatAgent(inc)
  // 12个月累计超500万预警
  const last12 = (await db.prepare(`SELECT COALESCE(SUM(amount),0) a FROM opc_incomes WHERE opc_id=? AND period>? AND period<=?`).bind(id, periodShift(period, -12), period).first<any>()).a
  let incomeTax: any
  if (o.entity_type === 'company') {
    const months = periodMonths(period)
    const salaryCost = (o.owner_salary || 0) * months
    const profit = yInc - yExp - salaryCost - (o.bookkeeping_fee || 0) * months / 12
    const cit = corporateIncomeTax(profit)
    incomeTax = { type: '企业所得税（季度预缴/年度汇算）', ytd_profit: r2(profit), ...cit, note: '股东工资与分红见“OPC薪酬”' }
  } else if (o.entity_type === 'sole_proprietor') {
    const months = periodMonths(period)
    const bt = businessIncomeTax(yInc, yExp, (o.owner_special_deduction || 0) * months, { basicDeduction: 5000 * months })
    incomeTax = { type: '经营所得个税（累计预缴，年应纳税所得额≤200万减半）', ...bt }
  } else {
    const l = laborCumulative({ cumIncome: yInc, months: periodMonths(period), cumTaxPaid: 0 })
    incomeTax = { type: '劳务报酬累计预扣（平台16号公告）', ...l }
  }
  return c.json({ period, entity_type: o.entity_type, stage_name: STAGE_NAME[o.entity_type], month_income: inc, month_expense: exp, ytd_income: yInc, ytd_expense: yExp, vat, incomeTax, last12_income: last12, register_alert: last12 > 5000000 ? '连续12个月累计超500万元，须依法登记为一般纳税人/引导登记市场主体' : null })
})
opc.get('/tax/compare', async (c) => {
  const q = c.req.query()
  return c.json(opcCompare({ annualIncome: +(q.income || 300000), costRatio: q.cost_ratio != null ? +q.cost_ratio : 0.3, ownerSalaryMonthly: q.salary != null ? +q.salary : 6000, bookkeepingFee: q.book != null ? +q.book : 5000, specialDeduction: +(q.sd || 0) }))
})

// ---------------- 三阶跃迁成长建议 ----------------
opc.get('/growth', async (c) => {
  const id = opcId(c)
  const db = c.env.DB
  const o = await db.prepare(`SELECT * FROM opcs WHERE id=?`).bind(id).first<any>()
  const year = new Date().getFullYear().toString()
  const inc = await db.prepare(`SELECT COUNT(DISTINCT period) m, COALESCE(SUM(amount),0) a, COUNT(DISTINCT client_name) clients FROM opc_incomes WHERE opc_id=? AND period LIKE ?`).bind(id, `${year}-%`).first<any>()
  const annualized = inc.m ? r2(inc.a / inc.m * 12) : 0
  const cmp = opcCompare({ annualIncome: annualized || 1, ownerSalaryMonthly: o.owner_salary || 6000, bookkeepingFee: o.bookkeeping_fee || 5000 })
  const stages = [
    { key: 'individual', stage: 'L1 起步期', identity: '平台从业人员（自然人）', income: '< 20万元', tax: '劳务报酬累计预扣；增值税代办，月10万元以下免征', services: ['接单', '结算', '税负测算', '技能认证'] },
    { key: 'sole_proprietor', stage: 'L2 成长期', identity: '个体工商户（查账征收）', income: '20万-60万元', tax: '经营所得5%-35%，年应纳税所得额200万元内减半；增值税小规模', services: ['代注册', '代记账', '经营指导'] },
    { key: 'company', stage: 'L3 公司化', identity: '一人有限公司（OPC）', income: '> 60万元或需承接B端大项目', tax: '小微企业所得税5%+股东工资/分红；可开专票', services: ['注册', '财税托管', '法务', '获客', '算力补贴申报'] },
  ]
  const recommendedKey = cmp.recommend === 'L1' ? 'individual' : cmp.recommend === 'L2' ? 'sole_proprietor' : 'company'
  const checks = [
    { item: '多个客户（真实经营）', ok: inc.clients >= 2, text: `本年度客户数 ${inc.clients}` },
    { item: '年化收入达到升级阈值', ok: annualized >= 200000, text: `年化收入 ${annualized} 元` },
    { item: '自有工具/场地、独立承担经营风险', ok: true, text: '需在升级时签署《真实经营承诺函》' },
    { item: '按成果收费、非类员工劳动', ok: true, text: '风控Agent持续监测客户集中度' },
  ]
  return c.json({ current: o.entity_type, current_name: STAGE_NAME[o.entity_type], annualized, clients: inc.clients, stages, recommended: recommendedKey, reason: cmp.reason, caveat: cmp.caveat, checks, compare: cmp,
    cabin: [
      { module: '开业包', content: '名称核准、注册、银行开户、税务登记、电子发票开通、政策补贴匹配', price: '一次性 1999-3999元' },
      { module: '财税托管', content: '代理记账、纳税申报、年报、发票管理、税负月报', price: '订阅 299-599元/月' },
      { module: '法务包', content: '合同模板、知识产权登记、催收函、争议咨询', price: '订阅 99-199元/月' },
      { module: '接单引擎', content: '平台企业项目优先匹配、OPC能力认证标签', price: '成交佣金 3%-5%' },
      { module: 'AI工具包', content: 'Agent工作流、算力代金券、AI办公套件团购', price: 'SaaS分佣/团购差价' },
      { module: '保障包', content: '职业伤害险、意外险、收入中断险、补充养老', price: '保险经纪分佣' },
    ] })
})

export default opc
