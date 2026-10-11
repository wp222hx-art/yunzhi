import { Hono } from 'hono'
import { type Env, loadUser } from '../lib/auth'
import { resolveProvider, streamChat, runDlp, type Msg, type ModelRow, type DlpRule } from '../lib/gateway'
import { MAIN_FLOW } from './guide'

/**
 * 平台 AI 助手（右下角悬浮窗）
 * - 游客 / 四类角色均可用；知道用户在哪个页面、有什么待办
 * - 回答中可输出动作标签，前端渲染为按钮：
 *   [[go:view|按钮文字]]      跳转到工作台页面（hash）
 *   [[coach:key|按钮文字]]    启动操作教练 Playbook
 *   [[agent:key|按钮文字]]    打开某个 AI 数字员工
 *   [[link:/path|按钮文字]]   打开站内链接
 *   [[tour|按钮文字]]         启动布局漫游
 * - 无可用上游 Key 时使用规则兜底，仍能给出导航与步骤
 */
const a = new Hono<Env>()

/* ---------------- 平台知识库（系统提示） ---------------- */
const SITE_MAP = {
  enterprise: { home: '/enterprise', views: { dashboard: '用工驾驶舱（成本/结构体检/待办/一键跑通演示）', employees: '三层用工结构（核心/弹性/任务层，新增人员）', payroll: '薪酬管理（每层：试算→生成批次→审批→发放）', tasks: '任务与交付（发布任务/AI预评估/AI帮我拆解定价/订单签约/验收/草稿发布）', settlements: '结算与凭证包（五流合一、导出审计包）', compare: '成本对比（直接支付/传统灵工/本平台）', ai: 'AI 数字员工（15个Agent，流式输出，保存报告/创建任务草稿）', aistudio: 'AIGC 工坊（文生图/视频）', reports: 'AI 报告', compute: '算力中心（钱包/套餐/网关配置/子密钥/模型目录/DLP测试）', market: 'AI 服务集市（八大模块）', reportcenter: '经营报表（成本结构/结算趋势/部门/CSV导出）', settings: '企业设置（纳税人身份/社保参数/CSV导入人员）', logs: '操作日志' }, coaches: { payroll: '发一次工资', tasks: '发布一个任务', ai: '用AI拆解需求并生成任务草稿', employees: '新增一名人员' } },
  admin: { home: '/admin', views: { dashboard: '平台总览', filings: '合规申报中心（草稿→复核→提交→回执；五类申报）', collection: '委托代征（代征→解缴→出凭证；10万起征点合并计算）', risk: '风控中心（黄色任务复核、异常监测、AI评分沙盒）', gateway: '算力网关（粘贴 DeepSeek/算力网/平台托管 Key，测试连通）', aiops: 'AI 运营（各主体钱包/用量）', enterprises: '企业管理（入驻、费率、风险等级）', workers: '从业人员（实名核验）', opcs: 'OPC 管理', policies: '政策法规库', settings: '规则参数', logs: '审计日志' }, coaches: { filings: '完成一次申报', risk: '复核一个黄色任务', gateway: '接入真实大模型 Key' } },
  opc: { home: '/opc', views: { dashboard: '经营舱（趋势/客户集中度/四道防火墙/税务路径）', income: '收入与成本', payroll: 'OPC 薪酬（工资+分红配比试算→生成→发放）', tax: '税务测算（增值税起征点/所得税/三阶对比）', growth: '三阶跃迁', cabin: '一站式服务', ai: 'AI 数字员工', aistudio: 'AIGC 工坊', reports: 'AI 报告', compute: '算力中心', market: 'AI 服务集市' }, coaches: { payroll: '给自己发一次工资+分红', income: '记一笔收入' } },
  worker: { home: '/worker', views: { home: '我的首页（实名/下一步）', hall: '任务大厅（申请接单）', orders: '我的任务（提交交付）', income: '收入与凭证', tax: '我的税负（累计预扣 vs 传统）', growth: '成长路径', ai: 'AI 助手', market: '技能与实训' }, coaches: { hall: '接一个任务', orders: '提交一次交付' } },
}
const AGENTS = '用工合规诊断官 compliance_doctor · 任务拆解定价师 task_pricer · 智能合同 contract_agent · 税负解读官 tax_explainer · OPC成长教练 opc_coach · AI销售宝 sales_ai · 电商文案官 ecom_copy · AIGC工坊 aigc_studio · 智能客服 cs_bot · 经营分析师 biz_analyst · 人事助理 hr_assistant · 财务助理 fin_assistant · 轻站搭建 site_builder · 政策补贴匹配 policy_match · 路演BP教练 pitch_coach'
const KNOWLEDGE = `你是「云工智合佳 Compliance OS」平台的内置 AI 助手，名字叫"小合"。你的职责：
1) 用最少的话告诉用户"现在该做什么、去哪里点"，并尽量给出可点击的动作按钮；
2) 解释平台概念（三层用工结构、累计预扣法、五流合一凭证包、劳动关系风险评分、委托代征、OPC三阶跃迁、算力网关/DLP/智能路由等）；
3) 不计算具体税额（税额由规则引擎计算，你只解释口径并引导用户去对应测算页）；不给法律/税务结论性意见，必要时提示"以主管税务机关意见为准"。
平台主流程 8 步：${MAIN_FLOW.map((s, i) => `${i + 1}.${s.name}(${s.owner})`).join(' → ')}。
四类角色：enterprise 企业HR/财务；worker 灵活就业者；opc 超级个体/一人公司；admin 平台合规运营。
演示账号：/demo/enterprise /demo/worker /demo/opc /demo/admin 一键登录（也可在 /login 选择身份）。
营销章节页：/solutions 解决方案；/ai-tools AI赋能工具；/engine 合规引擎；/calc 免费测算；/opc-path OPC成长路径；/guide 平台怎么运转。
AI 数字员工（key）：${AGENTS}。
关键规则：任务必须按成果计价（按件/项目/里程碑），"坐班+月薪"直接红色；老员工转灵工一票否决；未实名不可签约；验收通过的金额才进入结算；敏感业务（薪酬/身份证/合同）AI 调用强制走境内备案池，需要 DeepSeek 或算力网 Key。
动作标签（务必使用，每条回答最多 3 个，放在相关句子之后或末尾）：
[[go:view|文字]] 跳到当前角色工作台的页面；[[coach:key|文字]] 启动操作教练；[[agent:key|文字]] 打开AI数字员工；[[link:/path|文字]] 打开站内链接（游客用）；[[tour|文字]] 启动界面漫游。
回答风格：中文，简短（一般 ≤ 120 字 + 按钮），先给结论/步骤，用 1. 2. 3. 分步，不要寒暄。`


/* 每页操作步骤（与前端 HELP 一致，供助手引用，禁止编造不存在的按钮） */
const PAGE_STEPS: Record<string, Record<string, string[]>> = {
  enterprise: {
    dashboard: ['看「用工结构体检」分数与提示', '看「本期待办」知道下一步', '点「一键跑通演示流程」可让系统自动演示'],
    employees: ['点「新增人员」录入', '选对层级和用工形态（决定怎么算税）', '任务层人员由签约自动带入'],
    payroll: ['选一层点「试算」', '确认后点「生成批次」', '点「审批」', '点「发放」→ 自动生成申报草稿与凭证包', '点「明细」看每人公式与工资条'],
    tasks: ['点「发布任务」填写并先「AI 预评估」（或点「AI 帮我拆解定价」）', '有申请时在「订单」确认签约', '对方交付后点「验收通过」', '验收金额才进入任务层薪酬；草稿点「发布」'],
    settlements: ['点「五流合一」查看凭证', '点「导出审计包」留档（≥10年）'],
    compare: ['输入月发放额与纳税人身份点「重新计算」', '重点看「风险」列'],
    ai: ['选 Agent 点「运行」', '可先「预览 DLP 与路由」', '输出后「保存为报告」/「复制」/「一键创建为任务草稿」'],
    reportcenter: ['看成本结构与趋势图', '点「导出 CSV」'],
    settings: ['维护纳税人身份与社保参数后「保存」', '下载模板 → 选择 CSV → 「预览」→「导入」'],
  },
  admin: {
    filings: ['草稿点「复核」（规则引擎重算）', '复核通过点「提交申报」拿回执', '涉税信息报送/代征汇总需「生成草稿」'],
    collection: ['查看协议与代征明细', '提交增值税代办申报后自动「已解缴」', '点「出具代征凭证」'],
    risk: ['点「因子」看评分依据', '黄色任务「放行」或「拦截」并填写说明', '「AI 评分沙盒」测试任务描述'],
    gateway: ['在供应商卡片粘贴 Key（推荐 DeepSeek 官方，境内池）', '点「测试连通」，成功自动启用'],
    enterprises: ['点「企业入驻」填写并创建账号', '可「进入企业端」代操作'],
    workers: ['未核验人员点「发起核验」'],
    settings: ['修改参数后点「保存」'],
  },
  opc: {
    income: ['点「记一笔收入/成本」', '无凭证成本不能税前列支'],
    payroll: ['输入月工资与本期分红', '点「试算」看综合税负', '「生成薪酬单」→「发放并生成申报」'],
    tax: ['看本月是否免征增值税', '调参数做三阶对比'],
    growth: ['看 AI 推荐与前置条件自检'],
  },
  worker: {
    home: ['未实名先点「立即实名」', '按「下一步」提示操作'],
    hall: ['点「申请接单」', '企业确认后在「我的任务」出现'],
    orders: ['对「已签约」任务点「提交交付」', '等企业验收'],
    income: ['点「凭证」查看完税信息'],
    tax: ['输入预期月收入点「测算」'],
  },
}

function ctxPrompt(u: any, ctx: any) {
  if (!u) return `当前用户是游客，正在浏览营销页 ${ctx?.page || '/'}。只能用 [[link:...]] 和 [[tour|...]]（tour 仅在工作台可用，游客不要用）引导。推荐用 [[link:/demo/enterprise|以企业身份体验]] 等。`
  const sm = (SITE_MAP as any)[u.role]
  return `当前用户：${u.display_name}（角色 ${u.role}），正在工作台页面 "${ctx?.view || ''}"（${sm?.views?.[ctx?.view] || ''}）。
该角色可用页面(view)：${Object.entries(sm?.views || {}).map(([k, v]) => `${k}=${v}`).join('；')}。
该角色可用操作教练(coach key)：${Object.entries(sm?.coaches || {}).map(([k, v]) => `${k}=${v}`).join('；')}。
各页面真实按钮与步骤（只能引用这里出现的按钮名）：${Object.entries((PAGE_STEPS as any)[u.role] || {}).map(([k, v]: any) => `${k}: ${v.join(' → ')}`).join('\n')}
标签示例（必须替换成真实的 view/key，严禁输出 "go:view" "coach:key" 这种占位符）：[[go:payroll|去薪酬管理]] [[coach:payroll|手把手发一次工资]] [[agent:compliance_doctor|让合规诊断官看看]] [[tour|认识界面]]。登录用户不要用 [[link:...]]。
当前待办（按优先级）：${(ctx?.todos || []).slice(0, 5).map((t: any) => `[${t.level}] ${t.title}（去 ${t.view}）`).join('；') || '无'}。
主流程进度：${ctx?.flow ? ctx.flow : '未知'}。`
}

/* ---------------- 规则兜底（无上游 Key 时） ---------------- */
function ruleAnswer(q: string, u: any, ctx: any) {
  const role = u?.role
  const t = q.toLowerCase()
  const has = (...ks: string[]) => ks.some(k => t.includes(k))
  if (!u) {
    if (has('企业', 'hr', '发工资', '薪酬')) return '企业端可以把全职、兼职、外包、平台灵工放在一个系统里算薪、发放并自动拿到合规凭证。\n[[link:/demo/enterprise|以企业身份体验]] [[link:/solutions|看解决方案]]'
    if (has('接单', '兼职', '灵活就业', '到手')) return '灵活就业者只需做三件事：实名、接单、交付。收入按累计预扣法预扣，月 10 万以下免增值税。\n[[link:/demo/worker|以灵活就业者身份体验]] [[link:/calc|先测一下税负]]'
    if (has('opc', '一人公司', '个体', '分红')) return 'OPC 经营舱帮一人公司配比工资与分红、算增值税和所得税、判断什么时候该升级身份。\n[[link:/demo/opc|进入 OPC 经营舱]] [[link:/opc-path|看三阶跃迁]]'
    if (has('ai', '模型', '算力', 'agent')) return '15 个 AI 数字员工 + 算力网关：一个 Key 调用 60+ 大模型，DLP 脱敏、智能路由、Token 计费存证。\n[[link:/ai-tools|看 AI 赋能工具]] [[link:/demo/enterprise|进入演示]]'
    return '我是平台助手"小合"。这是一个 AI 合规用工操作系统：企业发薪拿凭证、灵工接单增收、OPC 财税一体、平台代办申报。先选一个身份体验，进入后我会全程指导。\n[[link:/login|选择身份进入]] [[link:/guide|1 分钟看懂怎么运转]]'
  }
  const todos = ctx?.todos || []
  if (has('先做什么', '下一步', '该做', '怎么开始', '从哪')) {
    if (todos.length) return `按优先级，您现在最该做的是：\n${todos.slice(0, 3).map((x: any, i: number) => `${i + 1}. ${x.title}`).join('\n')}\n[[go:${todos[0].view}|去处理第一条]] [[tour|先看界面布局]]`
    return `本期没有紧急待办。建议先熟悉界面，再按主流程走一遍。\n[[tour|界面漫游]] [[go:${role === 'worker' ? 'home' : 'dashboard'}|回到首页]]`
  }
  if (role === 'enterprise') {
    if (has('发工资', '发薪', '薪酬', '试算', '批次')) return '发薪四步：1. 「薪酬管理」选一层点试算 2. 生成批次 3. 审批 4. 发放。任务层发放后自动代扣代缴并生成凭证包。\n[[coach:payroll|手把手带我发一次]] [[go:payroll|去薪酬管理]]'
    if (has('任务', '发布', '兼职', '拆解')) return '任务必须按成果计价。可以先让 AI 把需求拆成任务包并直接生成草稿，再在「任务与交付」发布。\n[[coach:ai|AI 拆解并生成草稿]] [[coach:tasks|手动发布一个任务]]'
    if (has('凭证', '扣除', '审计', '五流')) return '每笔结算自动生成五流合一凭证包（合同·业务·资金·票据·个税），在「结算与凭证包」点「五流合一」查看、「导出审计包」留档。\n[[go:settlements|去看凭证包]]'
    if (has('红', '拦截', '风险', '评分')) return '红色 = 劳动关系风险 ≥70（如坐班+月薪、老员工转灵工），禁止发布。改为按成果计价、去掉考勤/固定月薪描述后重新评估。\n[[agent:compliance_doctor|让合规诊断官帮我改]] [[go:tasks|回到任务]]'
    if (has('人员', '员工', '录入', '导入')) return '在「三层用工结构」新增人员，或在「企业设置」用 CSV 批量导入。层级决定税务路径。\n[[coach:employees|新增一名人员]] [[go:settings|批量导入]]'
    if (has('报表', '成本', '节省', '导出')) return '「经营报表」看用工成本结构、结算趋势、部门分布与节省测算，可导出 CSV；「成本对比」比较三种方案。\n[[go:reportcenter|去经营报表]] [[go:compare|去成本对比]]'
    if (has('ai', '模型', 'agent', '数字员工')) return '「AI 数字员工」有 15 个 Agent，输出可保存为报告或一键生成任务草稿。涉税 Agent 由规则引擎先算。\n[[go:ai|去 AI 数字员工]] [[coach:ai|跟教练走一遍]]'
  }
  if (role === 'admin') {
    if (has('申报', '复核', '提交')) return '「合规申报中心」：草稿 → 复核（规则引擎重算）→ 提交 → 回执。每月 15 日前完成。\n[[coach:filings|手把手完成一次申报]] [[go:filings|去申报中心]]'
    if (has('key', '模型', '算力', 'deepseek', '网关')) return '「算力网关」粘贴 DeepSeek / 算力网 / 平台托管 Key → 测试连通 → 自动启用。涉税 Agent 需要境内池（DeepSeek 或算力网）。\n[[coach:gateway|带我接入 Key]] [[go:gateway|去算力网关]]'
    if (has('风控', '黄色', '复核任务')) return '黄色任务在「风控中心」等您放行或拦截，决定会留痕。\n[[coach:risk|复核一个黄色任务]]'
    if (has('代征', '解缴', '凭证')) return '「委托代征」：代征 → 解缴 → 出具完税凭证；增值税代办申报提交后记录自动变为已解缴。\n[[go:collection|去委托代征]]'
  }
  if (role === 'opc') {
    if (has('工资', '分红', '发钱', '薪酬')) return '工资计入成本（省 5% 企业所得税），分红按 20%。在「OPC 薪酬」试算配比后生成薪酬单并发放。\n[[coach:payroll|带我发一次]] [[go:payroll|去 OPC 薪酬]]'
    if (has('记账', '收入', '成本', '发票')) return '在「收入与成本」记每笔收入（含开票）与成本（须有凭证）。\n[[coach:income|记一笔收入]]'
    if (has('税', '增值税', '所得税', '升级', '个体户')) return '「税务测算」看本月增值税（10 万起征点）与所得税；「三阶跃迁」判断是否该升级身份（前提是真实经营）。\n[[go:tax|去税务测算]] [[go:growth|去三阶跃迁]]'
  }
  if (role === 'worker') {
    if (has('实名', '认证')) return '首页点「立即实名」，1 分钟完成人脸活体与三要素核验并签署代办授权。未实名不能签约。\n[[go:home|去实名]]'
    if (has('接单', '任务', '申请')) return '去「任务大厅」挑按成果计价的任务点「申请接单」，企业确认后出现在「我的任务」。\n[[coach:hall|带我接一个]]'
    if (has('交付', '提交')) return '在「我的任务」对已签约任务点「提交交付」，系统自动存证；企业验收后进入结算。\n[[coach:orders|带我交付一次]]'
    if (has('税', '到手', '收入', '扣')) return '收入按累计预扣法预扣个税，月 10 万以下免增值税；「我的税负」可对比传统劳务按次预扣。\n[[go:tax|去我的税负]] [[go:income|去收入与凭证]]'
  }
  const sm = (SITE_MAP as any)[role]
  const coaches = Object.entries(sm?.coaches || {}).slice(0, 2).map(([k, v]) => `[[coach:${k}|${v}]]`).join(' ')
  return `我可以告诉您每个页面怎么用、下一步做什么。试试问："我该先做什么""怎么发工资""红色是什么意思"。\n[[tour|界面漫游]] ${coaches}`
}


/** 修复模型输出的动作标签：占位符删除、登录用户的 link:/view 转为 go:view、非法 view/key 删除 */
function sanitizeTags(text: string, u: any) {
  if (!u) return text.replace(/\[\[(go|coach|agent|tour)[^\]]*\]\]/g, '')
  const sm = (SITE_MAP as any)[u.role] || { views: {}, coaches: {} }
  const agentKeys = AGENTS.split(' · ').map(x => x.trim().split(' ').pop())
  return text.replace(/\[\[(go|coach|agent|link):([^\]|]+)\|([^\]]+)\]\]/g, (m, type, arg, label) => {
    arg = arg.trim()
    if (type === 'link') { const v = arg.replace(/^\/(enterprise|admin|opc|worker)?#?/, '').replace(/^\//, '').split(/[/?#]/)[0]; if (sm.views[v]) return `[[go:${v}|${label}]]`; if (/^\/(demo|login|guide|solutions|ai-tools|engine|calc|opc-path)/.test(arg)) return m; return '' }
    if (type === 'go') return sm.views[arg] ? m : (sm.views[arg.replace(/^#/, '')] ? `[[go:${arg.replace(/^#/, '')}|${label}]]` : '')
    if (type === 'coach') return sm.coaches[arg] ? m : ''
    if (type === 'agent') return agentKeys.includes(arg) ? m : ''
    return m
  })
}

/* ---------------- 建议问题 ---------------- */
a.get('/suggest', async (c) => {
  const u = await loadUser(c as any)
  const S: Record<string, string[]> = {
    guest: ['这个平台能帮我做什么？', '企业用它怎么发工资拿凭证？', '灵活就业者能省多少税？', '和传统灵工平台有什么区别？'],
    enterprise: ['我该先做什么？', '怎么发一次工资？', '任务被标红了怎么办？', '凭证包在哪里、怎么用于税前扣除？', '让 AI 帮我拆解一个需求'],
    admin: ['本期申报怎么做？', '怎么接入 DeepSeek Key？', '黄色任务怎么复核？', '代征解缴流程是什么？'],
    opc: ['工资和分红怎么配比？', '这个月要交增值税吗？', '什么时候该注册公司？', '怎么记一笔收入？'],
    worker: ['我该先做什么？', '怎么接单？', '交付后多久到账？', '我今年要交多少税？'],
  }
  return c.json({ role: u?.role || 'guest', suggestions: S[u?.role || 'guest'] })
})

/* ---------------- 对话（SSE） ---------------- */
a.post('/chat', async (c) => {
  const u = await loadUser(c as any)
  const b = await c.req.json<any>()
  const messages: Msg[] = (Array.isArray(b.messages) ? b.messages : []).slice(-10).filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  const enc = new TextEncoder()
  const send = (ctrl: ReadableStreamDefaultController, ev: string, data: any) => ctrl.enqueue(enc.encode(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`))
  const db = c.env.DB
  // 选择上游：优先境内池（DeepSeek/算力网），其次任意 live 供应商
  let prov: any = null, model: ModelRow | null = null
  try {
    const provs = (await db.prepare(`SELECT * FROM ai_providers`).all<any>()).results.map((p: any) => resolveProvider(p, c.env)).filter((p: any) => p.live)
    const models = (await db.prepare(`SELECT * FROM ai_models WHERE status='active' AND type IN ('chat')`).all<ModelRow>()).results.filter(m => provs.some((p: any) => p.key === m.provider_key))
    // 助手偏好：境内池优先 → 指定的快速高质量模型（deepseek-chat / gpt-5-mini）→ 质量 → 时延；排除 nano
    const PREFER = ['deepseek-chat', 'gpt-5-mini', 'qwen-plus', 'doubao-pro']
    const rank = (m: ModelRow) => { const i = PREFER.findIndex(k => m.model_id.includes(k)); return i < 0 ? 99 : i }
    const pick = models.filter(m => !/nano/i.test(m.model_id) || models.length === 1).sort((x, y) => (x.pool === 'domestic' ? 0 : 1) - (y.pool === 'domestic' ? 0 : 1) || rank(x) - rank(y) || y.quality - x.quality || y.latency - x.latency)[0]
    if (pick) { model = pick; prov = provs.find((p: any) => p.key === pick.provider_key) }
  } catch { }
  const rules = (await db.prepare(`SELECT * FROM dlp_rules WHERE enabled=1`).all<DlpRule>()).results
  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        if (!lastUser) { send(ctrl, 'error', { error: '缺少问题' }); ctrl.close(); return }
        const dlp = runDlp(lastUser.content, rules, 'standard')
        if (dlp.action === 'block') { send(ctrl, 'meta', { mode: 'rule', dlp: dlp.action }); send(ctrl, 'delta', { d: '为了保护您的信息，我不会处理这类内容。您可以换一种方式描述问题，或者去对应功能页面操作。' }); send(ctrl, 'done', {}); ctrl.close(); return }
        const sys: Msg[] = [{ role: 'system', content: KNOWLEDGE }, { role: 'system', content: ctxPrompt(u, b.ctx) }]
        const sanitized = messages.map(m => m === lastUser ? { ...m, content: dlp.text } : m)
        if (prov && model) {
          send(ctrl, 'meta', { mode: 'live', model: model.display_name, pool: model.pool, dlp: dlp.action })
          let text = ''
          try {
            for await (const ch of streamChat(prov, model.model_id, [...sys, ...sanitized], { temperature: 0.4, max_tokens: 700 })) { if (ch.delta) { text += ch.delta; send(ctrl, 'delta', { d: ch.delta }) } }
            if (!text.trim()) throw new Error('empty')
          } catch (e: any) {
            const fb = ruleAnswer(lastUser.content, u, b.ctx)
            text += (text ? '\n\n' : '') + fb
            send(ctrl, 'delta', { d: (text ? '\n\n' : '') + fb })
          }
          send(ctrl, 'done', { final: sanitizeTags(text, u) }); ctrl.close(); return
        }
        send(ctrl, 'meta', { mode: 'rule', dlp: dlp.action })
        const ans = ruleAnswer(lastUser.content, u, b.ctx)
        for (let i = 0; i < ans.length; i += 18) { send(ctrl, 'delta', { d: ans.slice(i, i + 18) }); await new Promise(r => setTimeout(r, 14)) }
        send(ctrl, 'done', {})
      } catch (e: any) { send(ctrl, 'error', { error: e.message }) }
      ctrl.close()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } })
})

export default a
