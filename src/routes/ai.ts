import { Hono } from 'hono'
import { type Env, requireRole, audit, genNo } from '../lib/auth'
import { runDlp, dlpOutput, routeModel, callChat, callImage, creditsFor, evidenceHash, checkProvider, type Msg, type ModelRow, type DlpRule } from '../lib/gateway'
import { laborCumulative, vatAgent, opcCompare, r2 } from '../lib/tax'

/** AI 赋能中心：面向企业 / OPC / 从业人员 */
const ai = new Hono<Env>()
ai.use('*', requireRole('enterprise', 'opc', 'worker', 'admin'))

async function walletOf(c: any) {
  const u = c.get('user'), db = c.env.DB
  let ownerType = u.role, ownerId = u.role === 'enterprise' ? u.enterprise_id : u.role === 'opc' ? u.opc_id : u.worker_id
  if (u.role === 'admin') { ownerType = c.req.query('owner_type') || 'enterprise'; ownerId = Number(c.req.query('owner_id') || 1) }
  if (u.role === 'worker') { ownerType = 'worker' }
  let w = await db.prepare(`SELECT * FROM ai_wallets WHERE owner_type=? AND owner_id=?`).bind(ownerType, ownerId).first<any>()
  if (!w) {
    await db.prepare(`INSERT INTO ai_wallets (owner_type,owner_id,credits,bonus_tokens,plan,api_key) VALUES (?,?,1000,100,'free',?)`).bind(ownerType, ownerId, `cw-${ownerType}${ownerId}-${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`).run()
    w = await db.prepare(`SELECT * FROM ai_wallets WHERE owner_type=? AND owner_id=?`).bind(ownerType, ownerId).first<any>()
    await db.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,remark) VALUES (?,'bonus',1000,'新用户赠送 1,000 Credits（≈¥10）')`).bind(w.id).run()
  }
  return w
}
const maskKey = (k: string | null) => k ? k.slice(0, 10) + '••••••••' + k.slice(-4) : null

// ---------------- 总览 ----------------
ai.get('/overview', async (c) => {
  const db = c.env.DB, w = await walletOf(c), u = c.get('user')
  const usage = await db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(credits),0) credits, COALESCE(SUM(tokens_in+tokens_out),0) tokens, SUM(CASE WHEN dlp_action<>'pass' THEN 1 ELSE 0 END) dlp_hits, SUM(CASE WHEN status='blocked' THEN 1 ELSE 0 END) blocked FROM ai_usage WHERE wallet_id=? AND created_at>=date('now','start of month')`).bind(w.id).first<any>()
  const byModel = await db.prepare(`SELECT model_id, COUNT(*) n, SUM(credits) credits FROM ai_usage WHERE wallet_id=? GROUP BY model_id ORDER BY credits DESC LIMIT 6`).bind(w.id).all()
  const byDay = await db.prepare(`SELECT date(created_at) d, COUNT(*) n, SUM(credits) credits FROM ai_usage WHERE wallet_id=? AND created_at>=date('now','-14 days') GROUP BY d ORDER BY d`).bind(w.id).all()
  const agents = await db.prepare(`SELECT key,name,category,icon,tagline,price_hint,deterministic FROM ai_agents WHERE status='active' AND (','||roles||',') LIKE ? ORDER BY sort`).bind(`%,${u.role === 'admin' ? 'enterprise' : u.role},%`).all()
  const recent = await db.prepare(`SELECT * FROM ai_usage WHERE wallet_id=? ORDER BY id DESC LIMIT 8`).bind(w.id).all<any>()
  const gw = await db.prepare(`SELECT key,name,status,pool,last_check_ok FROM ai_providers ORDER BY priority`).all()
  return c.json({ wallet: { ...w, api_key: maskKey(w.api_key), byok_json: undefined, cny: r2(w.credits / 100) }, usage, byModel: byModel.results, byDay: byDay.results, agents: agents.results, recent: recent.results, gateway: gw.results })
})

// ---------------- 钱包 / 套餐 / 配置 ----------------
ai.get('/wallet', async (c) => {
  const w = await walletOf(c)
  const txns = await c.env.DB.prepare(`SELECT * FROM ai_wallet_txns WHERE wallet_id=? ORDER BY id DESC LIMIT 50`).bind(w.id).all()
  return c.json({ wallet: { ...w, api_key: maskKey(w.api_key), byok_json: w.byok_json ? JSON.parse(w.byok_json) : null, cny: r2(w.credits / 100) }, txns: txns.results, plans: PLANS })
})
const PLANS: Record<string, { name: string; price: number; credits: number; bonus: number; desc: string[] }> = {
  free: { name: 'Free', price: 0, credits: 0, bonus: 0, desc: ['注册赠 1,000 Credits', '境内模型', '标准 DLP', '按量计费'] },
  basic: { name: 'Basic', price: 199, credits: 25000, bonus: 2500, desc: ['¥199/月 · 25,000 Credits', '返 10% Token', '全部模型', '用量报表'] },
  pro: { name: 'Pro', price: 1999, credits: 500000, bonus: 75000, desc: ['¥1,999/月 · 500,000 Credits', '返 15% Token', '专属速率 · 境内池优先', 'DLP 严格模式 · 合规报告'] },
  enterprise: { name: 'Enterprise', price: 9999, credits: 3000000, bonus: 600000, desc: ['¥9,999/月起 · 3,000,000 Credits', '返 20% Token', '私有网关 / BYOK / 数据不出域', '专属客户成功 · 等保三级'] },
}
ai.post('/wallet/recharge', async (c) => {
  const w = await walletOf(c)
  const { cny } = await c.req.json<any>()
  const amt = Math.max(1, +cny || 99)
  const credits = amt * 100
  const bonus = amt >= 999 ? r2(credits * 0.15) : r2(credits * 0.10)
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE ai_wallets SET credits=credits+?, bonus_tokens=bonus_tokens+?, total_recharged=total_recharged+? WHERE id=?`).bind(credits, bonus, credits, w.id),
    c.env.DB.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,cny,remark) VALUES (?,'recharge',?,?,?)`).bind(w.id, credits, amt, `充值 ¥${amt}（演示：模拟支付成功）`),
    c.env.DB.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,cny,remark) VALUES (?,'bonus',?,0,?)`).bind(w.id, bonus, `消费返 Token ${amt >= 999 ? '15%' : '10%'}`),
  ])
  await audit(c.env.DB, c.get('user'), 'AI_RECHARGE', `wallet:${w.id}`, `¥${amt}`)
  return c.json({ ok: true, credits, bonus })
})
ai.post('/wallet/plan', async (c) => {
  const w = await walletOf(c)
  const { plan } = await c.req.json<any>()
  const p = PLANS[plan]; if (!p) return c.json({ error: '未知套餐' }, 400)
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE ai_wallets SET plan=?, plan_expires=date('now','+1 month'), credits=credits+?, bonus_tokens=bonus_tokens+?, dlp_level=CASE WHEN ?='pro' OR ?='enterprise' THEN 'strict' ELSE dlp_level END WHERE id=?`).bind(plan, p.credits, p.bonus, plan, plan, w.id),
    c.env.DB.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,cny,remark) VALUES (?,'plan',?,?,?)`).bind(w.id, p.credits, p.price, `订阅 ${p.name}（演示：模拟支付成功）`),
  ])
  await audit(c.env.DB, c.get('user'), 'AI_PLAN', `wallet:${w.id}`, plan)
  return c.json({ ok: true })
})
ai.put('/wallet/settings', async (c) => {
  const w = await walletOf(c)
  const b = await c.req.json<any>()
  await c.env.DB.prepare(`UPDATE ai_wallets SET routing_policy=COALESCE(?,routing_policy), pool_policy=COALESCE(?,pool_policy), dlp_level=COALESCE(?,dlp_level), byok_json=COALESCE(?,byok_json) WHERE id=?`).bind(b.routing_policy ?? null, b.pool_policy ?? null, b.dlp_level ?? null, b.byok ? JSON.stringify(b.byok) : null, w.id).run()
  await audit(c.env.DB, c.get('user'), 'AI_SETTINGS', `wallet:${w.id}`, JSON.stringify(b))
  return c.json({ ok: true })
})
ai.post('/wallet/rotate-key', async (c) => {
  const w = await walletOf(c)
  const key = `cw-${w.owner_type}${w.owner_id}-${crypto.randomUUID().replace(/-/g, '')}`
  await c.env.DB.prepare(`UPDATE ai_wallets SET api_key=? WHERE id=?`).bind(key, w.id).run()
  await audit(c.env.DB, c.get('user'), 'AI_ROTATE_KEY', `wallet:${w.id}`, '旧密钥立即失效')
  return c.json({ api_key: key, note: '完整密钥仅展示一次，请妥善保存' })
})

// ---------------- 模型目录 / 智能路由预览 ----------------
ai.get('/models', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT m.*, p.status provider_status FROM ai_models m JOIN ai_providers p ON p.key=m.provider_key WHERE m.status='active' ORDER BY m.type, m.sort`).all()
  return c.json(rows.results)
})
ai.post('/route/preview', async (c) => {
  const w = await walletOf(c)
  const b = await c.req.json<any>()
  const models = (await c.env.DB.prepare(`SELECT * FROM ai_models WHERE status='active'`).all<ModelRow>()).results
  const rules = (await c.env.DB.prepare(`SELECT * FROM dlp_rules WHERE enabled=1`).all<DlpRule>()).results
  const dlp = runDlp(b.text || '', rules, w.dlp_level)
  const r = routeModel(models, { type: b.type || 'chat', policy: b.policy || w.routing_policy, poolPolicy: b.pool_policy || w.pool_policy, forceDomestic: dlp.forceDomestic, preferred: b.model })
  return c.json({ dlp, route: r })
})

// ---------------- Agent 目录与对话（核心调用链） ----------------
ai.get('/agents', async (c) => {
  const u = c.get('user')
  const rows = await c.env.DB.prepare(`SELECT * FROM ai_agents WHERE status='active' AND (','||roles||',') LIKE ? ORDER BY sort`).bind(`%,${u.role === 'admin' ? 'enterprise' : u.role},%`).all<any>()
  rows.results.forEach(a => { a.input_schema = a.input_schema ? JSON.parse(a.input_schema) : []; delete a.system_prompt })
  return c.json(rows.results)
})

/**
 * POST /api/ai/chat
 * body: { agent_key?, model?, messages:[{role,content}], inputs?:{}, conversation_id? }
 * 链路：L1 接入 → 规则引擎预计算(deterministic) → L2 DLP 输入 → L3 路由 → L4 调用 → L2 DLP 输出 → L5 计费+存证
 */
ai.post('/chat', async (c) => {
  const db = c.env.DB, u = c.get('user')
  const w = await walletOf(c)
  const b = await c.req.json<any>()
  const agent = b.agent_key ? await db.prepare(`SELECT * FROM ai_agents WHERE key=? AND status='active'`).bind(b.agent_key).first<any>() : null
  let messages: Msg[] = Array.isArray(b.messages) ? b.messages : []
  // Agent 输入表单 → user message
  if (agent && b.inputs && !messages.length) {
    const schema = agent.input_schema ? JSON.parse(agent.input_schema) : []
    messages = [{ role: 'user', content: schema.map((f: any) => `【${f.label}】${b.inputs[f.key] ?? ''}`).join('\n') }]
  }
  if (!messages.length) return c.json({ error: '缺少消息' }, 400)
  if (w.credits <= 0) return c.json({ error: '配额不足，请先充值或订阅套餐' }, 402)

  // 确定性预计算：涉税 Agent 由规则引擎先算，再交模型解释（三不原则）
  let engineJson: any = null
  if (agent?.deterministic) {
    const monthly = +(b.inputs?.monthly || 0), income = +(b.inputs?.income || 0)
    if (monthly) { let cum = 0; const rows = []; for (let m = 1; m <= 12; m++) { const l = laborCumulative({ cumIncome: monthly * m, months: m, cumTaxPaid: cum }); cum += l.tax; rows.push({ m, tax: l.tax }) } engineJson = { method: '劳务报酬累计预扣（16号公告）', monthly, annual_tax: r2(cum), vat: vatAgent(monthly), months: rows } }
    if (income) engineJson = { ...(engineJson || {}), opc_compare: opcCompare({ annualIncome: income }) }
  }
  const sys: Msg[] = []
  if (agent?.system_prompt) sys.push({ role: 'system', content: agent.system_prompt + '\n\n输出使用 Markdown。AI 辅助生成内容请在末尾标注。' })
  if (engineJson) sys.push({ role: 'system', content: `【规则引擎计算结果（权威，不得更改任何数字）】\n${JSON.stringify(engineJson)}` })

  // L2 DLP 输入
  const rules = (await db.prepare(`SELECT * FROM dlp_rules WHERE enabled=1`).all<DlpRule>()).results
  const lastUser = [...messages].reverse().find(m => m.role === 'user')!
  const dlp = runDlp(lastUser.content, rules, w.dlp_level)
  const t0 = Date.now()
  if (dlp.action === 'block') {
    const h = await evidenceHash([w.id, agent?.key, 'blocked', dlp.hits, t0])
    await db.prepare(`INSERT INTO ai_usage (wallet_id,owner_type,owner_id,user_name,agent_key,model_id,provider_key,pool,route_reason,tokens_in,credits,latency_ms,dlp_action,dlp_hits,status,evidence_hash) VALUES (?,?,?,?,?,NULL,NULL,NULL,'DLP 阻断，未调用模型',?,0,?,'block',?,'blocked',?)`).bind(w.id, w.owner_type, w.owner_id, u.display_name, agent?.key || null, lastUser.content.length, Date.now() - t0, JSON.stringify(dlp.hits), h).run()
    return c.json({ blocked: true, dlp, content: `🛡️ 请求已被 DLP 网关阻断：${dlp.hits.map(h => h.name).join('、')}。\n\n依据：平台 DLP 八大模块 · ${dlp.hits.some(h => h.rule.startsWith('inj')) ? '提示词注入防护' : '密钥 / 敏感信息外泄防护'}。如为误判可申诉，人工将在 48 小时内处理（PIPL 第 24 条）。`, evidence_hash: h })
  }
  const sanitized: Msg[] = messages.map(m => m === lastUser ? { ...m, content: dlp.text } : m)

  // L3 路由
  const models = (await db.prepare(`SELECT * FROM ai_models WHERE status='active'`).all<ModelRow>()).results
  const hintTags = agent ? (agent.category === '电商' ? ['电商文案'] : agent.category === '运营' ? ['客服'] : []) : []
  const route = routeModel(models, { type: 'chat', policy: b.policy || agent?.preferred_policy || w.routing_policy, poolPolicy: w.pool_policy, forceDomestic: dlp.forceDomestic, preferred: b.model, hintTags })
  if (!route) return c.json({ error: '无可用模型（请检查池策略）' }, 503)
  const provider = await db.prepare(`SELECT * FROM ai_providers WHERE key=?`).bind(route.model.provider_key).first<any>()
  // BYOK：企业自带 Key 优先
  const byok = w.byok_json ? JSON.parse(w.byok_json) : null
  const prov = byok?.api_key && byok?.base_url ? { base_url: byok.base_url, api_key: byok.api_key, status: 'active', protocol: 'openai' } : provider

  // L4 调用
  let out
  try { out = await callChat(prov, byok?.model || route.model.model_id, [...sys, ...sanitized], { temperature: b.temperature }) }
  catch (e: any) {
    // 故障转移：换成本最低的境内模型再试一次（mock）
    out = await callChat({ ...prov, status: 'mock', api_key: null }, route.model.model_id, [...sys, ...sanitized])
    out.content = `> ⚠️ 上游调用失败（${e.message}），已故障转移为演示输出。\n\n` + out.content
  }
  const content = dlpOutput(out.content, rules, w.dlp_level)
  // L5 计费 + 存证
  const credits = byok?.api_key ? 0 : creditsFor(route.model, out.tokens_in, out.tokens_out)
  const h = await evidenceHash([w.id, agent?.key, route.model.model_id, dlp.action, out.tokens_in, out.tokens_out, t0])
  await db.batch([
    db.prepare(`UPDATE ai_wallets SET credits=credits-?, total_spent=total_spent+? WHERE id=?`).bind(credits, credits, w.id),
    db.prepare(`INSERT INTO ai_usage (wallet_id,owner_type,owner_id,user_name,agent_key,model_id,provider_key,pool,route_reason,tokens_in,tokens_out,credits,latency_ms,dlp_action,dlp_hits,status,evidence_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(w.id, w.owner_type, w.owner_id, u.display_name, agent?.key || null, route.model.model_id, byok?.api_key ? 'byok' : route.model.provider_key, route.model.pool, route.reason + (byok?.api_key ? ' · BYOK 不计费' : ''), out.tokens_in, out.tokens_out, credits, out.latency_ms, dlp.action, JSON.stringify(dlp.hits), out.mock ? 'mock' : 'ok', h),
  ])
  if (credits > 0) await db.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,remark,ref) VALUES (?,'spend',?,?,?)`).bind(w.id, -credits, `${agent?.name || '对话'} · ${route.model.display_name}`, h.slice(0, 12)).run()
  // 会话保存
  let convId = b.conversation_id
  const full = [...messages, { role: 'assistant', content }]
  if (convId) await db.prepare(`UPDATE ai_conversations SET messages_json=?, updated_at=datetime('now') WHERE id=? AND wallet_id=?`).bind(JSON.stringify(full), convId, w.id).run()
  else { const r = await db.prepare(`INSERT INTO ai_conversations (wallet_id,agent_key,title,messages_json) VALUES (?,?,?,?)`).bind(w.id, agent?.key || null, lastUser.content.slice(0, 40), JSON.stringify(full)).run(); convId = r.meta.last_row_id }
  return c.json({ content, conversation_id: convId, model: route.model.display_name, model_id: route.model.model_id, pool: route.model.pool, route_reason: route.reason, dlp: { action: dlp.action, hits: dlp.hits }, tokens_in: out.tokens_in, tokens_out: out.tokens_out, credits, latency_ms: out.latency_ms, mock: out.mock, evidence_hash: h, engine: engineJson })
})

ai.post('/image', async (c) => {
  const db = c.env.DB, u = c.get('user'), w = await walletOf(c)
  const { prompt, model, size } = await c.req.json<any>()
  if (!prompt) return c.json({ error: '缺少提示词' }, 400)
  const models = (await db.prepare(`SELECT * FROM ai_models WHERE status='active' AND type='image'`).all<ModelRow>()).results
  const route = routeModel(models, { type: 'image', policy: w.routing_policy, poolPolicy: w.pool_policy, preferred: model })
  if (!route) return c.json({ error: '无可用图像模型' }, 503)
  const provider = await db.prepare(`SELECT * FROM ai_providers WHERE key=?`).bind(route.model.provider_key).first<any>()
  const t0 = Date.now()
  const img = await callImage(provider, route.model.model_id, prompt, size)
  const credits = route.model.price_out
  const h = await evidenceHash([w.id, 'image', route.model.model_id, prompt, t0])
  await db.batch([
    db.prepare(`UPDATE ai_wallets SET credits=credits-?, total_spent=total_spent+? WHERE id=?`).bind(credits, credits, w.id),
    db.prepare(`INSERT INTO ai_usage (wallet_id,owner_type,owner_id,user_name,agent_key,model_id,provider_key,pool,route_reason,tokens_in,credits,latency_ms,status,evidence_hash) VALUES (?,?,?,?,'aigc_studio',?,?,?,?,?,?,?,?,?)`).bind(w.id, w.owner_type, w.owner_id, u.display_name, route.model.model_id, route.model.provider_key, route.model.pool, route.reason, prompt.length, credits, Date.now() - t0, img.mock ? 'mock' : 'ok', h),
    db.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,remark,ref) VALUES (?,'spend',?,?,?)`).bind(w.id, -credits, `图像生成 · ${route.model.display_name}`, h.slice(0, 12)),
  ])
  return c.json({ url: img.url, model: route.model.display_name, credits, mock: img.mock, evidence_hash: h, label: 'AI 生成（依据《人工智能生成合成内容标识办法》已标识）' })
})

ai.get('/conversations', async (c) => { const w = await walletOf(c); return c.json((await c.env.DB.prepare(`SELECT id,agent_key,title,updated_at FROM ai_conversations WHERE wallet_id=? ORDER BY updated_at DESC LIMIT 30`).bind(w.id).all()).results) })
ai.get('/conversations/:id', async (c) => { const w = await walletOf(c); const r = await c.env.DB.prepare(`SELECT * FROM ai_conversations WHERE id=? AND wallet_id=?`).bind(c.req.param('id'), w.id).first<any>(); if (!r) return c.json({ error: '不存在' }, 404); r.messages = JSON.parse(r.messages_json); delete r.messages_json; return c.json(r) })

// ---------------- 用量 / 审计 ----------------
ai.get('/usage', async (c) => {
  const w = await walletOf(c)
  const rows = await c.env.DB.prepare(`SELECT * FROM ai_usage WHERE wallet_id=? ORDER BY id DESC LIMIT 200`).bind(w.id).all<any>()
  rows.results.forEach(r => { r.dlp_hits = r.dlp_hits ? JSON.parse(r.dlp_hits) : [] })
  return c.json(rows.results)
})
ai.get('/dlp/rules', async (c) => c.json((await c.env.DB.prepare(`SELECT key,name,module,action,level,enabled,description FROM dlp_rules ORDER BY module, id`).all()).results))
ai.post('/dlp/test', async (c) => {
  const w = await walletOf(c)
  const { text, level } = await c.req.json<any>()
  const rules = (await c.env.DB.prepare(`SELECT * FROM dlp_rules WHERE enabled=1`).all<DlpRule>()).results
  return c.json(runDlp(text || '', rules, level || w.dlp_level))
})

// ---------------- AI 服务集市 ----------------
ai.get('/catalog', async (c) => {
  const section = c.req.query('section')
  const sql = `SELECT * FROM ai_catalog WHERE status='active' ${section ? 'AND section=?' : ''} ORDER BY section, sort`
  const rows = await (section ? c.env.DB.prepare(sql).bind(section) : c.env.DB.prepare(sql)).all()
  return c.json(rows.results)
})
ai.post('/catalog/:id/order', async (c) => {
  const w = await walletOf(c), u = c.get('user')
  const item = await c.env.DB.prepare(`SELECT * FROM ai_catalog WHERE id=?`).bind(c.req.param('id')).first<any>()
  if (!item) return c.json({ error: '不存在' }, 404)
  const { requirement } = await c.req.json<any>().catch(() => ({}))
  const no = genNo('AO')
  const pay = item.section === 'compute' && item.price_credits > 0
  if (pay) {
    // 算力产品：直接入账
    const bonus = item.title.includes('专业') ? r2(item.price_credits * 0.15) : item.title.includes('入门') ? r2(item.price_credits * 0.10) : 0
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE ai_wallets SET credits=credits+?, bonus_tokens=bonus_tokens+?, total_recharged=total_recharged+? WHERE id=?`).bind(item.price_credits, bonus, item.price_credits, w.id),
      c.env.DB.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,cny,remark,ref) VALUES (?,'recharge',?,?,?,?)`).bind(w.id, item.price_credits, item.price_credits / 100, item.title + '（演示：模拟支付成功）', no),
    ])
    if (bonus) await c.env.DB.prepare(`INSERT INTO ai_wallet_txns (wallet_id,type,amount,remark,ref) VALUES (?,'bonus',?,?,?)`).bind(w.id, bonus, '消费返 Token', no).run()
  }
  await c.env.DB.prepare(`INSERT INTO ai_orders (order_no,wallet_id,owner_type,owner_id,catalog_id,title,section,credits,status,requirement) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(no, w.id, w.owner_type, w.owner_id, item.id, item.title, item.section, item.price_credits, pay ? 'done' : 'pending', requirement || null).run()
  await c.env.DB.prepare(`UPDATE ai_catalog SET sold=sold+1 WHERE id=?`).bind(item.id).run()
  await audit(c.env.DB, u, 'AI_ORDER', no, item.title)
  return c.json({ ok: true, order_no: no, status: pay ? 'done' : 'pending', message: pay ? '已到账' : '已提交需求，顾问将在 1 个工作日内联系您' })
})
ai.get('/orders', async (c) => { const w = await walletOf(c); return c.json((await c.env.DB.prepare(`SELECT * FROM ai_orders WHERE wallet_id=? ORDER BY id DESC`).bind(w.id).all()).results) })

export default ai

// ======================= 平台后台：网关管理 =======================
export const aiAdmin = new Hono<Env>()
aiAdmin.use('*', requireRole('admin'))
aiAdmin.get('/providers', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM ai_providers ORDER BY priority`).all<any>()
  rows.results.forEach(p => { p.api_key_masked = maskKey(p.api_key); p.has_key = !!p.api_key; delete p.api_key; p.features = p.features ? JSON.parse(p.features) : {} })
  return c.json(rows.results)
})
aiAdmin.put('/providers/:key', async (c) => {
  const b = await c.req.json<any>()
  const setKey = b.api_key !== undefined && b.api_key !== ''
  await c.env.DB.prepare(`UPDATE ai_providers SET base_url=COALESCE(?,base_url), api_key=CASE WHEN ? THEN ? ELSE api_key END, status=COALESCE(?,status), priority=COALESCE(?,priority), pool=COALESCE(?,pool) WHERE key=?`).bind(b.base_url ?? null, setKey ? 1 : 0, setKey ? b.api_key : null, b.status ?? null, b.priority ?? null, b.pool ?? null, c.req.param('key')).run()
  await audit(c.env.DB, c.get('user'), 'GATEWAY_UPDATE', `provider:${c.req.param('key')}`, setKey ? '更新 API Key' : JSON.stringify({ ...b }))
  return c.json({ ok: true })
})
aiAdmin.post('/providers/:key/check', async (c) => {
  const p = await c.env.DB.prepare(`SELECT * FROM ai_providers WHERE key=?`).bind(c.req.param('key')).first<any>()
  if (!p) return c.json({ error: '不存在' }, 404)
  const r = await checkProvider(p)
  await c.env.DB.prepare(`UPDATE ai_providers SET last_check_at=datetime('now'), last_check_ok=? WHERE id=?`).bind(r.ok ? 1 : 0, p.id).run()
  return c.json(r)
})
aiAdmin.get('/models', async (c) => c.json((await c.env.DB.prepare(`SELECT * FROM ai_models ORDER BY type, sort`).all()).results))
aiAdmin.put('/models/:id', async (c) => { const b = await c.req.json<any>(); await c.env.DB.prepare(`UPDATE ai_models SET status=COALESCE(?,status), price_in=COALESCE(?,price_in), price_out=COALESCE(?,price_out), pool=COALESCE(?,pool) WHERE id=?`).bind(b.status ?? null, b.price_in ?? null, b.price_out ?? null, b.pool ?? null, c.req.param('id')).run(); return c.json({ ok: true }) })
aiAdmin.post('/models', async (c) => { const b = await c.req.json<any>(); const r = await c.env.DB.prepare(`INSERT INTO ai_models (model_id,display_name,provider_key,vendor,type,pool,price_in,price_out,quality,latency,cost,tags) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(b.model_id, b.display_name || b.model_id, b.provider_key || 'suanli', b.vendor || '', b.type || 'chat', b.pool || 'domestic', +b.price_in || 0, +b.price_out || 0, +b.quality || 3, +b.latency || 3, +b.cost || 3, b.tags || '').run(); return c.json({ id: r.meta.last_row_id }) })
aiAdmin.get('/dlp/rules', async (c) => c.json((await c.env.DB.prepare(`SELECT * FROM dlp_rules ORDER BY module, id`).all()).results))
aiAdmin.put('/dlp/rules/:key', async (c) => { const b = await c.req.json<any>(); await c.env.DB.prepare(`UPDATE dlp_rules SET enabled=COALESCE(?,enabled), action=COALESCE(?,action), level=COALESCE(?,level) WHERE key=?`).bind(b.enabled ?? null, b.action ?? null, b.level ?? null, c.req.param('key')).run(); return c.json({ ok: true }) })
aiAdmin.get('/stats', async (c) => {
  const db = c.env.DB
  const [total, byPool, byDlp, byOwner, wallets, orders] = await Promise.all([
    db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(credits),0) credits, COALESCE(SUM(tokens_in+tokens_out),0) tokens, AVG(latency_ms) latency FROM ai_usage`).first(),
    db.prepare(`SELECT pool, COUNT(*) n, SUM(credits) credits FROM ai_usage WHERE pool IS NOT NULL GROUP BY pool`).all(),
    db.prepare(`SELECT dlp_action, COUNT(*) n FROM ai_usage GROUP BY dlp_action`).all(),
    db.prepare(`SELECT owner_type, owner_id, user_name, COUNT(*) n, SUM(credits) credits FROM ai_usage GROUP BY owner_type, owner_id ORDER BY credits DESC LIMIT 10`).all(),
    db.prepare(`SELECT w.*, CASE w.owner_type WHEN 'enterprise' THEN (SELECT name FROM enterprises WHERE id=w.owner_id) WHEN 'opc' THEN (SELECT name FROM opcs WHERE id=w.owner_id) ELSE (SELECT name FROM workers WHERE id=w.owner_id) END owner_name FROM ai_wallets w ORDER BY total_spent DESC`).all<any>(),
    db.prepare(`SELECT o.*, w.owner_type, w.owner_id FROM ai_orders o JOIN ai_wallets w ON w.id=o.wallet_id ORDER BY o.id DESC LIMIT 50`).all(),
  ])
  wallets.results.forEach(w => { w.api_key = maskKey(w.api_key); delete w.byok_json })
  return c.json({ total, byPool: byPool.results, byDlp: byDlp.results, byOwner: byOwner.results, wallets: wallets.results, orders: orders.results })
})
aiAdmin.put('/orders/:id', async (c) => { const { status } = await c.req.json<any>(); await c.env.DB.prepare(`UPDATE ai_orders SET status=? WHERE id=?`).bind(status, c.req.param('id')).run(); return c.json({ ok: true }) })
aiAdmin.get('/catalog', async (c) => c.json((await c.env.DB.prepare(`SELECT * FROM ai_catalog ORDER BY section, sort`).all()).results))
aiAdmin.post('/catalog', async (c) => { const b = await c.req.json<any>(); const r = await c.env.DB.prepare(`INSERT INTO ai_catalog (section,title,subtitle,description,tags,price_text,price_credits,provider,delivery_days) VALUES (?,?,?,?,?,?,?,?,?)`).bind(b.section, b.title, b.subtitle || null, b.description || null, b.tags || null, b.price_text || null, +b.price_credits || 0, b.provider || '平台', +b.delivery_days || 0).run(); return c.json({ id: r.meta.last_row_id }) })
aiAdmin.put('/catalog/:id', async (c) => { const b = await c.req.json<any>(); await c.env.DB.prepare(`UPDATE ai_catalog SET status=COALESCE(?,status), price_text=COALESCE(?,price_text), price_credits=COALESCE(?,price_credits) WHERE id=?`).bind(b.status ?? null, b.price_text ?? null, b.price_credits ?? null, c.req.param('id')).run(); return c.json({ ok: true }) })
aiAdmin.get('/agents', async (c) => c.json((await c.env.DB.prepare(`SELECT * FROM ai_agents ORDER BY sort`).all()).results))
aiAdmin.put('/agents/:key', async (c) => { const b = await c.req.json<any>(); await c.env.DB.prepare(`UPDATE ai_agents SET status=COALESCE(?,status), system_prompt=COALESCE(?,system_prompt), preferred_policy=COALESCE(?,preferred_policy), roles=COALESCE(?,roles) WHERE key=?`).bind(b.status ?? null, b.system_prompt ?? null, b.preferred_policy ?? null, b.roles ?? null, c.req.param('key')).run(); await audit(c.env.DB, c.get('user'), 'AGENT_UPDATE', c.req.param('key')); return c.json({ ok: true }) })
