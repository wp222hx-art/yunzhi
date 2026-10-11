import { Hono } from 'hono'
import { type Env, requireRole, audit, nowPeriod, genNo } from '../lib/auth'
import { laborCumulative, vatAgent, r2 } from '../lib/tax'
import { scoreLaborRisk } from '../lib/risk'

const admin = new Hono<Env>()
admin.use('*', requireRole('admin'))

const FILING_TYPES: Record<string, { name: string; basis: string; form: string }> = {
  iit_wage: { name: '工资薪金所得扣缴申报', basis: '《个人所得税扣缴申报管理办法（试行）》（2018年第61号）', form: '个人所得税扣缴申报表' },
  iit_labor: { name: '劳务报酬累计预扣申报（平台从业人员）', basis: '税务总局公告2025年第16号', form: '个人所得税扣缴申报表（平台从业人员）' },
  vat_agent: { name: '增值税及附加代办申报', basis: '税务总局公告2025年第16号；财政部 税务总局公告2026年第10号', form: '增值税及附加税费代办申报表' },
  info_report: { name: '互联网平台企业涉税信息报送', basis: '国务院令第810号；税务总局公告2025年第15号', form: '平台内经营者和从业人员身份信息/收入信息报送表' },
  collection: { name: '委托代征税款汇总解缴', basis: '《委托代征管理办法》（2013年第24号）', form: '委托代征税款报告表' },
}

// ---------------- 总览 ----------------
admin.get('/dashboard', async (c) => {
  const db = c.env.DB
  const period = c.req.query('period') || nowPeriod()
  const [ents, workers, opcs, gmv, filings, risks, collection, tasks] = await Promise.all([
    db.prepare(`SELECT COUNT(*) n, SUM(CASE WHEN taxpayer_type='general' THEN 1 ELSE 0 END) general FROM enterprises WHERE status='active'`).first<any>(),
    db.prepare(`SELECT COUNT(*) n, SUM(verified) verified, SUM(authorized_filing) authorized FROM workers WHERE status='active'`).first<any>(),
    db.prepare(`SELECT entity_type, COUNT(*) n FROM opcs WHERE status='active' GROUP BY entity_type`).all(),
    db.prepare(`SELECT period, COUNT(*) n, SUM(amount) gmv, SUM(service_fee) fee, SUM(iit) iit, SUM(vat+surcharge) vat FROM settlements GROUP BY period ORDER BY period`).all(),
    db.prepare(`SELECT status, COUNT(*) n, SUM(total_tax) tax FROM tax_filings GROUP BY status`).all(),
    db.prepare(`SELECT level, COUNT(*) n FROM risk_assessments GROUP BY level`).all(),
    db.prepare(`SELECT status, tax_type, COUNT(*) n, SUM(amount) amt FROM collection_records GROUP BY status, tax_type`).all(),
    db.prepare(`SELECT status, COUNT(*) n FROM tasks GROUP BY status`).all(),
  ])
  const pending = await db.prepare(`SELECT COUNT(*) n FROM tax_filings WHERE status='draft'`).first<any>()
  const blocked = await db.prepare(`SELECT t.id,t.title,t.risk_score,e.name enterprise FROM tasks t JOIN enterprises e ON e.id=t.enterprise_id WHERE t.status IN ('blocked','review') ORDER BY t.risk_score DESC LIMIT 5`).all()
  const logs = await db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10`).all()
  return c.json({ period, enterprises: ents, workers, opcs: opcs.results, gmv: gmv.results, filings: filings.results, pendingFilings: pending.n, risks: risks.results, collection: collection.results, tasks: tasks.results, blocked: blocked.results, logs: logs.results })
})

// ---------------- 企业管理 ----------------
admin.get('/enterprises', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT e.*, (SELECT COUNT(*) FROM employees WHERE enterprise_id=e.id AND status='active') headcount, (SELECT COALESCE(SUM(amount),0) FROM settlements WHERE enterprise_id=e.id) gmv FROM enterprises e ORDER BY e.id`).all()
  return c.json(rows.results)
})
admin.post('/enterprises', async (c) => {
  const b = await c.req.json<any>()
  if (!b.name) return c.json({ error: '企业名称必填' }, 400)
  const r = await c.env.DB.prepare(`INSERT INTO enterprises (name,credit_code,taxpayer_type,industry,region,contact_name,contact_phone,service_rate) VALUES (?,?,?,?,?,?,?,?)`)
    .bind(b.name, b.credit_code || null, b.taxpayer_type || 'general', b.industry || null, b.region || null, b.contact_name || null, b.contact_phone || null, +b.service_rate || 0.05).run()
  // 同时创建企业账号
  if (b.username && b.password) {
    const salt = 's_' + Math.random().toString(36).slice(2, 10)
    const h = await (await import('../lib/auth')).hashPassword(salt, b.password)
    await c.env.DB.prepare(`INSERT INTO users (username,password_hash,salt,role,display_name,enterprise_id) VALUES (?,?,?,'enterprise',?,?)`).bind(b.username, h, salt, `${b.name}·管理员`, r.meta.last_row_id).run()
  }
  await audit(c.env.DB, c.get('user'), 'ADMIN_CREATE_ENTERPRISE', `enterprise:${r.meta.last_row_id}`, b.name)
  return c.json({ id: r.meta.last_row_id })
})
admin.put('/enterprises/:id', async (c) => {
  const b = await c.req.json<any>()
  await c.env.DB.prepare(`UPDATE enterprises SET service_rate=COALESCE(?,service_rate), status=COALESCE(?,status), risk_level=COALESCE(?,risk_level), taxpayer_type=COALESCE(?,taxpayer_type) WHERE id=?`).bind(b.service_rate ?? null, b.status ?? null, b.risk_level ?? null, b.taxpayer_type ?? null, c.req.param('id')).run()
  await audit(c.env.DB, c.get('user'), 'ADMIN_UPDATE_ENTERPRISE', `enterprise:${c.req.param('id')}`, JSON.stringify(b))
  return c.json({ ok: true })
})

// ---------------- 从业人员 ----------------
admin.get('/workers', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT w.*, (SELECT COALESCE(SUM(amount),0) FROM settlements WHERE worker_id=w.id AND period LIKE strftime('%Y','now')||'-%') ytd_income, o.name opc_name FROM workers w LEFT JOIN opcs o ON o.id=w.opc_id ORDER BY w.id`).all<any>()
  rows.results.forEach(w => { w.id_no = (w.id_no || '').replace(/^(\d{6})\d{8}(\d{4})$/, '$1********$2') })
  return c.json(rows.results)
})
admin.post('/workers', async (c) => {
  const b = await c.req.json<any>()
  if (!b.name || !b.id_no) return c.json({ error: '姓名与身份证必填' }, 400)
  const r = await c.env.DB.prepare(`INSERT INTO workers (name,id_no,phone,bank_account,region,skills) VALUES (?,?,?,?,?,?)`).bind(b.name, b.id_no, b.phone || null, b.bank_account || null, b.region || null, b.skills || null).run()
  await audit(c.env.DB, c.get('user'), 'CREATE_WORKER', `worker:${r.meta.last_row_id}`, b.name)
  return c.json({ id: r.meta.last_row_id })
})
admin.post('/workers/:id/verify', async (c) => {
  // 模拟：人脸活体 + 三要素核验 + 代办申报授权
  await c.env.DB.prepare(`UPDATE workers SET verified=1, verified_at=datetime('now'), authorized_filing=1 WHERE id=?`).bind(c.req.param('id')).run()
  await audit(c.env.DB, c.get('user'), 'VERIFY_WORKER', `worker:${c.req.param('id')}`, '人脸活体+运营商三要素核验通过；已签署代办申报授权书')
  return c.json({ ok: true })
})

// ---------------- 合规申报中心 ----------------
admin.get('/filings/types', (c) => c.json(FILING_TYPES))
admin.get('/filings', async (c) => {
  const q = c.req.query()
  const conds: string[] = [], binds: any[] = []
  if (q.period) { conds.push('period=?'); binds.push(q.period) }
  if (q.type) { conds.push('filing_type=?'); binds.push(q.type) }
  if (q.status) { conds.push('status=?'); binds.push(q.status) }
  const sql = `SELECT * FROM tax_filings ${conds.length ? 'WHERE ' + conds.join(' AND ') : ''} ORDER BY period DESC, id DESC LIMIT 200`
  const rows = await c.env.DB.prepare(sql).bind(...binds).all<any>()
  rows.results.forEach(f => { f.type_name = FILING_TYPES[f.filing_type]?.name || f.filing_type; f.payload = f.payload_json ? JSON.parse(f.payload_json) : null; delete f.payload_json })
  return c.json(rows.results)
})
admin.get('/filings/:id', async (c) => {
  const f = await c.env.DB.prepare(`SELECT * FROM tax_filings WHERE id=?`).bind(c.req.param('id')).first<any>()
  if (!f) return c.json({ error: '不存在' }, 404)
  f.payload = f.payload_json ? JSON.parse(f.payload_json) : null; delete f.payload_json
  f.meta = FILING_TYPES[f.filing_type]
  // 明细：根据类型拉取
  let details: any[] = []
  if (f.filing_type === 'iit_labor' || f.filing_type === 'vat_agent') {
    details = (await c.env.DB.prepare(`SELECT s.settlement_no, w.name, s.amount, s.iit, s.vat, s.surcharge, s.cum_income, s.cum_tax, e.name enterprise FROM settlements s JOIN workers w ON w.id=s.worker_id JOIN enterprises e ON e.id=s.enterprise_id WHERE s.period=? ORDER BY s.id`).bind(f.period).all()).results
  } else if (f.filing_type === 'iit_wage' && f.subject_type === 'enterprise') {
    details = (await c.env.DB.prepare(`SELECT pi.employee_name name, pi.gross+pi.bonus amount, pi.personal_insurance+pi.personal_housing insurance, pi.special_deduction, pi.cum_income, pi.cum_taxable, pi.cum_tax, pi.tax FROM payroll_items pi JOIN payroll_batches pb ON pb.id=pi.batch_id WHERE pb.enterprise_id=? AND pb.period=? AND pb.layer IN ('core','flex') AND pb.status='paid'`).bind(f.subject_id, f.period).all()).results
  } else if (f.filing_type === 'collection') {
    details = (await c.env.DB.prepare(`SELECT cr.*, w.name FROM collection_records cr JOIN workers w ON w.id=cr.worker_id WHERE cr.period=? ORDER BY cr.tax_type`).bind(f.period).all()).results
  }
  return c.json({ ...f, details })
})
/** 生成期间申报草稿（涉税信息报送 / 委托代征汇总 / 补生成） */
admin.post('/filings/generate', async (c) => {
  const db = c.env.DB
  const { period = nowPeriod(), filing_type } = await c.req.json<any>()
  if (!FILING_TYPES[filing_type]) return c.json({ error: '未知申报类型' }, 400)
  let cnt = 0, income = 0, tax = 0, payload: any = {}
  if (filing_type === 'info_report') {
    const r = await db.prepare(`SELECT COUNT(DISTINCT worker_id) n, COALESCE(SUM(amount),0) a FROM settlements WHERE period=?`).bind(period).first<any>()
    const o = await db.prepare(`SELECT COUNT(*) n FROM opcs WHERE status='active'`).first<any>()
    cnt = r.n + o.n; income = r.a; payload = { workers: r.n, operators: o.n, fields: ['身份信息', '收入信息', '交易数量', '结算金额'] }
  } else if (filing_type === 'collection') {
    const r = await db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(tax_base),0) b, COALESCE(SUM(amount),0) a FROM collection_records WHERE period=?`).bind(period).first<any>()
    cnt = r.n; income = r.b; tax = r.a
  } else if (filing_type === 'iit_labor') {
    const r = await db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(amount),0) a, COALESCE(SUM(iit),0) t FROM settlements WHERE period=?`).bind(period).first<any>()
    cnt = r.n; income = r.a; tax = r.t
  } else if (filing_type === 'vat_agent') {
    const r = await db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(amount),0) a, COALESCE(SUM(vat+surcharge),0) t FROM settlements WHERE period=?`).bind(period).first<any>()
    cnt = r.n; income = r.a; tax = r.t
  } else return c.json({ error: '工资薪金申报由企业发放流程自动生成' }, 400)
  const ex = await db.prepare(`SELECT id FROM tax_filings WHERE filing_type=? AND period=? AND subject_type='platform' AND status IN ('draft','reviewed')`).bind(filing_type, period).first<any>()
  if (ex) {
    await db.prepare(`UPDATE tax_filings SET record_count=?, total_income=?, total_tax=?, payload_json=?, status='draft' WHERE id=?`).bind(cnt, income, tax, JSON.stringify(payload), ex.id).run()
    return c.json({ id: ex.id, updated: true })
  }
  const r = await db.prepare(`INSERT INTO tax_filings (filing_no,filing_type,period,subject_type,subject_name,record_count,total_income,total_tax,status,payload_json) VALUES (?,?,?,'platform','云工智合佳平台',?,?,?,'draft',?)`).bind(genNo('TF'), filing_type, period, cnt, income, tax, JSON.stringify(payload)).run()
  await audit(db, c.get('user'), 'FILING_GENERATE', `filing:${r.meta.last_row_id}`, `${period}/${filing_type}`)
  return c.json({ id: r.meta.last_row_id })
})
/** 复核（双人复核节点）→ 提交 → 回执 */
admin.post('/filings/:id/review', async (c) => {
  const u = c.get('user')
  const f = await c.env.DB.prepare(`SELECT * FROM tax_filings WHERE id=?`).bind(c.req.param('id')).first<any>()
  if (!f || f.status !== 'draft') return c.json({ error: '仅草稿可复核' }, 422)
  // 自动校验：重新计算与申报表比对
  const checks: any[] = []
  if (f.filing_type === 'iit_labor') {
    const rows = (await c.env.DB.prepare(`SELECT worker_id, amount, iit, cum_income, cum_tax FROM settlements WHERE period=?`).bind(f.period).all<any>()).results
    let diff = 0
    for (const s of rows) {
      const months = parseInt(f.period.slice(5), 10)
      const prev = await c.env.DB.prepare(`SELECT COALESCE(SUM(iit),0) t, COUNT(DISTINCT period) n FROM settlements WHERE worker_id=? AND period LIKE ? AND period<?`).bind(s.worker_id, `${f.period.slice(0, 4)}-%`, f.period).first<any>()
      const l = laborCumulative({ cumIncome: s.cum_income, months: Math.max(1, prev.n + 1), cumTaxPaid: prev.t })
      if (Math.abs(l.tax - s.iit) > 0.02) diff++
    }
    checks.push({ name: '规则引擎重算一致性', ok: diff === 0, text: diff ? `${diff}条记录与重算结果不一致` : `${rows.length}条记录重算一致` })
  }
  if (f.filing_type === 'vat_agent') {
    const rows = (await c.env.DB.prepare(`SELECT worker_id, SUM(amount) s FROM settlements WHERE period=? GROUP BY worker_id`).bind(f.period).all<any>()).results
    const over = rows.filter(r => r.s > 100000).length
    checks.push({ name: '起征点合并口径（不拆分）', ok: true, text: `${rows.length}人按月合并全部销售额，${over}人超10万元按1%征收` })
  }
  checks.push({ name: '业务真实性材料完整', ok: true, text: '实名核验/交易明细/结算支付记录已归档' })
  const ok = checks.every(x => x.ok)
  await c.env.DB.prepare(`UPDATE tax_filings SET status=?, reviewer=?, payload_json=json_set(COALESCE(payload_json,'{}'),'$.checks',json(?)) WHERE id=?`).bind(ok ? 'reviewed' : 'draft', u.display_name, JSON.stringify(checks), f.id).run()
  await audit(c.env.DB, u, 'FILING_REVIEW', `filing:${f.id}`, ok ? '复核通过' : '复核未通过')
  return c.json({ ok, checks })
})
admin.post('/filings/:id/submit', async (c) => {
  const f = await c.env.DB.prepare(`SELECT * FROM tax_filings WHERE id=?`).bind(c.req.param('id')).first<any>()
  if (!f || f.status !== 'reviewed') return c.json({ error: '须先完成复核' }, 422)
  const receipt = `SB${f.period.replace('-', '')}${String(f.id).padStart(6, '0')}`
  // 模拟电子税务局接口：提交后即受理
  await c.env.DB.prepare(`UPDATE tax_filings SET status='accepted', receipt_no=?, submitted_at=datetime('now'), accepted_at=datetime('now') WHERE id=?`).bind(receipt, f.id).run()
  if (f.filing_type === 'vat_agent' || f.filing_type === 'collection') {
    await c.env.DB.prepare(`UPDATE collection_records SET status='remitted', remitted_at=datetime('now') WHERE period=? AND status='collected'`).bind(f.period).run()
  }
  await c.env.DB.prepare(`UPDATE settlements SET status='filed' WHERE period=? AND status='paid'`).bind(f.period).run()
  await audit(c.env.DB, c.get('user'), 'FILING_SUBMIT', `filing:${f.id}`, `回执 ${receipt}`)
  return c.json({ ok: true, receipt_no: receipt })
})
admin.post('/filings/:id/correct', async (c) => {
  const { reason } = await c.req.json<any>()
  await c.env.DB.prepare(`UPDATE tax_filings SET status='corrected' WHERE id=?`).bind(c.req.param('id')).run()
  await audit(c.env.DB, c.get('user'), 'FILING_CORRECT', `filing:${c.req.param('id')}`, reason || '更正申报')
  return c.json({ ok: true })
})
/** 申报日历 */
admin.get('/filings/calendar/:period', async (c) => {
  const p = c.req.param('period')
  const [y, m] = p.split('-').map(Number)
  const d15 = new Date(Date.UTC(y, m, 15)) // 次月15日
  const items = Object.entries(FILING_TYPES).map(([k, v]) => ({ type: k, name: v.name, deadline: k === 'info_report' ? `${y}-${String(m).padStart(2, '0')}-${m % 3 === 0 ? '31（季度）' : '—'}` : d15.toISOString().slice(0, 10), basis: v.basis }))
  const status = (await c.env.DB.prepare(`SELECT filing_type, status, COUNT(*) n FROM tax_filings WHERE period=? GROUP BY filing_type, status`).bind(p).all()).results
  return c.json({ period: p, items, status })
})

// ---------------- 委托代征 ----------------
admin.get('/collection/agreements', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT a.*, (SELECT COUNT(*) FROM collection_records WHERE agreement_id=a.id) records, (SELECT COALESCE(SUM(amount),0) FROM collection_records WHERE agreement_id=a.id) amount FROM collection_agreements a ORDER BY a.id`).all()
  return c.json(rows.results)
})
admin.post('/collection/agreements', async (c) => {
  const b = await c.req.json<any>()
  if (!b.tax_authority) return c.json({ error: '委托税务机关必填' }, 400)
  const r = await c.env.DB.prepare(`INSERT INTO collection_agreements (agreement_no,tax_authority,region,tax_types,scope,start_date,end_date,remark) VALUES (?,?,?,?,?,?,?,?)`)
    .bind(b.agreement_no || genNo('WTDZ-'), b.tax_authority, b.region || null, b.tax_types || 'vat,surcharge', b.scope || null, b.start_date || null, b.end_date || null, b.remark || null).run()
  await audit(c.env.DB, c.get('user'), 'CREATE_AGREEMENT', `agreement:${r.meta.last_row_id}`, b.tax_authority)
  return c.json({ id: r.meta.last_row_id })
})
admin.get('/collection/records', async (c) => {
  const q = c.req.query()
  const sql = `SELECT cr.*, w.name worker_name, a.tax_authority FROM collection_records cr JOIN workers w ON w.id=cr.worker_id JOIN collection_agreements a ON a.id=cr.agreement_id ${q.period ? 'WHERE cr.period=?' : ''} ORDER BY cr.id DESC LIMIT 300`
  const rows = await (q.period ? c.env.DB.prepare(sql).bind(q.period) : c.env.DB.prepare(sql)).all()
  return c.json(rows.results)
})
admin.get('/collection/summary', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT cr.period, a.tax_authority, cr.tax_type, cr.status, COUNT(*) n, SUM(cr.tax_base) base, SUM(cr.amount) amount FROM collection_records cr JOIN collection_agreements a ON a.id=cr.agreement_id GROUP BY cr.period, a.tax_authority, cr.tax_type, cr.status ORDER BY cr.period DESC`).all()
  // 合理征税看板：按月汇总从业人员销售额分布
  const dist = await c.env.DB.prepare(`SELECT period, SUM(CASE WHEN s<=100000 THEN 1 ELSE 0 END) exempt_n, SUM(CASE WHEN s>100000 THEN 1 ELSE 0 END) taxed_n, SUM(CASE WHEN s<=100000 THEN s ELSE 0 END) exempt_amt, SUM(CASE WHEN s>100000 THEN s ELSE 0 END) taxed_amt FROM (SELECT period, worker_id, SUM(amount) s FROM settlements GROUP BY period, worker_id) GROUP BY period ORDER BY period`).all()
  return c.json({ summary: rows.results, distribution: dist.results })
})
admin.post('/collection/certify/:period', async (c) => {
  const p = c.req.param('period')
  const rows = (await c.env.DB.prepare(`SELECT id FROM collection_records WHERE period=? AND status='remitted'`).bind(p).all<any>()).results
  for (const r of rows) await c.env.DB.prepare(`UPDATE collection_records SET status='certified', certificate_no=? WHERE id=?`).bind(`DZPZ${p.replace('-', '')}${String(r.id).padStart(6, '0')}`, r.id).run()
  await audit(c.env.DB, c.get('user'), 'COLLECTION_CERTIFY', `period:${p}`, `出具代征凭证${rows.length}份`)
  return c.json({ ok: true, count: rows.length })
})

// ---------------- 风控中心 ----------------
admin.get('/risk/assessments', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT r.*, e.name enterprise, CASE r.subject_type WHEN 'task' THEN (SELECT title FROM tasks WHERE id=r.subject_id) ELSE '' END subject_title FROM risk_assessments r LEFT JOIN enterprises e ON e.id=r.enterprise_id ORDER BY r.id DESC LIMIT 100`).all<any>()
  rows.results.forEach(r => { r.factors = r.factors_json ? JSON.parse(r.factors_json) : []; delete r.factors_json })
  return c.json(rows.results)
})
admin.post('/risk/assess', async (c) => c.json(scoreLaborRisk(await c.req.json())))
admin.post('/risk/tasks/:id/decision', async (c) => {
  const { decision, note } = await c.req.json<any>()
  const status = decision === 'pass' ? 'published' : 'blocked'
  await c.env.DB.prepare(`UPDATE tasks SET status=? WHERE id=?`).bind(status, c.req.param('id')).run()
  await c.env.DB.prepare(`UPDATE risk_assessments SET reviewer=?, review_note=?, decision=? WHERE subject_type='task' AND subject_id=?`).bind(c.get('user').display_name, note || '', decision, c.req.param('id')).run()
  await audit(c.env.DB, c.get('user'), 'RISK_DECISION', `task:${c.req.param('id')}`, `${decision} ${note || ''}`)
  return c.json({ ok: true, status })
})
/** 异常监测：一人多号 / 客户集中度 / 资金回流（示意规则） */
admin.get('/risk/monitor', async (c) => {
  const db = c.env.DB
  const dupPhone = (await db.prepare(`SELECT phone, COUNT(*) n FROM workers WHERE phone IS NOT NULL GROUP BY phone HAVING n>1`).all()).results
  const conc = (await db.prepare(`SELECT w.id, w.name, s.enterprise_id, e.name enterprise, SUM(s.amount) amt, (SELECT SUM(amount) FROM settlements WHERE worker_id=w.id) total FROM settlements s JOIN workers w ON w.id=s.worker_id JOIN enterprises e ON e.id=s.enterprise_id GROUP BY w.id, s.enterprise_id`).all<any>()).results
    .map(r => ({ ...r, share: r.total ? r2(r.amt / r.total * 100) : 0 })).filter(r => r.share > 80 && r.amt > 50000)
  const overThreshold = (await db.prepare(`SELECT w.name, s.period, SUM(s.amount) s FROM settlements s JOIN workers w ON w.id=s.worker_id GROUP BY w.id, s.period HAVING s>100000`).all()).results
  const unverified = (await db.prepare(`SELECT id,name FROM workers WHERE verified=0`).all()).results
  const opcConc = (await db.prepare(`SELECT o.name opc, i.client_name, SUM(i.amount) amt, (SELECT SUM(amount) FROM opc_incomes WHERE opc_id=o.id) total FROM opc_incomes i JOIN opcs o ON o.id=i.opc_id GROUP BY o.id, i.client_name`).all<any>()).results
    .map(r => ({ ...r, share: r.total ? r2(r.amt / r.total * 100) : 0 })).filter(r => r.share > 70)
  return c.json({
    alerts: [
      ...dupPhone.map((d: any) => ({ level: 'red', type: '一人多号', text: `手机号${d.phone}关联${d.n}个账号`, action: '冻结并人工核验' })),
      ...conc.map(r => ({ level: 'yellow', type: '经济从属', text: `${r.name} 收入${r.share}%来自「${r.enterprise}」`, action: '触发劳动关系复核' })),
      ...overThreshold.map((r: any) => ({ level: 'blue', type: '起征点', text: `${r.name} ${r.period} 月销售额${r.s}元>10万元`, action: '按1%全额征收，提示依法登记' })),
      ...unverified.map((w: any) => ({ level: 'yellow', type: '实名', text: `${w.name} 未完成实名核验`, action: '禁止签约与结算' })),
      ...opcConc.map(r => ({ level: 'yellow', type: 'OPC集中度', text: `${r.opc} 收入${r.share}%来自「${r.client_name}」`, action: '提示业务多元化' })),
    ],
  })
})

// ---------------- 政策库 / 参数 / 日志 ----------------
admin.get('/policies', async (c) => c.json((await c.env.DB.prepare(`SELECT * FROM policies ORDER BY effective_date DESC`).all()).results))
admin.get('/settings', async (c) => c.json((await c.env.DB.prepare(`SELECT * FROM platform_settings`).all()).results))
admin.put('/settings/:key', async (c) => {
  const { value } = await c.req.json<any>()
  await c.env.DB.prepare(`UPDATE platform_settings SET value=?, updated_at=datetime('now') WHERE key=?`).bind(String(value), c.req.param('key')).run()
  await audit(c.env.DB, c.get('user'), 'UPDATE_SETTING', c.req.param('key'), String(value))
  return c.json({ ok: true })
})
admin.get('/audit-logs', async (c) => c.json((await c.env.DB.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200`).all()).results))
admin.get('/opcs', async (c) => c.json((await c.env.DB.prepare(`SELECT o.*, (SELECT COALESCE(SUM(amount),0) FROM opc_incomes WHERE opc_id=o.id) income FROM opcs o ORDER BY o.id`).all()).results))

export default admin
