import { Hono } from 'hono'
import { type Env, requireRole, audit, nowPeriod, genNo, periodMonths, yearOf } from '../lib/auth'
import { wageCumulative, laborCumulative, laborLegacy, vatAgent, socialInsurance, DEFAULT_SOCIAL, enterpriseCostCompare, r2, type SocialConfig } from '../lib/tax'
import { scoreLaborRisk, structureDiagnosis } from '../lib/risk'

const ent = new Hono<Env>()
ent.use('*', requireRole('enterprise', 'admin'))

/** 解析当前操作的企业ID：企业用户固定自己的；管理员可通过 ?enterprise_id= 指定 */
function entId(c: any): number {
  const u = c.get('user')
  if (u.role === 'enterprise') return u.enterprise_id
  return Number(c.req.query('enterprise_id') || c.req.param('eid') || 1)
}

// ---------------- 企业信息 & 仪表盘 ----------------
ent.get('/profile', async (c) => {
  const id = entId(c)
  const e = await c.env.DB.prepare(`SELECT * FROM enterprises WHERE id=?`).bind(id).first<any>()
  if (!e) return c.json({ error: '企业不存在' }, 404)
  e.social_config = e.social_config ? JSON.parse(e.social_config) : DEFAULT_SOCIAL
  return c.json(e)
})
ent.put('/profile', async (c) => {
  const id = entId(c)
  const b = await c.req.json<any>()
  await c.env.DB.prepare(`UPDATE enterprises SET name=COALESCE(?,name), taxpayer_type=COALESCE(?,taxpayer_type), industry=COALESCE(?,industry), region=COALESCE(?,region), contact_name=COALESCE(?,contact_name), contact_phone=COALESCE(?,contact_phone), social_config=COALESCE(?,social_config) WHERE id=?`)
    .bind(b.name ?? null, b.taxpayer_type ?? null, b.industry ?? null, b.region ?? null, b.contact_name ?? null, b.contact_phone ?? null, b.social_config ? JSON.stringify(b.social_config) : null, id).run()
  await audit(c.env.DB, c.get('user'), 'UPDATE_ENTERPRISE', `enterprise:${id}`)
  return c.json({ ok: true })
})

ent.get('/dashboard', async (c) => {
  const id = entId(c)
  const period = c.req.query('period') || nowPeriod()
  const db = c.env.DB
  const [emp, tasks, orders, settle, batches, risk] = await Promise.all([
    db.prepare(`SELECT layer, COUNT(*) n FROM employees WHERE enterprise_id=? AND status='active' GROUP BY layer`).bind(id).all(),
    db.prepare(`SELECT status, COUNT(*) n FROM tasks WHERE enterprise_id=? GROUP BY status`).bind(id).all(),
    db.prepare(`SELECT o.status, COUNT(*) n, SUM(o.amount) amt FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE t.enterprise_id=? GROUP BY o.status`).bind(id).all(),
    db.prepare(`SELECT COUNT(*) n, SUM(amount) amt, SUM(service_fee) fee, SUM(iit) iit, SUM(vat+surcharge) vat FROM settlements WHERE enterprise_id=? AND period=?`).bind(id, period).first<any>(),
    db.prepare(`SELECT layer,status,headcount,total_gross,total_employer_cost,total_tax,total_net FROM payroll_batches WHERE enterprise_id=? AND period=?`).bind(id, period).all(),
    db.prepare(`SELECT risk_level, COUNT(*) n FROM tasks WHERE enterprise_id=? GROUP BY risk_level`).bind(id).all(),
  ])
  const employees = await db.prepare(`SELECT layer,employment_type,base_salary,hourly_rate FROM employees WHERE enterprise_id=? AND status='active'`).bind(id).all<any>()
  const diagnosis = structureDiagnosis(employees.results)
  const trend = await db.prepare(`SELECT period, SUM(total_employer_cost) cost, SUM(total_net) net FROM payroll_batches WHERE enterprise_id=? GROUP BY period ORDER BY period DESC LIMIT 6`).bind(id).all()
  return c.json({ period, employees: emp.results, tasks: tasks.results, orders: orders.results, settlement: settle, payroll: batches.results, risk: risk.results, diagnosis, trend: trend.results.reverse() })
})

// ---------------- 人员管理（三层结构） ----------------
ent.get('/employees', async (c) => {
  const id = entId(c)
  const layer = c.req.query('layer')
  const sql = `SELECT e.*, w.verified AS worker_verified FROM employees e LEFT JOIN workers w ON w.id=e.worker_id WHERE e.enterprise_id=? ${layer ? 'AND e.layer=?' : ''} ORDER BY e.layer, e.id`
  const q = layer ? c.env.DB.prepare(sql).bind(id, layer) : c.env.DB.prepare(sql).bind(id)
  const rows = await q.all()
  return c.json(rows.results)
})
ent.post('/employees', async (c) => {
  const id = entId(c)
  const b = await c.req.json<any>()
  if (!b.name || !b.layer || !b.employment_type) return c.json({ error: '姓名、层级、用工形态为必填' }, 400)
  // 任务层：若身份证命中本企业核心层在职/近3个月离职 → 一票否决
  if (b.layer === 'task' && b.id_no) {
    const dup = await c.env.DB.prepare(`SELECT id,name,layer,end_date FROM employees WHERE enterprise_id=? AND id_no=? AND layer IN ('core','flex') AND (end_date IS NULL OR end_date>=date('now','-3 months'))`).bind(id, b.id_no).first<any>()
    if (dup) return c.json({ error: `风控拦截：该人员为本企业${dup.layer === 'core' ? '核心层' : '弹性层'}在职/近3个月离职人员（${dup.name}），禁止以灵活用工方式结算（“老员工转灵工”一票否决）` }, 422)
  }
  const r = await c.env.DB.prepare(`INSERT INTO employees (enterprise_id,name,id_no,phone,layer,employment_type,position,department,base_salary,hourly_rate,social_base,housing_base,special_deduction,start_date,bank_account,worker_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, b.name, b.id_no || null, b.phone || null, b.layer, b.employment_type, b.position || null, b.department || null, +b.base_salary || 0, +b.hourly_rate || 0, +b.social_base || +b.base_salary || 0, +b.housing_base || +b.base_salary || 0, +b.special_deduction || 0, b.start_date || null, b.bank_account || null, b.worker_id || null).run()
  await audit(c.env.DB, c.get('user'), 'CREATE_EMPLOYEE', `employee:${r.meta.last_row_id}`, `${b.name}/${b.layer}/${b.employment_type}`)
  return c.json({ id: r.meta.last_row_id })
})
ent.put('/employees/:id', async (c) => {
  const eid = entId(c)
  const id = c.req.param('id')
  const b = await c.req.json<any>()
  await c.env.DB.prepare(`UPDATE employees SET name=?,id_no=?,phone=?,layer=?,employment_type=?,position=?,department=?,base_salary=?,hourly_rate=?,social_base=?,housing_base=?,special_deduction=?,start_date=?,end_date=?,bank_account=?,status=? WHERE id=? AND enterprise_id=?`)
    .bind(b.name, b.id_no || null, b.phone || null, b.layer, b.employment_type, b.position || null, b.department || null, +b.base_salary || 0, +b.hourly_rate || 0, +b.social_base || 0, +b.housing_base || 0, +b.special_deduction || 0, b.start_date || null, b.end_date || null, b.bank_account || null, b.status || 'active', id, eid).run()
  await audit(c.env.DB, c.get('user'), 'UPDATE_EMPLOYEE', `employee:${id}`)
  return c.json({ ok: true })
})
ent.delete('/employees/:id', async (c) => {
  const eid = entId(c)
  await c.env.DB.prepare(`UPDATE employees SET status='inactive', end_date=date('now') WHERE id=? AND enterprise_id=?`).bind(c.req.param('id'), eid).run()
  await audit(c.env.DB, c.get('user'), 'DEACTIVATE_EMPLOYEE', `employee:${c.req.param('id')}`)
  return c.json({ ok: true })
})

ent.get('/structure', async (c) => {
  const id = entId(c)
  const employees = await c.env.DB.prepare(`SELECT layer,employment_type,base_salary,hourly_rate FROM employees WHERE enterprise_id=? AND status='active'`).bind(id).all<any>()
  return c.json(structureDiagnosis(employees.results))
})

// ---------------- 薪酬管理 ----------------
ent.get('/payroll/batches', async (c) => {
  const id = entId(c)
  const rows = await c.env.DB.prepare(`SELECT * FROM payroll_batches WHERE enterprise_id=? ORDER BY period DESC, layer`).bind(id).all()
  return c.json(rows.results)
})
ent.get('/payroll/batches/:id', async (c) => {
  const eid = entId(c)
  const b = await c.env.DB.prepare(`SELECT * FROM payroll_batches WHERE id=? AND enterprise_id=?`).bind(c.req.param('id'), eid).first<any>()
  if (!b) return c.json({ error: '批次不存在' }, 404)
  const items = await c.env.DB.prepare(`SELECT * FROM payroll_items WHERE batch_id=? ORDER BY id`).bind(b.id).all<any>()
  items.results.forEach(i => { i.detail = i.detail_json ? JSON.parse(i.detail_json) : null; delete i.detail_json })
  return c.json({ ...b, items: items.results })
})

/**
 * 核心：薪酬试算/生成批次
 * body: { period:'YYYY-MM', layer:'core'|'flex'|'task', inputs:[{employee_id, bonus?, hours?, units?, gross?}] , dry_run?:bool }
 */
ent.post('/payroll/calculate', async (c) => {
  const eid = entId(c)
  const db = c.env.DB
  const b = await c.req.json<any>()
  const period: string = b.period || nowPeriod()
  const layer: string = b.layer
  if (!['core', 'flex', 'task'].includes(layer)) return c.json({ error: 'layer 必须为 core/flex/task' }, 400)
  const e = await db.prepare(`SELECT * FROM enterprises WHERE id=?`).bind(eid).first<any>()
  const cfg: SocialConfig = e.social_config ? JSON.parse(e.social_config) : DEFAULT_SOCIAL
  const emps = (await db.prepare(`SELECT * FROM employees WHERE enterprise_id=? AND layer=? AND status='active'`).bind(eid, layer).all<any>()).results
  const inputMap = new Map<number, any>((b.inputs || []).map((x: any) => [Number(x.employee_id), x]))
  const months = periodMonths(period)
  const year = yearOf(period)

  const items: any[] = []
  for (const emp of emps) {
    const inp = inputMap.get(emp.id) || {}
    // 历史累计（本年度、本期之前、已生成批次）
    const hist = await db.prepare(`SELECT COALESCE(SUM(pi.gross+pi.bonus),0) inc, COALESCE(SUM(pi.personal_insurance+pi.personal_housing),0) ins, COALESCE(SUM(pi.special_deduction),0) sd, COALESCE(SUM(pi.tax),0) tax, COUNT(*) n FROM payroll_items pi JOIN payroll_batches pb ON pb.id=pi.batch_id WHERE pi.employee_id=? AND pb.period LIKE ? AND pb.period<? AND pb.id<>COALESCE(?, -1)`)
      .bind(emp.id, `${year}-%`, period, null).first<any>()

    let item: any = { employee_id: emp.id, employee_name: emp.name, employment_type: emp.employment_type, position: emp.position }
    if (layer === 'core') {
      const gross = inp.gross != null ? +inp.gross : +emp.base_salary
      const bonus = +inp.bonus || 0
      const si = socialInsurance(cfg, emp.social_base || gross, emp.housing_base || gross)
      const sd = +emp.special_deduction || 0
      const cumMonths = Math.max(1, hist.n + 1)
      const w = wageCumulative({ cumIncome: hist.inc + gross + bonus, cumInsurance: hist.ins + si.personal + si.personalHousing, cumSpecialDeduction: hist.sd + sd, months: cumMonths, cumTaxPaid: hist.tax })
      const net = r2(gross + bonus - si.personal - si.personalHousing - w.tax)
      const cost = r2(gross + bonus + si.employer + si.employerHousing)
      item = { ...item, gross, bonus, personal_insurance: si.personal, personal_housing: si.personalHousing, employer_insurance: si.employer, employer_housing: si.employerHousing, special_deduction: sd, cum_income: r2(hist.inc + gross + bonus), cum_taxable: w.cumTaxable, cum_tax: w.cumTax, tax: w.tax, net, employer_cost: cost,
        detail: { method: '工资薪金累计预扣法（61号公告）', months: cumMonths, rate: w.rate, quick: w.quick, formula: w.formula, insurance: si.items } }
    } else if (layer === 'flex') {
      if (emp.employment_type === 'parttime') {
        const hours = +inp.hours || 0
        const gross = r2(hours * (+emp.hourly_rate || 0))
        const si = socialInsurance(cfg, Math.max(gross, cfg.base_min), 0, { injuryOnly: true })
        const cumMonths = Math.max(1, hist.n + 1)
        const w = wageCumulative({ cumIncome: hist.inc + gross, cumInsurance: hist.ins, cumSpecialDeduction: hist.sd + (+emp.special_deduction || 0), months: cumMonths, cumTaxPaid: hist.tax })
        const warn = hours > 24 * 4.33 ? `本期工时${hours}h，折算周工时>${Math.round(hours / 4.33)}h，超过非全日制24小时上限，存在被认定全日制劳动关系风险` : null
        item = { ...item, gross, hours, personal_insurance: 0, employer_insurance: si.employer, special_deduction: +emp.special_deduction || 0, cum_income: r2(hist.inc + gross), cum_taxable: w.cumTaxable, cum_tax: w.cumTax, tax: w.tax, net: r2(gross - w.tax), employer_cost: r2(gross + si.employer),
          detail: { method: '非全日制：按小时计薪、单独缴纳工伤保险、工资薪金累计预扣', formula: w.formula, warn } }
      } else {
        // 劳务派遣 / 业务外包：企业支付给派遣/外包单位，取得合规发票（6%或差额），不代扣个税
        const gross = inp.gross != null ? +inp.gross : +emp.base_salary
        const vatInput = e.taxpayer_type === 'general' ? r2(gross / 1.06 * 0.06) : 0
        item = { ...item, gross, tax: 0, net: gross, employer_cost: r2(gross - vatInput),
          detail: { method: emp.employment_type === 'dispatch' ? '劳务派遣：向派遣单位支付，取得发票；派遣比例≤10%' : '业务外包：向外包单位支付，取得合规发票作为税前扣除凭证', vat_input: vatInput, note: '个税由派遣/外包单位扣缴' } }
      }
    } else {
      // 任务层：平台灵活用工 → 劳务报酬累计预扣（16号公告）+ 增值税代办 + 平台服务费
      const wid = emp.worker_id
      let gross = inp.gross != null ? +inp.gross : 0
      if (!gross && wid) {
        const acc = await db.prepare(`SELECT COALESCE(SUM(o.amount),0) amt FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE t.enterprise_id=? AND o.worker_id=? AND o.status='accepted'`).bind(eid, wid).first<any>()
        gross = acc.amt
      }
      // 从业人员在本平台的本年度累计（跨企业合并）
      const wh = wid ? await db.prepare(`SELECT COALESCE(SUM(amount),0) inc, COALESCE(SUM(iit),0) tax, COUNT(DISTINCT period) n FROM settlements WHERE worker_id=? AND period LIKE ? AND period<?`).bind(wid, `${year}-%`, period).first<any>() : { inc: 0, tax: 0, n: 0 }
      const monthSales = wid ? ((await db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM settlements WHERE worker_id=? AND period=?`).bind(wid, period).first<any>())?.s || 0) + gross : gross
      const cumMonths = Math.max(1, wh.n + 1)
      const l = laborCumulative({ cumIncome: wh.inc + gross, months: cumMonths, cumTaxPaid: wh.tax })
      const v = vatAgent(monthSales)
      const vat = monthSales > 0 ? r2(v.vat * gross / monthSales) : 0
      const sur = monthSales > 0 ? r2(v.surcharge * gross / monthSales) : 0
      const fee = r2(gross * (e.service_rate || 0.05))
      const legacy = laborLegacy(gross)
      item = { ...item, gross, tax: l.tax, vat, surcharge: sur, service_fee: fee, cum_income: r2(wh.inc + gross), cum_taxable: l.cumTaxable, cum_tax: l.cumTax, net: r2(gross - l.tax - vat - sur), employer_cost: r2(gross + fee),
        detail: { method: '平台灵活用工：劳务报酬累计预扣（16号公告）+ 增值税代办申报', months: cumMonths, formula: l.formula, vat_rule: v.rule, legacy_tax: legacy.tax, saving_vs_legacy: r2(legacy.tax - l.tax), evidence: ['任务合同', '验收单', '结算明细', '个税扣缴记录', '增值税代办完税凭证'] } }
    }
    items.push(item)
  }
  const sum = (k: string) => r2(items.reduce((s, i) => s + (+i[k] || 0), 0))
  const totals = { headcount: items.length, total_gross: r2(sum('gross') + sum('bonus')), total_personal_insurance: r2(sum('personal_insurance') + sum('personal_housing')), total_employer_insurance: r2(sum('employer_insurance') + sum('employer_housing')), total_tax: sum('tax'), total_net: sum('net'), total_employer_cost: sum('employer_cost') }

  if (b.dry_run) return c.json({ period, layer, ...totals, items, dry_run: true })

  // 落库：先删后插（同期同层唯一）
  const existing = await db.prepare(`SELECT id,status FROM payroll_batches WHERE enterprise_id=? AND period=? AND layer=?`).bind(eid, period, layer).first<any>()
  if (existing && existing.status === 'paid') return c.json({ error: '该期间批次已发放，不可重算' }, 409)
  let batchId: number
  if (existing) {
    batchId = existing.id
    await db.prepare(`DELETE FROM payroll_items WHERE batch_id=?`).bind(batchId).run()
    await db.prepare(`UPDATE payroll_batches SET status='calculated',headcount=?,total_gross=?,total_personal_insurance=?,total_employer_insurance=?,total_tax=?,total_net=?,total_employer_cost=? WHERE id=?`)
      .bind(totals.headcount, totals.total_gross, totals.total_personal_insurance, totals.total_employer_insurance, totals.total_tax, totals.total_net, totals.total_employer_cost, batchId).run()
  } else {
    const r = await db.prepare(`INSERT INTO payroll_batches (enterprise_id,period,layer,status,headcount,total_gross,total_personal_insurance,total_employer_insurance,total_tax,total_net,total_employer_cost) VALUES (?,?,?,'calculated',?,?,?,?,?,?,?)`)
      .bind(eid, period, layer, totals.headcount, totals.total_gross, totals.total_personal_insurance, totals.total_employer_insurance, totals.total_tax, totals.total_net, totals.total_employer_cost).run()
    batchId = r.meta.last_row_id as number
  }
  for (const i of items) {
    await db.prepare(`INSERT INTO payroll_items (batch_id,employee_id,employee_name,gross,bonus,hours,units,personal_insurance,personal_housing,employer_insurance,employer_housing,special_deduction,cum_income,cum_taxable,cum_tax,tax,vat,surcharge,service_fee,net,employer_cost,detail_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(batchId, i.employee_id, i.employee_name, i.gross || 0, i.bonus || 0, i.hours || 0, i.units || 0, i.personal_insurance || 0, i.personal_housing || 0, i.employer_insurance || 0, i.employer_housing || 0, i.special_deduction || 0, i.cum_income || 0, i.cum_taxable || 0, i.cum_tax || 0, i.tax || 0, i.vat || 0, i.surcharge || 0, i.service_fee || 0, i.net || 0, i.employer_cost || 0, JSON.stringify(i.detail || {})).run()
  }
  await audit(db, c.get('user'), 'PAYROLL_CALC', `batch:${batchId}`, `${period}/${layer}/${items.length}人`)
  return c.json({ batch_id: batchId, period, layer, ...totals, items })
})

ent.post('/payroll/batches/:id/approve', async (c) => {
  const eid = entId(c)
  await c.env.DB.prepare(`UPDATE payroll_batches SET status='approved', approved_at=datetime('now') WHERE id=? AND enterprise_id=? AND status='calculated'`).bind(c.req.param('id'), eid).run()
  await audit(c.env.DB, c.get('user'), 'PAYROLL_APPROVE', `batch:${c.req.param('id')}`)
  return c.json({ ok: true })
})

/** 发放：核心/弹性层 → 生成工资薪金扣缴申报草稿；任务层 → 生成结算记录 + 劳务报酬累计预扣申报 + 增值税代办 + 委托代征记录 */
ent.post('/payroll/batches/:id/pay', async (c) => {
  const eid = entId(c)
  const db = c.env.DB
  const batch = await db.prepare(`SELECT * FROM payroll_batches WHERE id=? AND enterprise_id=? AND status IN ('approved','calculated')`).bind(c.req.param('id'), eid).first<any>()
  if (!batch) return c.json({ error: '批次不存在或状态不允许发放' }, 404)
  const e = await db.prepare(`SELECT * FROM enterprises WHERE id=?`).bind(eid).first<any>()
  const items = (await db.prepare(`SELECT pi.*, em.worker_id FROM payroll_items pi JOIN employees em ON em.id=pi.employee_id WHERE batch_id=?`).bind(batch.id).all<any>()).results

  if (batch.layer === 'task') {
    const agreement = await db.prepare(`SELECT id FROM collection_agreements WHERE status='active' AND (region=? OR region IS NULL) ORDER BY region DESC LIMIT 1`).bind(e.region).first<any>()
    for (const i of items) {
      if (!i.worker_id || i.gross <= 0) continue
      const no = genNo('ST')
      const evidence = { contract: `CT-${i.worker_id}-${batch.period}`, acceptance: '已验收', settlement_no: no, iit_record: i.tax, vat_record: i.vat + i.surcharge, generated_at: new Date().toISOString(), retention: '≥10年' }
      const r = await db.prepare(`INSERT INTO settlements (settlement_no,enterprise_id,worker_id,period,amount,service_fee,vat,surcharge,iit,net,cum_income,cum_tax,status,evidence_json,paid_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'paid',?,datetime('now'))`)
        .bind(no, eid, i.worker_id, batch.period, i.gross, i.service_fee, i.vat, i.surcharge, i.tax, i.net, i.cum_income, i.cum_tax, JSON.stringify(evidence)).run()
      if (agreement && (i.vat > 0 || i.surcharge > 0)) {
        await db.prepare(`INSERT INTO collection_records (agreement_id,settlement_id,worker_id,period,tax_type,tax_base,rate,amount) VALUES (?,?,?,?,'vat',?,0.01,?),(?,?,?,?,'surcharge',?,0.06,?)`)
          .bind(agreement.id, r.meta.last_row_id, i.worker_id, batch.period, i.gross, i.vat, agreement.id, r.meta.last_row_id, i.worker_id, batch.period, i.vat, i.surcharge).run()
      }
      await db.prepare(`UPDATE task_orders SET status='settled' WHERE worker_id=? AND status='accepted' AND task_id IN (SELECT id FROM tasks WHERE enterprise_id=?)`).bind(i.worker_id, eid).run()
    }
    // 平台侧申报草稿：劳务报酬累计预扣（平台为扣缴义务人）
    await upsertFiling(db, 'iit_labor', batch.period, 'platform', null, '云工智合佳平台（扣缴义务人）', items.length, r2(items.reduce((s, i) => s + i.gross, 0)), r2(items.reduce((s, i) => s + i.tax, 0)), { source_batch: batch.id, enterprise: e.name })
    await upsertFiling(db, 'vat_agent', batch.period, 'platform', null, '云工智合佳平台（代办申报）', items.length, r2(items.reduce((s, i) => s + i.gross, 0)), r2(items.reduce((s, i) => s + i.vat + i.surcharge, 0)), { source_batch: batch.id })
  } else {
    await upsertFiling(db, 'iit_wage', batch.period, 'enterprise', eid, e.name, items.length, batch.total_gross, batch.total_tax, { source_batch: batch.id, layer: batch.layer })
  }
  await db.prepare(`UPDATE payroll_batches SET status='paid', paid_at=datetime('now') WHERE id=?`).bind(batch.id).run()
  await audit(db, c.get('user'), 'PAYROLL_PAY', `batch:${batch.id}`, `${batch.period}/${batch.layer} 发放完成，申报草稿已生成`)
  return c.json({ ok: true })
})

async function upsertFiling(db: D1Database, type: string, period: string, stype: string, sid: number | null, sname: string, cnt: number, income: number, tax: number, payload: any) {
  const ex = await db.prepare(`SELECT id,record_count,total_income,total_tax,status FROM tax_filings WHERE filing_type=? AND period=? AND subject_type=? AND COALESCE(subject_id,0)=COALESCE(?,0) AND status IN ('draft','reviewed')`).bind(type, period, stype, sid).first<any>()
  if (ex) {
    await db.prepare(`UPDATE tax_filings SET record_count=record_count+?, total_income=total_income+?, total_tax=total_tax+?, status='draft' WHERE id=?`).bind(cnt, income, tax, ex.id).run()
  } else {
    await db.prepare(`INSERT INTO tax_filings (filing_no,filing_type,period,subject_type,subject_id,subject_name,record_count,total_income,total_tax,status,payload_json) VALUES (?,?,?,?,?,?,?,?,?,'draft',?)`)
      .bind(genNo('TF'), type, period, stype, sid, sname, cnt, income, tax, JSON.stringify(payload)).run()
  }
}

ent.get('/payroll/payslip/:item_id', async (c) => {
  const row = await c.env.DB.prepare(`SELECT pi.*, pb.period, pb.layer, en.name enterprise_name FROM payroll_items pi JOIN payroll_batches pb ON pb.id=pi.batch_id JOIN enterprises en ON en.id=pb.enterprise_id WHERE pi.id=? AND pb.enterprise_id=?`).bind(c.req.param('item_id'), entId(c)).first<any>()
  if (!row) return c.json({ error: '不存在' }, 404)
  row.detail = row.detail_json ? JSON.parse(row.detail_json) : null; delete row.detail_json
  return c.json(row)
})

// ---------------- 任务与交付 ----------------
ent.get('/tasks', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT t.*, (SELECT COUNT(*) FROM task_orders o WHERE o.task_id=t.id) order_count, (SELECT COUNT(*) FROM task_orders o WHERE o.task_id=t.id AND o.status='delivered') delivered_count FROM tasks t WHERE enterprise_id=? ORDER BY id DESC`).bind(entId(c)).all<any>()
  rows.results.forEach(t => { t.risk_detail = t.risk_detail ? JSON.parse(t.risk_detail) : null })
  return c.json(rows.results)
})
ent.post('/tasks/assess', async (c) => {
  const b = await c.req.json<any>()
  return c.json(scoreLaborRisk(b))
})
ent.post('/tasks', async (c) => {
  const eid = entId(c)
  const b = await c.req.json<any>()
  if (!b.title) return c.json({ error: '任务标题必填' }, 400)
  const risk = scoreLaborRisk({ ...b, has_deliverable: !!b.deliverable_spec })
  const status = risk.decision === 'block' ? 'blocked' : risk.decision === 'review' ? 'review' : 'published'
  const budget = +b.budget || r2((+b.unit_price || 0) * (+b.quantity || 1))
  const r = await c.env.DB.prepare(`INSERT INTO tasks (enterprise_id,title,category,description,pricing_mode,unit_price,quantity,budget,deliverable_spec,acceptance_std,risk_score,risk_level,risk_detail,status,deadline) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(eid, b.title, b.category || null, b.description || null, b.pricing_mode || 'piece', +b.unit_price || 0, +b.quantity || 1, budget, b.deliverable_spec || null, b.acceptance_std || null, risk.score, risk.level, JSON.stringify(risk), status, b.deadline || null).run()
  await c.env.DB.prepare(`INSERT INTO risk_assessments (subject_type,subject_id,enterprise_id,score,level,factors_json,decision) VALUES ('task',?,?,?,?,?,?)`).bind(r.meta.last_row_id, eid, risk.score, risk.level, JSON.stringify(risk.factors), risk.decision).run()
  await audit(c.env.DB, c.get('user'), 'CREATE_TASK', `task:${r.meta.last_row_id}`, `${b.title} 风险${risk.score}分/${risk.level}`)
  return c.json({ id: r.meta.last_row_id, status, risk })
})
ent.get('/tasks/:id/orders', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT o.*, w.name worker_name, w.verified FROM task_orders o JOIN workers w ON w.id=o.worker_id JOIN tasks t ON t.id=o.task_id WHERE o.task_id=? AND t.enterprise_id=? ORDER BY o.id`).bind(c.req.param('id'), entId(c)).all()
  return c.json(rows.results)
})
ent.post('/tasks/:id/orders', async (c) => {
  const b = await c.req.json<any>()
  const res = await signOrder(c, entId(c), Number(c.req.param('id')), Number(b.worker_id))
  if ('error' in res) return c.json(res, res.error.includes('不存在') ? 404 : 422)
  return c.json(res)
})
ent.post('/orders/:id/deliver', async (c) => {
  const b = await c.req.json<any>()
  const o = await c.env.DB.prepare(`SELECT o.*, t.unit_price, t.pricing_mode, t.enterprise_id FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE o.id=?`).bind(c.req.param('id')).first<any>()
  if (!o || o.enterprise_id !== entId(c)) return c.json({ error: '订单不存在' }, 404)
  const qty = +b.quantity_done || 1
  const amount = b.amount != null ? +b.amount : r2(qty * o.unit_price)
  const hash = await (async () => { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${o.id}|${b.deliverable_desc || ''}|${Date.now()}`)); return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('') })()
  await c.env.DB.prepare(`UPDATE task_orders SET status='delivered', quantity_done=?, amount=?, deliverable_desc=?, deliverable_hash=?, delivered_at=datetime('now') WHERE id=?`).bind(qty, amount, b.deliverable_desc || null, hash, o.id).run()
  await audit(c.env.DB, c.get('user'), 'DELIVER', `order:${o.id}`, `交付${qty}，金额${amount}，存证${hash.slice(0, 12)}`)
  return c.json({ ok: true, deliverable_hash: hash, amount })
})
ent.post('/orders/:id/accept', async (c) => {
  const u = c.get('user')
  const b = await c.req.json<any>().catch(() => ({}))
  const o = await c.env.DB.prepare(`SELECT o.*, t.enterprise_id FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE o.id=?`).bind(c.req.param('id')).first<any>()
  if (!o || o.enterprise_id !== entId(c)) return c.json({ error: '订单不存在' }, 404)
  if (b.reject) {
    await c.env.DB.prepare(`UPDATE task_orders SET status='rejected' WHERE id=?`).bind(o.id).run()
    await audit(c.env.DB, u, 'REJECT', `order:${o.id}`, b.reason || '')
    return c.json({ ok: true })
  }
  if (o.status !== 'delivered') return c.json({ error: '订单尚未交付' }, 422)
  await c.env.DB.prepare(`UPDATE task_orders SET status='accepted', accepted_at=datetime('now'), accepted_by=? WHERE id=?`).bind(u.display_name, o.id).run()
  await audit(c.env.DB, u, 'ACCEPT', `order:${o.id}`, `验收通过，金额${o.amount}`)
  return c.json({ ok: true })
})

// 接单申请
ent.get('/applications', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT a.*, t.title, t.unit_price, t.quantity, w.name worker_name, w.skills, w.region, w.verified FROM task_applications a JOIN tasks t ON t.id=a.task_id JOIN workers w ON w.id=a.worker_id WHERE t.enterprise_id=? AND a.status='pending' ORDER BY a.id DESC`).bind(entId(c)).all()
  return c.json(rows.results)
})
ent.post('/applications/:id/decide', async (c) => {
  const eid = entId(c)
  const { accept } = await c.req.json<any>()
  const a = await c.env.DB.prepare(`SELECT a.*, t.enterprise_id FROM task_applications a JOIN tasks t ON t.id=a.task_id WHERE a.id=?`).bind(c.req.param('id')).first<any>()
  if (!a || a.enterprise_id !== eid) return c.json({ error: '申请不存在' }, 404)
  if (!accept) { await c.env.DB.prepare(`UPDATE task_applications SET status='rejected' WHERE id=?`).bind(a.id).run(); return c.json({ ok: true }) }
  // 复用签约逻辑
  const res = await signOrder(c, eid, a.task_id, a.worker_id)
  if ('error' in res) return c.json(res, 422)
  await c.env.DB.prepare(`UPDATE task_applications SET status='accepted' WHERE id=?`).bind(a.id).run()
  return c.json(res)
})

/** 一键演示：为当前企业跑通 发布任务→签约→交付→验收 全链路（仅演示用） */
ent.post('/demo/run-flow', async (c) => {
  const eid = entId(c), db = c.env.DB
  const u = c.get('user')
  const r = await db.prepare(`INSERT INTO tasks (enterprise_id,title,category,description,pricing_mode,unit_price,quantity,budget,deliverable_spec,acceptance_std,risk_score,risk_level,risk_detail,status,deadline) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(eid, `演示任务 · 短视频剪辑（${new Date().toISOString().slice(11, 16)}）`, '直播电商/MCN', '按条交付成片，含字幕与封面', 'piece', 300, 10, 3000, '成片MP4 + 封面', '时长≥60s，通过验收', 0, 'green', JSON.stringify({ score: 0, level: 'green', decision: 'pass', factors: [], advice: '自动放行', basis: '', aiNote: '' }), 'published', null).run()
  const tid = r.meta.last_row_id as number
  const worker = await db.prepare(`SELECT id,name FROM workers WHERE verified=1 AND id NOT IN (SELECT COALESCE(worker_id,0) FROM employees WHERE enterprise_id=? AND layer IN ('core','flex')) ORDER BY id LIMIT 1`).bind(eid).first<any>()
  const sign = await signOrder(c, eid, tid, worker.id)
  if ('error' in sign) return c.json(sign, 422)
  const hash = await sha(`${sign.id}|demo|${Date.now()}`)
  await db.prepare(`UPDATE task_orders SET status='accepted', quantity_done=10, amount=3000, deliverable_desc='10条成片（演示）', deliverable_hash=?, delivered_at=datetime('now'), accepted_at=datetime('now'), accepted_by=? WHERE id=?`).bind(hash, u.display_name, sign.id).run()
  await audit(db, u, 'DEMO_FLOW', `task:${tid}`, `演示：发布→${worker.name}签约→交付→验收，金额3000`)
  return c.json({ ok: true, task_id: tid, worker: worker.name, amount: 3000, next: '前往「薪酬管理」试算任务层，即可看到该笔3000元进入结算' })
})

async function sha(s: string) { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('') }
async function signOrder(c: any, eid: number, taskId: number, workerId: number): Promise<any> {
  const db = c.env.DB
  const t = await db.prepare(`SELECT * FROM tasks WHERE id=? AND enterprise_id=?`).bind(taskId, eid).first<any>()
  if (!t) return { error: '任务不存在' }
  if (t.status !== 'published') return { error: `任务状态为${t.status}，不可派单` }
  const w = await db.prepare(`SELECT * FROM workers WHERE id=?`).bind(workerId).first<any>()
  if (!w) return { error: '从业人员不存在' }
  if (!w.verified) return { error: '该从业人员尚未完成实名核验，不可签约（16号公告强制）' }
  if (!w.authorized_filing) return { error: '该从业人员尚未签署代办申报授权书' }
  const dup = await db.prepare(`SELECT id,name FROM employees WHERE enterprise_id=? AND id_no=? AND layer IN ('core','flex') AND status='active'`).bind(eid, w.id_no).first<any>()
  if (dup) return { error: `风控拦截：${w.name} 为本企业在职员工，禁止以灵活用工签约` }
  const no = genNo('CT')
  const hash = await sha(`${no}|${t.id}|${w.id}|${Date.now()}`)
  const r = await db.prepare(`INSERT INTO task_orders (task_id,worker_id,contract_no,contract_hash,status) VALUES (?,?,?,?,'signed')`).bind(t.id, w.id, no, hash).run()
  const ex = await db.prepare(`SELECT id FROM employees WHERE enterprise_id=? AND worker_id=?`).bind(eid, w.id).first()
  if (!ex) await db.prepare(`INSERT INTO employees (enterprise_id,name,id_no,phone,layer,employment_type,position,start_date,worker_id) VALUES (?,?,?,?,'task','platform',?,date('now'),?)`).bind(eid, w.name, w.id_no, w.phone, t.category || '平台任务', w.id).run()
  await audit(db, c.get('user'), 'SIGN_ORDER', `order:${r.meta.last_row_id}`, `${t.title} → ${w.name} 电子合同${no}`)
  return { id: r.meta.last_row_id, contract_no: no, contract_hash: hash }
}

ent.get('/workers', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT id,name,phone,verified,authorized_filing,region,skills,status FROM workers WHERE status='active' ORDER BY id`).all()
  return c.json(rows.results)
})

// ---------------- 结算与凭证包 ----------------
ent.get('/settlements', async (c) => {
  const period = c.req.query('period')
  const sql = `SELECT s.*, w.name worker_name FROM settlements s JOIN workers w ON w.id=s.worker_id WHERE s.enterprise_id=? ${period ? 'AND s.period=?' : ''} ORDER BY s.id DESC LIMIT 200`
  const q = period ? c.env.DB.prepare(sql).bind(entId(c), period) : c.env.DB.prepare(sql).bind(entId(c))
  const rows = await q.all<any>()
  rows.results.forEach(s => { s.evidence = s.evidence_json ? JSON.parse(s.evidence_json) : null; delete s.evidence_json })
  return c.json(rows.results)
})
ent.get('/settlements/:id/evidence', async (c) => {
  const s = await c.env.DB.prepare(`SELECT s.*, w.name worker_name, w.id_no, e.name enterprise_name FROM settlements s JOIN workers w ON w.id=s.worker_id JOIN enterprises e ON e.id=s.enterprise_id WHERE s.id=? AND s.enterprise_id=?`).bind(c.req.param('id'), entId(c)).first<any>()
  if (!s) return c.json({ error: '不存在' }, 404)
  const order = s.task_order_id ? await c.env.DB.prepare(`SELECT o.*, t.title FROM task_orders o JOIN tasks t ON t.id=o.task_id WHERE o.id=?`).bind(s.task_order_id).first() : null
  const collection = await c.env.DB.prepare(`SELECT * FROM collection_records WHERE settlement_id=?`).bind(s.id).all()
  return c.json({
    package_no: `EV-${s.settlement_no}`,
    five_flows: {
      contract: { name: '合同流', items: order ? [{ type: '电子服务合作协议', no: (order as any).contract_no, hash: (order as any).contract_hash }] : [{ type: '三方协议', no: `AGR-${s.enterprise_id}-${s.worker_id}` }] },
      business: { name: '业务流', items: [{ type: '任务单/验收单', desc: (order as any)?.deliverable_desc || '按结算明细', hash: (order as any)?.deliverable_hash }] },
      capital: { name: '资金流', items: [{ type: '持牌支付机构分账流水', no: s.settlement_no, amount: s.net, direction: '企业→平台受托账户→从业人员（单向）' }] },
      invoice: { name: '票据流', items: [{ type: '平台技术服务费发票（6%）', amount: s.service_fee }, { type: '增值税代办完税凭证', amount: r2(s.vat + s.surcharge) }] },
      tax: { name: '个税流', items: [{ type: '劳务报酬累计预扣扣缴记录', amount: s.iit, cum_income: s.cum_income, cum_tax: s.cum_tax }] },
    },
    collection: collection.results,
    worker: { name: s.worker_name, id_no_masked: (s.id_no || '').replace(/^(\d{6})\d{8}(\d{4})$/, '$1********$2') },
    enterprise: s.enterprise_name, period: s.period, retention: '保存≥10年', generated_at: new Date().toISOString(),
    disclaimer: '凭证包支持用工成本依法税前扣除（具体以主管税务机关口径为准）',
  })
})

// ---------------- 成本对比 & 合规体检 ----------------
ent.get('/cost-compare', async (c) => {
  const e = await c.env.DB.prepare(`SELECT taxpayer_type, service_rate FROM enterprises WHERE id=?`).bind(entId(c)).first<any>()
  const payout = +(c.req.query('payout') || 300000)
  return c.json(enterpriseCostCompare(payout, (c.req.query('taxpayer_type') as any) || e.taxpayer_type, e.service_rate))
})

ent.get('/audit-logs', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE enterprise_id=?) OR role='system' ORDER BY id DESC LIMIT 50`).bind(entId(c)).all()
  return c.json(rows.results)
})

export default ent
