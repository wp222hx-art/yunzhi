import { HEAD } from './pages'

/** 营销站：首页短、内容分章节子页 */
export const CHAPTERS: Array<[string, string, string, string]> = [
  // [path, icon, title, one-liner]
  ['/solutions', 'fa-cubes', '解决方案', '三大风险 · 四大核心模块'],
  ['/ai-tools', 'fa-robot', 'AI 赋能工具', '15 个数字员工 · 算力网关 · 八大模块'],
  ['/engine', 'fa-shield-halved', '合规引擎', '五真一链 · 四层架构 · 政策依据'],
  ['/calc', 'fa-calculator', '免费测算', '从业人员 / 企业 / 超级个体三把尺子'],
  ['/opc-path', 'fa-rocket', 'OPC 成长路径', '一个人 + 一组 Agent = 一家公司'],
  ['/guide', 'fa-route', '平台怎么运转', '8 步主流程 × 4 类角色'],
]

export function mkShell(title: string, path: string, body: string, opts: { hero?: boolean } = {}) {
  const idx = CHAPTERS.findIndex(c => c[0] === path)
  const prev = idx > 0 ? CHAPTERS[idx - 1] : null, next = idx >= 0 && idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null
  return `${HEAD(title)}
<body class="bg-white text-ink antialiased">
<header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
  <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-lg"><span class="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center"><i class="fas fa-shield-halved"></i></span>云工智合佳<span class="text-xs font-normal text-slate-400 ml-1 hidden sm:inline">CloudWork Intel</span></a>
    <div class="hidden lg:flex items-center gap-6 text-sm text-slate-600" id="site-nav">
      ${CHAPTERS.map(([p, , t]) => `<a href="${p}" class="hover:text-brand-600 ${p === path ? 'text-brand-600 font-semibold' : ''}">${t}</a>`).join('')}
    </div>
    <div class="flex items-center gap-3">
      <a href="/login" class="text-sm text-slate-600 hover:text-brand-600">登录</a>
      <a href="/login" class="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg">免费体验</a>
    </div>
  </nav>
  <div class="lg:hidden border-t border-slate-100 overflow-auto"><div class="flex gap-4 px-6 py-2 text-xs whitespace-nowrap">${CHAPTERS.map(([p, , t]) => `<a href="${p}" class="${p === path ? 'text-brand-600 font-semibold' : 'text-slate-500'}">${t}</a>`).join('')}</div></div>
</header>
${idx >= 0 ? `<div class="bg-slate-50 border-b border-slate-100"><div class="max-w-7xl mx-auto px-6 py-2 text-xs text-slate-500 flex items-center gap-2"><a href="/" class="hover:text-brand-600">首页</a><i class="fas fa-chevron-right text-[9px]"></i><span class="text-slate-700">第 ${idx + 1} 章 · ${CHAPTERS[idx][2]}</span></div></div>` : ''}
<main id="page-main">${body}</main>
${idx >= 0 ? `<nav class="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-4" id="chapter-nav">
  ${prev ? `<a href="${prev[0]}" class="rounded-2xl border border-slate-200 p-5 hover:border-brand-500 hover:shadow-lg transition"><div class="text-xs text-slate-400"><i class="fas fa-arrow-left mr-1"></i>上一章</div><div class="font-bold mt-1">${prev[2]}</div><div class="text-sm text-slate-500">${prev[3]}</div></a>` : '<div></div>'}
  ${next ? `<a href="${next[0]}" class="rounded-2xl border border-slate-200 p-5 hover:border-brand-500 hover:shadow-lg transition text-right"><div class="text-xs text-slate-400">下一章<i class="fas fa-arrow-right ml-1"></i></div><div class="font-bold mt-1">${next[2]}</div><div class="text-sm text-slate-500">${next[3]}</div></a>` : `<a href="/login" class="rounded-2xl bg-brand-600 text-white p-5 hover:bg-brand-700 transition text-right"><div class="text-xs text-brand-100">读完了？</div><div class="font-bold mt-1">选择身份，一键进入体验</div><div class="text-sm text-brand-100">右下角 AI 助手会全程指导</div></a>`}
</nav>` : ''}
<footer class="border-t border-slate-100 py-10 text-center text-xs text-slate-400">
  <p>云工智合佳 CloudWork Intel · AI合规用工操作系统 · 已按规定完成互联网平台企业基本信息报送，依据税务总局2025年第16号公告提供扣缴申报与代办申报服务</p>
  <p class="mt-2">本平台测算均为示意性模型，不构成法律、税务或投资意见；各地税务机关执行口径可能存在差异，请以主管税务机关意见及执业律师、注册税务师书面意见为准。</p>
</footer>
<script>window.__ROLE__='guest';window.__PAGE__='${path}';</script>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/landing.js"></script>
<script src="/static/assistant.js"></script>
</body></html>`
}

const sectionTitle = (t: string, sub = '') => `<h2 class="text-3xl font-bold text-center">${t}</h2>${sub ? `<p class="text-center text-slate-500 mt-3">${sub}</p>` : ''}`

/* ---------------- 首页（短） ---------------- */
export function landingPage() {
  const hero = `
<section id="hero-section" class="relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-indigo-50"></div>
  <div class="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <span class="inline-flex items-center gap-2 text-xs font-medium bg-brand-100 text-brand-700 px-3 py-1 rounded-full"><i class="fas fa-bolt"></i>政策基准日 2026-10-09 · 税务总局2025年第16号公告</span>
      <h1 class="mt-6 text-4xl lg:text-5xl font-extrabold leading-tight">用工有弹性，<br><span class="text-brand-600">合规有确定性</span></h1>
      <p class="mt-6 text-lg text-slate-600 leading-relaxed">AI 合规用工操作系统（Compliance OS）。让每一笔灵活用工都<b>可证明、可审计、可扣除</b>；让每一位灵活就业者都<b>合法增收、可持续成长</b>。</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="/login" class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium"><i class="fas fa-play mr-2"></i>选择身份 · 一键体验</a>
        <a href="/guide" class="border border-slate-200 hover:border-brand-500 px-6 py-3 rounded-xl font-medium"><i class="fas fa-route mr-2"></i>1 分钟看懂怎么运转</a>
        <button onclick="window.CWAssistant&&CWAssistant.open('我是第一次来，帮我介绍一下这个平台能帮我做什么？')" class="text-brand-700 px-4 py-3 rounded-xl font-medium hover:bg-brand-50"><i class="fas fa-comment-dots mr-2"></i>问 AI 助手</button>
      </div>
      <div class="mt-10 grid grid-cols-3 gap-6 text-sm">
        <div><div class="text-2xl font-bold text-brand-600">五流合一</div><div class="text-slate-500">合同·业务·资金·票据·个税</div></div>
        <div><div class="text-2xl font-bold text-brand-600">15 个</div><div class="text-slate-500">开箱即用 AI 数字员工</div></div>
        <div><div class="text-2xl font-bold text-brand-600">60+</div><div class="text-slate-500">大模型一个 Key 调用</div></div>
      </div>
    </div>
    <div class="relative">
      <div class="rounded-2xl shadow-2xl border border-slate-100 bg-white p-6">
        <div class="flex items-center justify-between text-sm"><span class="font-semibold"><i class="fas fa-robot text-brand-600 mr-2"></i>劳动关系风控 Agent · 实时评分</span><span class="text-xs text-slate-400">AI辅助生成 · 规则引擎校验</span></div>
        <div class="mt-4 space-y-3" id="hero-risk">
          ${[['人格从属', 25, 0], ['经济从属', 20, 4], ['组织从属', 20, 0], ['工作时间', 15, 3], ['交付计价', 10, 0], ['身份迁移', 10, 0]].map(([n, w, s]) => `<div><div class="flex justify-between text-xs text-slate-500"><span>${n}（权重${w}%）</span><span>${s}分</span></div><div class="h-2 bg-slate-100 rounded-full mt-1"><div class="h-2 rounded-full bg-emerald-500" style="width:${(s as number) / (w as number) * 100}%"></div></div></div>`).join('')}
        </div>
        <div class="mt-5 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 p-4"><div><div class="text-xs text-emerald-700">综合评分</div><div class="text-3xl font-extrabold text-emerald-600">7<span class="text-base font-medium">/100</span></div></div><div class="text-right text-sm text-emerald-700"><div class="font-semibold">绿 · 自动放行</div><div class="text-xs">任务：品牌视觉海报设计（按稿计价）</div></div></div>
      </div>
      <div class="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 text-sm"><i class="fas fa-file-shield text-brand-600 mr-2"></i>凭证包 EV-ST20261007-0001 已归档</div>
    </div>
  </div>
</section>`
  const chapters = `
<section id="chapters" class="max-w-7xl mx-auto px-6 py-16">
  ${sectionTitle('六个章节，读懂整个平台', '每章一页，各自独立；读完任意一章都可以直接进入体验')}
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
    ${CHAPTERS.map(([p, i, t, d], idx) => `<a href="${p}" class="group rounded-2xl border border-slate-100 p-6 hover:border-brand-500 hover:shadow-xl transition block"><div class="flex items-center justify-between"><div class="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center text-xl"><i class="fas ${i}"></i></div><span class="text-xs text-slate-400">第 ${idx + 1} 章</span></div><h3 class="mt-5 font-bold text-lg">${t}</h3><p class="mt-1 text-sm text-slate-500">${d}</p><div class="mt-4 text-sm text-brand-600 group-hover:translate-x-1 transition">阅读本章 <i class="fas fa-arrow-right"></i></div></a>`).join('')}
  </div>
</section>`
  const personas = `
<section id="personas" class="bg-slate-50 py-16">
  <div class="max-w-7xl mx-auto px-6">
    ${sectionTitle('您是哪一类用户？', '选对身份，系统按您的工作流程一步步引导')}
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
      ${[['enterprise', 'fa-building-user', '企业 HR / 财务', '发工资、结兼职、拿合规凭证', 'brand'], ['worker', 'fa-user', '灵活就业者', '接任务、看到手、少缴冤枉税', 'emerald'], ['opc', 'fa-rocket', '超级个体 / 一人公司', '给自己发工资、算分红、看该不该注册公司', 'violet'], ['admin', 'fa-building-shield', '平台合规运营', '扣缴申报、委托代征、风控复核', 'amber']].map(([k, i, t, d, c]) => `<a href="/demo/${k}" class="bg-white rounded-2xl p-6 border border-slate-100 hover:-translate-y-1 hover:shadow-xl transition block"><div class="w-12 h-12 rounded-xl bg-${c}-100 text-${c}-600 grid place-items-center text-xl"><i class="fas ${i}"></i></div><div class="mt-4 font-bold">${t}</div><div class="text-sm text-slate-500 mt-1">${d}</div><div class="mt-4 text-sm font-medium text-${c}-600">一键体验 <i class="fas fa-arrow-right ml-1"></i></div></a>`).join('')}
    </div>
  </div>
</section>
<section class="max-w-7xl mx-auto px-6 py-16">
  <div class="rounded-3xl bg-brand-600 text-white p-10 grid lg:grid-cols-3 gap-6 items-center">
    <div class="lg:col-span-2"><h2 class="text-2xl font-bold">进入后不会用？不存在的。</h2><p class="mt-2 text-brand-100">首次登录自动打开「布局地图」和分步漫游；每页有「这页怎么用」；「操作教练」在真实页面上手把手带你点；右下角 AI 助手随时回答并直接帮你跳到对应功能。</p></div>
    <a href="/login" class="bg-white text-brand-700 px-6 py-3 rounded-xl font-semibold text-center">立即体验 · 演示账号一键登录</a>
  </div>
</section>`
  return mkShell('AI合规用工操作系统', '/', hero + chapters + personas)
}

/* ---------------- 第 1 章：解决方案 ---------------- */
export function solutionsPage() {
  const body = `
<section id="pain" class="max-w-7xl mx-auto px-6 py-16">
  ${sectionTitle('灵活用工正在从"洼地套利"进入"数据化监管"时代', '金税四期 + 涉税信息报送 + 增值税法实施：红利属于合规者，而非通道商')}
  <div class="grid md:grid-cols-3 gap-6 mt-12">
    ${[['fa-user-tie', '劳动关系穿透认定', '全职转灵工、固定月薪、坐班考勤——一旦被认定为劳动关系，节省的税费将以补缴社保、双倍工资加倍返还。', '劳动关系风险AI评分 · 老员工转灵工一票否决'],
      ['fa-file-invoice', '税前扣除凭证不被认可', '只有服务费发票+申报清单，劳务主体部分扣除依据可能受质疑，面临25%企业所得税损失。', '五流合一凭证包 · 扣除凭证合规意见书'],
      ['fa-link-slash', '虚构业务与虚开连带', '无真实交付、资金回流、一人多号——老灵工平台"赚票点"模式被严查，连带风险波及用工企业。', '交付物存证 · 资金闭环监测 · 持牌受托分账']].map(([i, t, d, s]) => `
    <article class="rounded-2xl border border-slate-100 p-7 hover:shadow-lg transition">
      <div class="w-12 h-12 rounded-xl bg-red-50 text-red-500 grid place-items-center text-xl"><i class="fas ${i}"></i></div>
      <h3 class="mt-5 font-bold text-lg">${t}</h3><p class="mt-2 text-sm text-slate-600 leading-relaxed">${d}</p>
      <div class="mt-4 text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2"><i class="fas fa-check mr-1"></i>${s}</div>
    </article>`).join('')}
  </div>
</section>
<section id="solutions" class="bg-slate-50 py-16">
  <div class="max-w-7xl mx-auto px-6">
    ${sectionTitle('四大核心模块 · 前后台一体')}
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
      ${[['fa-desktop', 'PC端合规申报', '工资薪金扣缴、劳务报酬累计预扣、增值税代办、涉税信息报送——规则引擎计算、双人复核、一键申报、回执归档。', '/demo/admin#filings'],
        ['fa-landmark', '合理征税与委托代征', '按月合并销售额适用10万元起征点、3%减按1%、不拆分；代征→解缴→出具完税凭证全链路可追溯。', '/demo/admin#collection'],
        ['fa-building-user', '企业全量薪酬管理', '核心层（劳动合同）/弹性层（非全日制·外包）/任务层（平台灵工）三层结构，一套系统算清全部用工成本与税负。', '/demo/enterprise#payroll'],
        ['fa-rocket', 'OPC薪酬与经营舱', '股东工资+分红最优配比、小微5%税负、三阶跃迁测算、四道防火墙监测，让超级个体合法增收。', '/demo/opc']].map(([i, t, d, h]) => `
      <a href="${h}" class="group rounded-2xl bg-white border border-slate-100 p-6 hover:border-brand-500 hover:shadow-xl transition block">
        <div class="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center text-xl"><i class="fas ${i}"></i></div>
        <h3 class="mt-5 font-bold">${t}</h3><p class="mt-2 text-sm text-slate-600 leading-relaxed">${d}</p>
        <div class="mt-4 text-sm text-brand-600 group-hover:translate-x-1 transition">进入演示 <i class="fas fa-arrow-right"></i></div>
      </a>`).join('')}
    </div>
  </div>
</section>
<section class="max-w-7xl mx-auto px-6 py-16">
  ${sectionTitle('一句话卖点', '从"比别人便宜"转为"同等成本下风险归零"')}
  <div class="grid md:grid-cols-4 gap-4 mt-10 text-sm">
    ${[['无虚开连带风险', '真业务 + 真交付 + 资金单向'], ['税前扣除凭证合法', '五流合一凭证包，保存≥10年'], ['从业人员到手更多', '累计预扣法 vs 传统按次预扣'], ['劳动关系风险前置', 'AI 评分 + 一票否决，发布前拦截']].map(([t, d]) => `<div class="rounded-xl border border-slate-100 p-5"><div class="font-bold text-brand-700">${t}</div><div class="text-slate-500 mt-1">${d}</div></div>`).join('')}
  </div>
</section>`
  return mkShell('解决方案', '/solutions', body)
}

/* ---------------- 第 2 章：AI 赋能工具 ---------------- */
export function aiToolsPage() {
  const agents = [['用工合规诊断官', '合规'], ['任务拆解定价师', '合规'], ['智能合同', '合规'], ['税负解读官', '合规'], ['OPC 成长教练', '合规'], ['AI 销售宝', '增长'], ['电商文案官', '电商'], ['AIGC 工坊', '内容'], ['智能客服', '运营'], ['经营分析师', '经营'], ['人事助理', '人事'], ['财务助理', '财务'], ['轻站搭建', '增长'], ['政策补贴匹配', '政策'], ['路演 BP 教练', '资本']]
  const body = `
<section id="ai" class="bg-ink text-white py-16">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center"><span class="text-xs bg-white/10 px-3 py-1 rounded-full">合规 × AI × 算力 · 三位一体</span><h2 class="text-3xl font-bold mt-4">企业 AI 赋能工具箱</h2><p class="text-slate-400 mt-2">让 AI 算力成为企业增长的新水电：一个入口，调用国内外 60+ 大模型；八大能力模块，覆盖从算力到政策与资本。</p></div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
      ${[['fa-list-check', '任务中心', '需求发布、接单、交付、验收一站式管理，合规结算'], ['fa-microchip', '算力中心', '境内备案池 + 海外可控池，智能路由，Token 统一结算'], ['fa-boxes-stacked', '项目超市', '标准化 AI 项目模板，快速复制落地'], ['fa-store', '服务集市', 'Skill · MCP · Agent，开发者上架，企业直接调用'], ['fa-users-gear', 'AI 人才', '连接企业与 AI 工程师、运营专家，合规结算'], ['fa-layer-group', '特色专区', '直播电商 / 数据标注 / 教育 / 软件众包行业方案'], ['fa-landmark', '政策政府', '产业政策、算力券、OPC 扶持匹配与申报'], ['fa-chart-line', '投融路演', '项目展示、BP 辅导、投融资对接']].map(([i, t, d]) => `<div class="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition"><i class="fas ${i} text-brand-300 text-xl"></i><div class="font-bold mt-3">${t}</div><div class="text-sm text-slate-400 mt-1">${d}</div></div>`).join('')}
    </div>
  </div>
</section>
<section class="max-w-7xl mx-auto px-6 py-16">
  ${sectionTitle('15 个开箱即用的 AI 数字员工', '涉税 Agent 由规则引擎先算、模型只解释——AI 三不原则')}
  <div class="flex flex-wrap justify-center gap-2 mt-8">${agents.map(([n, c]) => `<span class="inline-flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 text-sm"><i class="fas fa-robot text-brand-500"></i>${n}<span class="text-[10px] text-slate-400">${c}</span></span>`).join('')}</div>
  <div class="grid lg:grid-cols-3 gap-6 mt-12">
    <div class="rounded-2xl border border-slate-100 p-6"><div class="text-xs text-slate-400">每次调用五步闭环</div><ol class="mt-3 space-y-2 text-sm">${['L2 DLP 输入检测（脱敏 / 阻断 / 分流）', 'L3 智能路由（质量 / 均衡 / 成本 / 时延）', 'L4 调用境内备案池或海外可控池', 'L2 DLP 输出检测', 'L5 Token 计费 + SHA-256 存证'].map((x, i) => `<li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs grid place-items-center font-bold shrink-0">${i + 1}</span>${x}</li>`).join('')}</ol></div>
    <div class="rounded-2xl border border-slate-100 p-6"><div class="text-xs text-slate-400">结果直接变成业务动作</div><div class="mt-3 space-y-2 text-sm">${['拆解结果 → 一键创建任务草稿 → 风控评分 → 发布', '诊断结论 → 跳转调整用工结构', '任何输出 → 保存为报告（含存证哈希）'].map(x => `<div class="flex gap-2"><i class="fas fa-arrow-turn-down text-brand-500 rotate-[-90deg] mt-1"></i>${x}</div>`).join('')}</div></div>
    <div class="rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white p-6"><div class="text-sm text-brand-100">Token 计费 · 透明可追溯</div><div class="grid grid-cols-2 gap-3 mt-3 text-center"><div class="bg-white/10 rounded-xl p-3"><div class="text-2xl font-bold">60+</div><div class="text-xs text-brand-100">接入大模型</div></div><div class="bg-white/10 rounded-xl p-3"><div class="text-2xl font-bold">1 Key</div><div class="text-xs text-brand-100">一次接入全部调用</div></div><div class="bg-white/10 rounded-xl p-3"><div class="text-2xl font-bold">15%</div><div class="text-xs text-brand-100">消费返 Token</div></div><div class="bg-white/10 rounded-xl p-3"><div class="text-2xl font-bold">¥99</div><div class="text-xs text-brand-100">起步套餐</div></div></div><a href="/demo/enterprise#ai" class="block mt-4 text-center bg-white text-ink rounded-xl py-2 text-sm font-medium">进入 AI 数字员工演示</a></div>
  </div>
</section>
<section class="bg-slate-50 py-16">
  <div class="max-w-7xl mx-auto px-6">
    ${sectionTitle('算力网关 · 五层架构', '企业用一个 OpenAI 兼容 Key 把自有系统接进来')}
    <div class="grid md:grid-cols-5 gap-3 mt-10 text-sm">${[['L1', '统一接入', 'OpenAI 兼容 · 子密钥 · BYOK'], ['L2', 'DLP 网关', '八大模块 · 300ms 分级处置'], ['L3', '聚合分发', '智能风险路由'], ['L4', '资源适配', '境内备案池 + 海外可控池'], ['L5', '运营合规', '计费 · 报告 · 全链路存证']].map(([l, t, d]) => `<div class="rounded-2xl bg-white border border-slate-100 p-5"><div class="font-mono text-brand-600 text-xs">${l}</div><div class="font-bold mt-1">${t}</div><div class="text-slate-500 mt-1 text-xs">${d}</div></div>`).join('')}</div>
  </div>
</section>`
  return mkShell('AI 赋能工具', '/ai-tools', body)
}

/* ---------------- 第 3 章：合规引擎 ---------------- */
export function enginePage() {
  const body = `
<section id="engine" class="max-w-7xl mx-auto px-6 py-16">
  <div class="grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <h2 class="text-3xl font-bold">"五真一链"合规内核</h2>
      <p class="mt-3 text-slate-500">合规不是口号，而是可审计的产品能力。确定性计算由规则引擎完成，AI只做理解、识别、预警与建议。</p>
      <ul class="mt-8 space-y-4">
        ${[['真主体', '人脸活体实名 + 定期复核 + 设备指纹'], ['真业务', '任务模板库 + AI合理性审核'], ['真交付', '交付物上传、AI识别、客户验收签署、哈希存证'], ['真资金', '持牌分账、资金单向流动、无回流'], ['真定价', '行业价格带监测，偏离>3σ预警'], ['证据链', '自动生成五流合一凭证包，保存≥10年']].map(([t, d]) => `<li class="flex gap-4"><span class="w-10 h-10 shrink-0 rounded-lg bg-brand-50 text-brand-600 grid place-items-center font-bold text-sm">${t.slice(0, 1)}</span><div><div class="font-semibold">${t}</div><div class="text-sm text-slate-500">${d}</div></div></li>`).join('')}
      </ul>
    </div>
    <div class="rounded-2xl bg-ink text-white p-8">
      <div class="text-sm text-slate-400">四层产品架构</div>
      ${[['L4 生态层', 'OPC成长中心 / 产业园区 / 保险与金融'], ['L3 AI Agent层', '诊断·拆解·合同·验收·风控·测算·OPC成长 七大Agent'], ['L2 交易层', '任务大厅 / 电子签 / 持牌分账 / 结算'], ['L1 合规中台', '实名核验 / 税务引擎 / 证据链存证 / 数据报送']].map(([t, d], i) => `<div class="mt-4 rounded-xl border border-white/10 p-4 ${i === 3 ? 'bg-brand-600/30 border-brand-500/40' : 'bg-white/5'}"><div class="font-semibold">${t}</div><div class="text-sm text-slate-300 mt-1">${d}</div></div>`).join('')}
      <div class="mt-6 text-xs text-slate-400 border-t border-white/10 pt-4"><i class="fas fa-lock mr-1"></i>AI三不原则：不让大模型算税 · 不让AI单独作重大决定 · 不用个人信息做未授权训练</div>
    </div>
  </div>
</section>
<section class="bg-slate-50 py-16">
  <div class="max-w-7xl mx-auto px-6">
    ${sectionTitle('劳动关系风险评分卡', '六维加权 · 一票否决 · 组合升红，任务发布前完成')}
    <div class="grid md:grid-cols-6 gap-3 mt-10 text-sm">${[['人格从属', 25], ['经济从属', 20], ['组织从属', 20], ['工作时间', 15], ['交付计价', 10], ['身份迁移', 10]].map(([n, w]) => `<div class="rounded-2xl bg-white border border-slate-100 p-4 text-center"><div class="text-2xl font-bold text-brand-600">${w}%</div><div class="text-slate-600 mt-1">${n}</div></div>`).join('')}</div>
    <div class="grid md:grid-cols-3 gap-4 mt-6 text-sm">${[['green', '0-39 绿', '自动放行'], ['yellow', '40-69 黄', '人工复核'], ['red', '70+ 红', '禁止发布 · 老员工转灵工 / 坐班+月薪 直接升红']].map(([c, t, d]) => `<div class="rounded-xl p-4 ${{ green: 'bg-emerald-50 text-emerald-800', yellow: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-800' }[c]}"><div class="font-bold">${t}</div><div class="text-xs mt-1">${d}</div></div>`).join('')}</div>
  </div>
</section>
<section id="policy" class="max-w-7xl mx-auto px-6 py-16">
  ${sectionTitle('政策依据（只引文件，不引讲话）')}
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 text-sm">
    ${[['国务院令第810号', '互联网平台企业涉税信息报送规定', '2025-06'], ['税务总局公告2025年第15号', '涉税信息报送口径与流程', '2025-07'], ['税务总局公告2025年第16号', '劳务报酬累计预扣 · 增值税代办申报 · 税前扣除', '2025-10-01'], ['国务院令第826号', '增值税法及实施条例', '2026-01-01'], ['财政部 税务总局公告2026年第10号', '月10万元起征点延续至2027年底；按次1000元', '2026-01-30'], ['法释·劳动争议解释（二）', '混同用工连带责任；约定不缴社保无效', '2025-09-01'], ['财税2023年第12号', '小微企业5% · 个体户200万内减半', '至2027-12-31'], ['税务总局公告2018年第28号', '企业所得税税前扣除凭证管理办法', '2018-07-01'], ['税务总局公告2018年第61号', '个人所得税扣缴申报管理办法', '2019-01-01']].map(([n, t, d]) => `<div class="rounded-xl bg-white border border-slate-100 p-4"><div class="font-semibold text-brand-700">${n}</div><div class="text-slate-600 mt-1">${t}</div><div class="text-xs text-slate-400 mt-2"><i class="far fa-calendar mr-1"></i>${d}</div></div>`).join('')}
  </div>
</section>`
  return mkShell('合规引擎', '/engine', body)
}

/* ---------------- 第 4 章：免费测算 ---------------- */
export function calcPage() {
  const body = `
<section id="calc" class="bg-gradient-to-b from-slate-50 to-white py-16">
  <div class="max-w-7xl mx-auto px-6">
    ${sectionTitle('免费税负测算器', '规则引擎实时计算 · 预缴口径 · 结果附计算公式')}
    <div class="grid lg:grid-cols-3 gap-6 mt-12">
      <div class="rounded-2xl bg-white border border-slate-100 p-6">
        <h3 class="font-bold"><i class="fas fa-user text-brand-600 mr-2"></i>从业人员：累计预扣 vs 传统劳务</h3>
        <label class="block mt-4 text-sm text-slate-600">月收入（元）</label>
        <input id="calc-labor-monthly" type="number" value="8000" class="mt-1 w-full border rounded-lg px-3 py-2">
        <button onclick="calcLabor()" class="mt-4 w-full bg-brand-600 text-white rounded-lg py-2">计算全年</button>
        <div id="calc-labor-result" class="mt-4 text-sm"></div>
      </div>
      <div class="rounded-2xl bg-white border border-slate-100 p-6">
        <h3 class="font-bold"><i class="fas fa-building text-brand-600 mr-2"></i>企业：用工方案成本对比</h3>
        <label class="block mt-4 text-sm text-slate-600">月发放总额（元）</label>
        <input id="calc-ent-payout" type="number" value="300000" class="mt-1 w-full border rounded-lg px-3 py-2">
        <select id="calc-ent-type" class="mt-2 w-full border rounded-lg px-3 py-2"><option value="general">一般纳税人</option><option value="small">小规模纳税人</option></select>
        <button onclick="calcEnt()" class="mt-4 w-full bg-brand-600 text-white rounded-lg py-2">对比</button>
        <div id="calc-ent-result" class="mt-4 text-sm"></div>
      </div>
      <div class="rounded-2xl bg-white border border-slate-100 p-6">
        <h3 class="font-bold"><i class="fas fa-rocket text-brand-600 mr-2"></i>超级个体：三阶跃迁测算</h3>
        <label class="block mt-4 text-sm text-slate-600">年收入（元）</label>
        <input id="calc-opc-income" type="number" value="600000" class="mt-1 w-full border rounded-lg px-3 py-2">
        <button onclick="calcOpc()" class="mt-4 w-full bg-brand-600 text-white rounded-lg py-2">测算</button>
        <div id="calc-opc-result" class="mt-4 text-sm"></div>
      </div>
    </div>
    <p class="text-center text-xs text-slate-400 mt-8">所有税额由确定性规则引擎计算，AI 不参与计算；结果为示意口径，以主管税务机关意见为准。</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-6 py-16">
  ${sectionTitle('这些数字从哪里来？')}
  <div class="grid md:grid-cols-3 gap-5 mt-10 text-sm">${[['累计预扣法（16号公告）', '劳务报酬 ×80% − 5000/月 累计，按综合所得七级预扣率表预扣，年度汇算多退少补。'], ['增值税代办', '按月合并全部销售额，10 万元以下免征；超出部分 3% 减按 1%，附加减半。'], ['OPC 三阶对比', '自然人（累计预扣）/ 个体户（经营所得 200 万内减半）/ 一人公司（小微 5% + 工资/分红配比）。']].map(([t, d]) => `<div class="rounded-2xl border border-slate-100 p-5"><div class="font-bold">${t}</div><div class="text-slate-600 mt-2 leading-relaxed">${d}</div></div>`).join('')}</div>
</section>`
  return mkShell('免费测算', '/calc', body)
}

/* ---------------- 第 5 章：OPC 成长路径 ---------------- */
export function opcPage() {
  const body = `
<section id="opc" class="max-w-7xl mx-auto px-6 py-16">
  ${sectionTitle('OPC "三阶跃迁" 成长路径', 'AI让"一个人 + 一组Agent = 一家公司"成为现实')}
  <div class="grid md:grid-cols-3 gap-6 mt-12">
    ${[['L1 起步期', '平台从业人员', '< 20万元/年', '劳务报酬累计预扣；增值税代办，月10万元以下免征', '接单 · 结算 · 税负测算 · 技能认证'], ['L2 成长期', '个体工商户（查账）', '20万-60万元/年', '经营所得5%-35%，200万元内减半', '代注册 · 代记账 · 经营指导'], ['L3 公司化', '一人有限公司 OPC', '> 60万元/年', '小微企业所得税5% + 股东工资/分红；可开专票', '注册 · 财税托管 · 法务 · 获客 · 算力补贴']].map(([s, i, inc, t, sv], idx) => `
    <article class="rounded-2xl border ${idx === 2 ? 'border-brand-500 shadow-xl' : 'border-slate-100'} p-7 relative">
      ${idx === 2 ? '<span class="absolute -top-3 right-6 bg-brand-600 text-white text-xs px-3 py-1 rounded-full">第二增长曲线</span>' : ''}
      <div class="text-brand-600 font-bold">${s}</div><h3 class="text-xl font-bold mt-1">${i}</h3><div class="text-sm text-slate-500 mt-1">${inc}</div>
      <div class="mt-4 text-sm"><div class="text-slate-400 text-xs">税务路径</div>${t}</div>
      <div class="mt-3 text-sm"><div class="text-slate-400 text-xs">平台服务</div>${sv}</div>
    </article>`).join('')}
  </div>
  <p class="mt-6 text-xs text-slate-400 text-center">关键前提：升级为个体户/OPC必须基于真实经营（多客户、自有工具、独立承担风险、按成果收费）。</p>
</section>
<section class="bg-slate-50 py-16">
  <div class="max-w-7xl mx-auto px-6">
    ${sectionTitle('一站式经营舱', '一人公司的财税跑在一个仪表盘上')}
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 text-sm">${[['fa-sack-dollar', '收入与成本', '只就真实业务开票；无凭证成本不能列支'], ['fa-wallet', '工资 + 分红配比', '工资计入成本省 5%；分红 20%；系统帮你配比'], ['fa-receipt', '税务测算', '本月增值税起征点 + 所得税 + 三阶对比'], ['fa-fire-extinguisher', '四道防火墙', '财产独立 / 注册资本 / 客户集中度 / 发票成本']].map(([i, t, d]) => `<div class="rounded-2xl bg-white border border-slate-100 p-5"><i class="fas ${i} text-brand-600 text-xl"></i><div class="font-bold mt-3">${t}</div><div class="text-slate-500 mt-1">${d}</div></div>`).join('')}</div>
    <div class="text-center mt-8"><a href="/demo/opc" class="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-medium">进入 OPC 经营舱演示</a></div>
  </div>
</section>`
  return mkShell('OPC 成长路径', '/opc-path', body)
}

/* ---------------- 第 6 章：平台怎么运转 ---------------- */
export function guidePage() {
  const steps = [
    ['01', '企业入驻', '平台运营', '尽调准入（工商/司法/税务信用）→ 配置纳税人身份与服务费率 → 开通企业账号', 'fa-building'],
    ['02', '发布任务', '企业', '按成果计价发布任务（按件/项目/里程碑）→ AI劳动关系风控评分 → 绿放行/黄复核/红拦截', 'fa-list-check'],
    ['03', '接单签约', '灵活就业者', '实名核验 + 签署代办申报授权 → 任务大厅申请 → 企业确认 → 自动生成电子合同并存证', 'fa-file-signature'],
    ['04', '交付验收', '灵活就业者 + 企业', '上传交付成果（哈希存证）→ 企业验收签署 → 形成"真交付"证据', 'fa-box-open'],
    ['05', '一键发放', '企业', '核心层/弹性层/任务层三层薪酬试算 → 审批 → 发放；任务层经持牌支付机构受托分账', 'fa-money-check-dollar'],
    ['06', '扣缴申报', '平台运营', '劳务报酬累计预扣 + 增值税代办申报草稿自动生成 → 规则引擎重算复核 → 提交 → 回执', 'fa-file-invoice'],
    ['07', '代征解缴', '平台运营', '委托代征税款汇总解缴 → 出具完税凭证', 'fa-landmark'],
    ['08', '凭证归档', '企业', '五流合一凭证包（合同·业务·资金·票据·个税）自动归档，支持税前扣除，保存≥10年', 'fa-file-shield'],
  ]
  const personas = [
    ['fa-building-user', '企业 HR / 财务', 'brand', '/demo/enterprise', ['录人员（三层结构）', '发任务（AI风控）', '验收交付', '算薪发放', '拿凭证包'], '每月15日前把本月薪酬发了，系统其余自动流转'],
    ['fa-user', '灵活就业者', 'emerald', '/demo/worker', ['1分钟实名', '任务大厅接单', '交付成果', '看到手收入', '看税负与成长建议'], '只需做三件事：实名、接单、交付'],
    ['fa-rocket', '超级个体 / OPC', 'violet', '/demo/opc', ['记收入与成本', '给自己发工资+分红', '看增值税与所得税', '三阶跃迁测算', '四道防火墙'], '把一人公司的财税跑在一个仪表盘上'],
    ['fa-building-shield', '平台合规运营', 'amber', '/demo/admin', ['企业入驻尽调', '从业人员实名', '风控复核', '申报复核与提交', '代征解缴出凭证'], '每期按"待办"清单逐项处理，零遗漏'],
  ]
  const body = `
<div class="bg-slate-50"><div class="max-w-6xl mx-auto px-6 py-12">
  <h1 class="text-3xl font-bold text-center">一分钟看懂：平台是怎么运转的</h1>
  <p class="text-center text-slate-500 mt-2">一条主流程 · 四类角色 · 每一步都有证据留痕</p>
  <section class="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
    ${steps.map(([n, t, o, d, i]) => `<article class="bg-white rounded-2xl border p-5 relative"><div class="absolute -top-3 left-5 bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">${n}</div><div class="flex items-center justify-between mt-1"><div class="font-bold">${t}</div><i class="fas ${i} text-brand-500"></i></div><div class="text-xs text-brand-700 bg-brand-50 inline-block px-2 py-0.5 rounded mt-2">${o}</div><p class="text-sm text-slate-600 mt-3 leading-relaxed">${d}</p></article>`).join('')}
  </section>
  <h2 class="text-2xl font-bold text-center mt-16">您在流程中的位置</h2>
  <section class="mt-8 grid md:grid-cols-2 gap-5">
    ${personas.map(([i, t, c, h, list, tip]) => `<article class="bg-white rounded-2xl border p-6"><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-xl bg-${c}-100 text-${c}-600 grid place-items-center"><i class="fas ${i}"></i></div><div class="font-bold text-lg">${t}</div></div><ol class="mt-4 space-y-2">${(list as string[]).map((x, idx) => `<li class="flex items-center gap-3 text-sm"><span class="w-6 h-6 rounded-full bg-${c}-50 text-${c}-700 text-xs grid place-items-center font-bold">${idx + 1}</span>${x}</li>`).join('')}</ol><div class="mt-4 text-xs text-slate-500 bg-slate-50 rounded-lg p-3"><i class="fas fa-lightbulb text-amber-500 mr-1"></i>${tip}</div><a href="${h}" class="inline-block mt-4 text-sm bg-${c}-600 text-white px-4 py-2 rounded-lg">以此身份体验 <i class="fas fa-arrow-right ml-1"></i></a></article>`).join('')}
  </section>
  <section class="mt-16 bg-ink text-white rounded-3xl p-10">
    <h2 class="text-2xl font-bold">为什么这样设计？</h2>
    <div class="grid md:grid-cols-3 gap-6 mt-6 text-sm text-slate-300">
      <div><div class="text-white font-semibold mb-1">① 每一步都留证据</div>税前扣除的生命线是"业务真实性材料"。合同哈希、交付哈希、分账流水、完税凭证自动归档成五流合一凭证包。</div>
      <div><div class="text-white font-semibold mb-1">② 风控前置，不事后救火</div>任务发布前 AI 评分；老员工转灵工一票否决；未实名不可签约——把风险挡在发生之前。</div>
      <div><div class="text-white font-semibold mb-1">③ 算税交给规则，建议交给 AI</div>累计预扣、增值税起征点、小微优惠全部是确定性规则；AI 只负责解释、提醒与推荐。</div>
    </div>
  </section>
</div></div>`
  return mkShell('平台运转流程', '/guide', body)
}
