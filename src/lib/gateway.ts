/**
 * 算力网关：统一接入 · 智能路由 · DLP 八模块 · Token 计量结算 · 全链路存证
 * 五层：L1 统一接入(BYOK/OpenAI兼容) → L2 DLP网关 → L3 聚合分发(路由) → L4 资源适配(境内/海外池) → L5 运营合规(计费/存证)
 */
import { r2 } from './tax'

export type Msg = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }
export type RoutePolicy = 'quality' | 'balanced' | 'cost' | 'latency'
export type PoolPolicy = 'domestic_only' | 'domestic_first' | 'any'

export interface DlpRule { key: string; name: string; module: string; pattern: string | null; action: string; level: string; enabled: number }
export interface DlpResult { action: 'pass' | 'desensitize' | 'block' | 'divert'; hits: Array<{ rule: string; name: string; action: string; count: number }>; text: string; forceDomestic: boolean }

const MASK: Record<string, (m: string) => string> = {
  pii_idcard: m => m.slice(0, 6) + '********' + m.slice(-4),
  pii_phone: m => m.slice(0, 3) + '****' + m.slice(-4),
  pii_bankcard: m => m.slice(0, 4) + ' **** **** ' + m.slice(-4),
  pii_email: m => m[0] + '***@' + m.split('@')[1],
  pii_credit_code: m => m.slice(0, 4) + '**********' + m.slice(-4),
}

/** L2 DLP：对输入做解析识别 + 分级处置（放行/脱敏/阻断/分流） */
export function runDlp(text: string, rules: DlpRule[], level: 'off' | 'standard' | 'strict'): DlpResult {
  if (level === 'off') return { action: 'pass', hits: [], text, forceDomestic: false }
  let out = text
  const hits: DlpResult['hits'] = []
  let action: DlpResult['action'] = 'pass'
  let forceDomestic = false
  const rank = { pass: 0, divert: 1, desensitize: 2, block: 3 }
  for (const r of rules) {
    if (!r.enabled || !r.pattern) continue
    if (r.level === 'strict' && level !== 'strict') continue
    let re: RegExp
    try { re = new RegExp(r.pattern, 'gi') } catch { continue }
    const matches = out.match(re)
    if (!matches?.length) continue
    hits.push({ rule: r.key, name: r.name, action: r.action, count: matches.length })
    if (r.action === 'desensitize') out = out.replace(re, m => (MASK[r.key] || (() => '***'))(m))
    if (r.action === 'divert') forceDomestic = true
    if (rank[r.action as keyof typeof rank] > rank[action]) action = r.action as DlpResult['action']
  }
  return { action, hits, text: out, forceDomestic }
}

/** 输出侧 DLP：对模型输出再做一次 PII 脱敏（双向防护） */
export function dlpOutput(text: string, rules: DlpRule[], level: 'off' | 'standard' | 'strict') {
  if (level === 'off') return text
  const r = runDlp(text, rules.filter(x => x.module === 'identify' && x.action === 'desensitize'), level)
  return r.text
}

export interface ModelRow { model_id: string; display_name: string; provider_key: string; vendor: string; type: string; pool: string; price_in: number; price_out: number; quality: number; latency: number; cost: number; tags: string; status: string }

/** L3 智能路由：按策略在候选模型中打分 */
export function routeModel(models: ModelRow[], opts: { type?: string; policy: RoutePolicy; poolPolicy: PoolPolicy; forceDomestic?: boolean; preferred?: string; hintTags?: string[] }) {
  const type = opts.type || 'chat'
  let cands = models.filter(m => m.status === 'active' && (m.type === type || (type === 'chat' && m.type === 'reasoning')))
  const domesticOnly = opts.poolPolicy === 'domestic_only' || opts.forceDomestic
  if (domesticOnly) cands = cands.filter(m => m.pool === 'domestic')
  if (!cands.length) return null
  if (opts.preferred) {
    const p = cands.find(m => m.model_id === opts.preferred)
    if (p) return { model: p, reason: `用户指定模型${domesticOnly ? '（已限定境内池）' : ''}` }
    if (domesticOnly) return { model: scoreBest(cands, opts), reason: '指定模型不在境内池，敏感业务已改路由境内备案模型' }
  }
  const best = scoreBest(cands, opts)
  const why = { quality: '质量优先', balanced: '均衡（质量/时延/成本）', cost: '成本优先', latency: '时延优先' }[opts.policy]
  const poolWhy = opts.forceDomestic ? '敏感业务命中 → 强制境内备案池' : opts.poolPolicy === 'domestic_first' && best.pool === 'domestic' ? '境内池优先' : ''
  return { model: best, reason: [why, poolWhy, opts.hintTags?.length ? `标签匹配:${opts.hintTags.join('/')}` : ''].filter(Boolean).join(' · ') }
}
function scoreBest(cands: ModelRow[], opts: { policy: RoutePolicy; poolPolicy: PoolPolicy; hintTags?: string[] }) {
  const w = { quality: [0.7, 0.15, 0.15], balanced: [0.4, 0.3, 0.3], cost: [0.2, 0.2, 0.6], latency: [0.2, 0.6, 0.2] }[opts.policy]
  return cands.map(m => {
    let s = m.quality * w[0] + m.latency * w[1] + m.cost * w[2]
    if (opts.poolPolicy === 'domestic_first' && m.pool === 'domestic') s += 0.6
    if (opts.hintTags?.length) s += opts.hintTags.filter(t => (m.tags || '').includes(t)).length * 0.4
    return { m, s }
  }).sort((a, b) => b.s - a.s)[0].m
}

/** 粗略 token 估算（中文≈1.5字/token，英文≈4字符/token） */
export function estimateTokens(text: string) {
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const other = text.length - cn
  return Math.max(1, Math.round(cn / 1.5 + other / 4))
}
export const creditsFor = (m: ModelRow, tin: number, tout: number) => r2((tin / 1000) * m.price_in + (tout / 1000) * m.price_out)

/** L4 调用供应商（OpenAI 兼容）；无 Key 时返回 mock */
export async function callChat(provider: { base_url: string; api_key: string | null; status: string; protocol: string }, model: string, messages: Msg[], opts: { temperature?: number; max_tokens?: number } = {}) {
  const t0 = Date.now()
  if (provider.status !== 'active' || !provider.api_key) {
    const content = mockAnswer(messages)
    return { content, tokens_in: estimateTokens(messages.map(m => m.content).join('\n')), tokens_out: estimateTokens(content), latency_ms: Date.now() - t0 + 350, mock: true }
  }
  const res = await fetch(`${provider.base_url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.api_key}` },
    body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.max_tokens ?? 2048, stream: false }),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`网关上游错误 ${res.status}: ${t.slice(0, 200)}`) }
  const j: any = await res.json()
  const content = j.choices?.[0]?.message?.content || ''
  return { content, tokens_in: j.usage?.prompt_tokens || estimateTokens(messages.map(m => m.content).join('\n')), tokens_out: j.usage?.completion_tokens || estimateTokens(content), latency_ms: Date.now() - t0, mock: false }
}

export async function callImage(provider: { base_url: string; api_key: string | null; status: string }, model: string, prompt: string, size = '1024x1024') {
  if (provider.status !== 'active' || !provider.api_key) return { url: `https://placehold.co/1024x1024/2f5bea/ffffff?text=${encodeURIComponent('AI生成示意\n' + prompt.slice(0, 20))}`, mock: true }
  const res = await fetch(`${provider.base_url.replace(/\/$/, '')}/images/generations`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.api_key}` }, body: JSON.stringify({ model, prompt, size, n: 1, response_format: 'url' }) })
  if (!res.ok) throw new Error(`图像网关错误 ${res.status}`)
  const j: any = await res.json()
  return { url: j.data?.[0]?.url || j.data?.[0]?.b64_json, mock: false }
}

/** 健康检查：GET /models */
export async function checkProvider(provider: { base_url: string; api_key: string | null }) {
  try {
    const res = await fetch(`${provider.base_url.replace(/\/$/, '')}/models`, { headers: provider.api_key ? { Authorization: `Bearer ${provider.api_key}` } : {} })
    return { ok: res.ok, status: res.status }
  } catch (e: any) { return { ok: false, status: 0, error: e.message } }
}

export async function evidenceHash(parts: any[]) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(parts)))
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('')
}

/** Mock 回答：未配置 Key 时的可演示输出（明确标注） */
function mockAnswer(messages: Msg[]) {
  const sys = messages.find(m => m.role === 'system')?.content || ''
  const user = [...messages].reverse().find(m => m.role === 'user')?.content || ''
  const head = '> ⚠️ 演示模式：平台后台尚未配置算力网关 API Key，以下为结构化示例输出。配置后将由真实大模型生成。\n\n'
  if (/合规顾问|用工合规/.test(sys)) return head + `## 用工结构合规体检（示例）\n\n**1. 现状诊断**\n- 根据描述，存在"固定底薪 + 坐班打卡"的岗位，具备人格从属与经济从属特征。\n\n**2. 风险清单**\n- 🔴 高：按月固定报酬 + 考勤管理 → 事实劳动关系穿透风险（最高法劳动争议解释（二））\n- 🟡 中：灵活用工部分缺少交付物与验收记录 → 税前扣除凭证不足（2018年第28号）\n- 🟢 低：服务费发票类目\n\n**3. 三层优化方案**\n- 核心层（50-70%）：运营/技术/财务骨干 → 劳动合同\n- 弹性层（10-30%）：场控、理货 → 非全日制（日≤4h/周≤24h）\n- 任务层（10-30%）：按场次计价的主播、按稿计价的设计 → 平台灵活用工（16号公告累计预扣）\n\n**4. 需补齐证据链**\n任务单 → 电子合同 → 交付物哈希 → 验收单 → 分账流水 → 扣缴/代办完税凭证\n\n**5. 免责声明**\n本报告为 AI 辅助生成，不构成法律意见，关键结论须经律师/税务师书面复核。`
  if (/任务设计/.test(sys)) return head + `## 任务包拆解（示例）\n\n| # | 任务包 | 交付物 | 验收标准 | 计价 | 单价区间 | 工期 |\n|---|---|---|---|---|---|---|\n| 1 | 短视频脚本 ×30 | 分镜脚本文档 | 通过内容复核 | 按件 | ¥150-300/条 | 5 天 |\n| 2 | 短视频拍摄剪辑 ×30 | 成片 MP4 | 时长≥60s、无侵权素材 | 按件 | ¥300-600/条 | 10 天 |\n| 3 | 直播专场 ×10 | 回放 + GMV 报表 | 每场完整播出 | 按场 | ¥1,000-2,500/场 | 15 天 |\n\n⚠️ 风险提示：避免要求固定排班与坐班；验收应以成果为准。`
  if (/合同起草/.test(sys)) return head + `## 《服务合作协议》条款要点（示例）\n\n1. **主体**：甲方（任务发布企业）· 乙方（从业人员）· 平台（结算运营主体）\n2. **非劳动关系声明**：双方不建立劳动关系，乙方自主安排工作时间与方式\n3. **成果与验收**：交付物、验收标准、验收期限 3 个工作日\n4. **报酬结算**：按成果计价，经平台持牌支付机构受托分账；平台依法履行扣缴与代办申报\n5. **知识产权**：验收并支付后归甲方；乙方保留署名权（可约定）\n6. **个人信息保护**：单独同意、最小必要\n7. **争议解决**：协商 → 平台调解 → 仲裁/诉讼\n\n*AI 辅助生成，须经律师复核。*`
  if (/税务解释/.test(sys)) return head + `## 税负解读（示例）\n\n规则引擎按 **税务总局 2025 年第 16 号公告** 的累计预扣法计算：收入 ×80% 作为收入额，每月减除 5,000 元，再按 3%-45% 七级预扣率累计计算。因此月入 8,000 元全年预缴约 504 元，而传统按次预扣约 1.5 万元。\n\n⚠️ 次年 3-6 月需进行年度综合所得汇算，如另有工资薪金，可能补税或退税。\n\n*本解读不改变规则引擎计算的任何数字。*`
  if (/销售教练/.test(sys)) return head + `## 销售方案（示例）\n\n**客户画像洞察**：决策链短、关注合规风险与综合成本。\n\n**开场白（微信）**：您好，看到贵司在扩展灵活用工团队，我们帮同行把"合规凭证 + 到手收入"两件事一次解决，方便发您一份 3 分钟的对比表吗？\n\n**异议应对**：\n1. "比老平台贵" → 同等成本下风险归零，一般纳税人净成本相当\n2. "我们一直这么做没事" → 金税四期数据比对 + 涉税信息报送已常态化\n\n**7 天跟进**：D1 发对比表 → D3 免费合规体检 → D7 方案会`
  if (/电商内容/.test(sys)) return head + `## 文案（示例，已规避广告法绝对化用语）\n\n**标题 ×5**\n1. 早起的仪式感，从这只杯子开始\n2. 北欧原木桌上的一抹暖白\n3. 300ml 刚刚好，办公桌的轻负担\n4. 送自己的小确幸\n5. 可微波 · 可洗碗机，省心好养\n\n**直播口播 60s**：家人们，这款马克杯……（略）\n\n*AI 生成，发布前人工复核。*`
  if (/提示词工程师/.test(sys)) return head + `**Prompt**: A white ceramic mug on a Nordic oak table, soft morning sunlight from the left, minimal composition, shallow depth of field, product photography, 8k, clean background\n\n**Negative**: text, watermark, blurry, extra handles, deformed\n\n**变体**：1) top-down flat lay 2) with steam and a croissant 3) studio white background`
  return head + `收到您的问题：「${user.slice(0, 80)}」\n\n（示例回答）我已按系统设定的角色理解需求，并给出结构化建议：\n1. 关键结论\n2. 依据与口径\n3. 建议动作\n\n*AI 辅助生成，经人工复核后使用。*`
}
