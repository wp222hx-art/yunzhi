const HEAD = (title: string) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · 云工智合佳 Compliance OS</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
<script>tailwind.config={theme:{extend:{colors:{brand:{50:'#eef4ff',100:'#d9e5ff',500:'#2f5bea',600:'#1f46c7',700:'#1a3aa3',900:'#0f2361'},ink:'#0b1220'}}}}</script>
</head>`

export function landingPage() {
  return `${HEAD('AI合规用工操作系统')}
<body class="bg-white text-ink antialiased">
<header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
  <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-lg"><span class="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center"><i class="fas fa-shield-halved"></i></span>云工智合佳<span class="text-xs font-normal text-slate-400 ml-1">CloudWork Intel</span></a>
    <div class="hidden md:flex items-center gap-8 text-sm text-slate-600">
      <a href="#solutions" class="hover:text-brand-600">解决方案</a>
      <a href="#engine" class="hover:text-brand-600">合规引擎</a>
      <a href="#calc" class="hover:text-brand-600">免费测算</a>
      <a href="#opc" class="hover:text-brand-600">OPC经营舱</a>
      <a href="#policy" class="hover:text-brand-600">政策依据</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="/login" class="text-sm text-slate-600 hover:text-brand-600">登录</a>
      <a href="/login" class="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg">免费合规体检</a>
    </div>
  </nav>
</header>

<section id="hero-section" class="relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-indigo-50"></div>
  <div class="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <span class="inline-flex items-center gap-2 text-xs font-medium bg-brand-100 text-brand-700 px-3 py-1 rounded-full"><i class="fas fa-bolt"></i>政策基准日 2026-10-09 · 税务总局2025年第16号公告</span>
      <h1 class="mt-6 text-4xl lg:text-5xl font-extrabold leading-tight">用工有弹性，<br><span class="text-brand-600">合规有确定性</span></h1>
      <p class="mt-6 text-lg text-slate-600 leading-relaxed">中国首个 AI 合规用工操作系统（Compliance OS）。让每一笔灵活用工都<b>可证明、可审计、可扣除</b>；让每一位灵活就业者都<b>合法增收、可持续成长</b>。</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="/login" class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium"><i class="fas fa-stethoscope mr-2"></i>30分钟用工合规体检</a>
        <a href="#calc" class="border border-slate-200 hover:border-brand-500 px-6 py-3 rounded-xl font-medium"><i class="fas fa-calculator mr-2"></i>税负测算器</a>
      </div>
      <div class="mt-10 grid grid-cols-3 gap-6 text-sm">
        <div><div class="text-2xl font-bold text-brand-600">五流合一</div><div class="text-slate-500">合同·业务·资金·票据·个税</div></div>
        <div><div class="text-2xl font-bold text-brand-600">100%</div><div class="text-slate-500">高风险任务全量筛查</div></div>
        <div><div class="text-2xl font-bold text-brand-600">≥10年</div><div class="text-slate-500">凭证包可审计留存</div></div>
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
</section>

<section id="pain" class="max-w-7xl mx-auto px-6 py-20">
  <h2 class="text-3xl font-bold text-center">灵活用工正在从"洼地套利"进入"数据化监管"时代</h2>
  <p class="text-center text-slate-500 mt-3">金税四期 + 涉税信息报送 + 增值税法实施：红利属于合规者，而非通道商</p>
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

<section id="solutions" class="bg-slate-50 py-20">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-center">四大核心模块 · 前后台一体</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
      ${[['fa-desktop', 'PC端合规申报', '工资薪金扣缴、劳务报酬累计预扣、增值税代办、涉税信息报送——规则引擎计算、双人复核、一键申报、回执归档。', '/admin'],
        ['fa-landmark', '合理征税与委托代征', '按月合并销售额适用10万元起征点、3%减按1%、不拆分；代征→解缴→出具完税凭证全链路可追溯。', '/admin'],
        ['fa-building-user', '企业全量薪酬管理', '核心层（劳动合同）/弹性层（非全日制·外包）/任务层（平台灵工）三层结构，一套系统算清全部用工成本与税负。', '/enterprise'],
        ['fa-rocket', 'OPC薪酬与经营舱', '股东工资+分红最优配比、小微5%税负、三阶跃迁测算、四道防火墙监测，让超级个体合法增收。', '/opc']].map(([i, t, d, h]) => `
      <a href="${h}" class="group rounded-2xl bg-white border border-slate-100 p-6 hover:border-brand-500 hover:shadow-xl transition block">
        <div class="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center text-xl"><i class="fas ${i}"></i></div>
        <h3 class="mt-5 font-bold">${t}</h3><p class="mt-2 text-sm text-slate-600 leading-relaxed">${d}</p>
        <div class="mt-4 text-sm text-brand-600 group-hover:translate-x-1 transition">进入系统 <i class="fas fa-arrow-right"></i></div>
      </a>`).join('')}
    </div>
  </div>
</section>

<section id="engine" class="max-w-7xl mx-auto px-6 py-20">
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

<section id="calc" class="bg-gradient-to-b from-slate-50 to-white py-20">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-center">免费税负测算器</h2>
    <p class="text-center text-slate-500 mt-3">规则引擎实时计算 · 预缴口径 · 结果附计算公式</p>
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
  </div>
</section>

<section id="opc" class="max-w-7xl mx-auto px-6 py-20">
  <h2 class="text-3xl font-bold text-center">OPC "三阶跃迁" 成长路径</h2>
  <p class="text-center text-slate-500 mt-3">AI让"一个人 + 一组Agent = 一家公司"成为现实</p>
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

<section id="policy" class="bg-slate-50 py-20">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-center">政策依据（只引文件，不引讲话）</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 text-sm">
      ${[['国务院令第810号', '互联网平台企业涉税信息报送规定', '2025-06'], ['税务总局公告2025年第15号', '涉税信息报送口径与流程', '2025-07'], ['税务总局公告2025年第16号', '劳务报酬累计预扣 · 增值税代办申报 · 税前扣除', '2025-10-01'], ['国务院令第826号', '增值税法及实施条例', '2026-01-01'], ['财政部 税务总局公告2026年第10号', '月10万元起征点延续至2027年底；按次1000元', '2026-01-30'], ['法释·劳动争议解释（二）', '混同用工连带责任；约定不缴社保无效', '2025-09-01'], ['财税2023年第12号', '小微企业5% · 个体户200万内减半', '至2027-12-31'], ['税务总局公告2018年第28号', '企业所得税税前扣除凭证管理办法', '2018-07-01'], ['税务总局公告2018年第61号', '个人所得税扣缴申报管理办法', '2019-01-01']].map(([n, t, d]) => `<div class="rounded-xl bg-white border border-slate-100 p-4"><div class="font-semibold text-brand-700">${n}</div><div class="text-slate-600 mt-1">${t}</div><div class="text-xs text-slate-400 mt-2"><i class="far fa-calendar mr-1"></i>${d}</div></div>`).join('')}
    </div>
  </div>
</section>

<section class="max-w-7xl mx-auto px-6 py-20">
  <div class="rounded-3xl bg-brand-600 text-white p-12 text-center">
    <h2 class="text-3xl font-bold">在确定性稀缺的时代，贩卖"确定性"</h2>
    <p class="mt-3 text-brand-100">合规不是成本，而是这门生意本身。</p>
    <a href="/login" class="inline-block mt-8 bg-white text-brand-700 px-8 py-3 rounded-xl font-semibold">立即体验 · 演示账号一键登录</a>
  </div>
</section>

<footer class="border-t border-slate-100 py-10 text-center text-xs text-slate-400">
  <p>云工智合佳 CloudWork Intel · AI合规用工操作系统 · 已按规定完成互联网平台企业基本信息报送，依据税务总局2025年第16号公告提供扣缴申报与代办申报服务</p>
  <p class="mt-2">本平台测算均为示意性模型，不构成法律、税务或投资意见；各地税务机关执行口径可能存在差异，请以主管税务机关意见及执业律师、注册税务师书面意见为准。</p>
</footer>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/landing.js"></script>
</body></html>`
}

export function loginPage() {
  const roles = [
    ['enterprise', 'fa-building-user', '我是企业 HR / 财务', '要给员工发工资、给兼职结算、拿合规凭证', 'hr_demo', 'Ent@2026', 'brand'],
    ['worker', 'fa-user', '我是灵活就业者', '想接任务、看到手收入、少缴冤枉税', 'worker_demo', 'Worker@2026', 'emerald'],
    ['opc', 'fa-rocket', '我是超级个体 / 一人公司', '要给自己发工资、算分红、看该不该注册公司', 'opc_demo', 'Opc@2026', 'violet'],
    ['admin', 'fa-building-shield', '我是平台合规运营', '要做扣缴申报、委托代征、风控复核', 'admin', 'Admin@2026', 'amber'],
  ]
  return `${HEAD('登录')}
<body class="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-600 p-6">
<main class="max-w-6xl mx-auto">
  <div class="text-center text-white pt-6 pb-8">
    <a href="/" class="inline-flex items-center gap-2 font-bold text-2xl"><span class="w-10 h-10 rounded-xl bg-white/20 grid place-items-center"><i class="fas fa-shield-halved"></i></span>云工智合佳</a>
    <h1 class="mt-4 text-3xl font-bold">您是哪一类用户？</h1>
    <p class="mt-2 text-brand-100">选择身份后一键进入，系统会按您的工作流程一步步引导</p>
    <a href="/guide" class="inline-block mt-3 text-sm text-white/80 underline hover:text-white"><i class="fas fa-route mr-1"></i>先看看整个平台怎么运转（1分钟）</a>
  </div>
  <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4" id="role-cards">
    ${roles.map(([k, i, t, d, u, p, c]) => `<button data-role="${k}" data-u="${u}" data-p="${p}" class="role-card text-left bg-white rounded-2xl p-6 hover:-translate-y-1 hover:shadow-2xl transition border-4 border-transparent">
      <div class="w-12 h-12 rounded-xl bg-${c}-100 text-${c}-600 grid place-items-center text-xl"><i class="fas ${i}"></i></div>
      <div class="mt-4 font-bold text-lg">${t}</div><div class="text-sm text-slate-500 mt-1 leading-relaxed">${d}</div>
      <div class="mt-4 text-sm font-medium text-${c}-600">一键体验 <i class="fas fa-arrow-right ml-1"></i></div></button>`).join('')}
  </div>
  <div class="mt-8 max-w-md mx-auto bg-white rounded-2xl p-6">
    <div class="text-sm font-semibold text-slate-700 mb-3"><i class="fas fa-key mr-1 text-slate-400"></i>已有账号？直接登录</div>
    <form id="login-form" class="space-y-3">
      <input id="username" class="w-full border rounded-lg px-3 py-2.5" placeholder="账号" autocomplete="username">
      <input id="password" type="password" class="w-full border rounded-lg px-3 py-2.5" placeholder="密码" autocomplete="current-password">
      <div id="login-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"></div>
      <button class="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2.5 font-medium">登录</button>
    </form>
  </div>
  <p class="text-center text-xs text-white/60 mt-6">演示账号：hr_demo / Ent@2026 · worker_demo / Worker@2026 · opc_demo / Opc@2026 · admin / Admin@2026</p>
</main>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script>
const home={admin:'/admin',enterprise:'/enterprise',opc:'/opc',worker:'/worker'};
async function doLogin(u,p){const err=document.getElementById('login-error');err.classList.add('hidden');
try{const r=await axios.post('/api/auth/login',{username:u,password:p});localStorage.setItem('cw_token',r.data.token);localStorage.setItem('cw_user',JSON.stringify(r.data.user));
const next=new URLSearchParams(location.search).get('next');location.href=next||home[r.data.user.role]}catch(ex){err.textContent=ex.response?.data?.error||'登录失败';err.classList.remove('hidden')}}
document.querySelectorAll('.role-card').forEach(b=>b.onclick=()=>{b.classList.add('border-brand-500');b.querySelector('.fa-arrow-right').className='fas fa-spinner fa-spin ml-1';doLogin(b.dataset.u,b.dataset.p)});
document.getElementById('login-form').onsubmit=e=>{e.preventDefault();doLogin(username.value.trim(),password.value)};
</script>
</body></html>`
}

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
  return `${HEAD('平台运转流程')}
<body class="bg-slate-50 text-ink">
<header class="bg-white border-b"><nav class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between"><a href="/" class="flex items-center gap-2 font-bold"><span class="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center"><i class="fas fa-shield-halved"></i></span>云工智合佳</a><a href="/login" class="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg">选择身份进入</a></nav></header>
<main class="max-w-6xl mx-auto px-6 py-12">
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
</main>
<footer class="py-8 text-center text-xs text-slate-400">测算为示意口径，以主管税务机关意见为准</footer>
</body></html>`
}

const NAVS: Record<string, Array<[string, string, string]>> = {
  admin: [['dashboard', 'fa-gauge-high', '平台总览'], ['filings', 'fa-file-signature', '合规申报中心'], ['collection', 'fa-landmark', '委托代征'], ['risk', 'fa-shield-halved', '风控中心'], ['enterprises', 'fa-building', '企业管理'], ['workers', 'fa-users', '从业人员'], ['opcs', 'fa-rocket', 'OPC管理'], ['policies', 'fa-book', '政策法规库'], ['settings', 'fa-sliders', '规则参数'], ['logs', 'fa-clock-rotate-left', '审计日志']],
  enterprise: [['dashboard', 'fa-gauge-high', '用工驾驶舱'], ['employees', 'fa-sitemap', '三层用工结构'], ['payroll', 'fa-money-check-dollar', '薪酬管理'], ['tasks', 'fa-list-check', '任务与交付'], ['settlements', 'fa-file-shield', '结算与凭证包'], ['compare', 'fa-scale-balanced', '成本对比'], ['logs', 'fa-clock-rotate-left', '操作日志']],
  opc: [['dashboard', 'fa-gauge-high', '经营舱'], ['income', 'fa-sack-dollar', '收入与成本'], ['payroll', 'fa-wallet', 'OPC薪酬'], ['tax', 'fa-receipt', '税务测算'], ['growth', 'fa-stairs', '三阶跃迁'], ['cabin', 'fa-box-open', '一站式服务']],
  worker: [['home', 'fa-house', '我的首页'], ['hall', 'fa-store', '任务大厅'], ['orders', 'fa-list-check', '我的任务'], ['income', 'fa-wallet', '收入与凭证'], ['tax', 'fa-receipt', '我的税负'], ['growth', 'fa-stairs', '成长路径']],
}
const TITLES: Record<string, string> = { admin: '平台合规后台', enterprise: '企业用工管理', opc: 'OPC 一站式经营舱', worker: '灵活就业者工作台' }

export function appShell(role: 'admin' | 'enterprise' | 'opc' | 'worker', user: any) {
  const nav = NAVS[role]
  return `${HEAD(TITLES[role])}
<body class="bg-slate-50 text-ink">
<div class="flex min-h-screen">
  <aside class="w-60 shrink-0 bg-ink text-slate-300 flex flex-col">
    <a href="/" class="h-16 flex items-center gap-2 px-5 font-bold text-white border-b border-white/10"><span class="w-8 h-8 rounded-lg bg-brand-600 grid place-items-center"><i class="fas fa-shield-halved"></i></span>云工智合佳</a>
    <div class="px-5 py-3 text-xs text-slate-500 uppercase tracking-wider">${TITLES[role]}</div>
    <nav id="side-nav" class="flex-1 px-3 space-y-1">
      ${nav.map(([k, i, n]) => `<a href="#${k}" data-view="${k}" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10"><i class="fas ${i} w-4"></i>${n}</a>`).join('')}
    </nav>
    <div class="p-4 border-t border-white/10 text-xs">
      <div class="text-white font-medium">${user.display_name}</div>
      <div class="text-slate-500 mt-0.5">${user.username} · ${role}</div>
      ${role !== 'admin' ? '' : '<div class="mt-2 flex gap-2"><a href="/enterprise" class="text-brand-300 hover:underline">企业端</a><a href="/opc" class="text-brand-300 hover:underline">OPC端</a></div>'}
      <button id="logout-btn" class="mt-3 w-full border border-white/20 rounded-lg py-1.5 hover:bg-white/10"><i class="fas fa-right-from-bracket mr-1"></i>退出登录</button>
    </div>
  </aside>
  <div class="flex-1 min-w-0 flex flex-col">
    <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div class="flex items-center gap-3"><h1 id="page-title" class="font-bold text-lg"></h1><button id="help-btn" class="text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg"><i class="fas fa-circle-question mr-1"></i>这页怎么用</button></div>
      <div class="flex items-center gap-3 text-sm">
        <label class="text-slate-500">期间</label>
        <input id="global-period" type="month" class="border rounded-lg px-2 py-1.5" value="${new Date().toISOString().slice(0, 7)}">
        <button id="todo-btn" class="relative border rounded-lg px-3 py-1.5 hover:bg-slate-50"><i class="fas fa-bell mr-1"></i>待办<span id="todo-count" class="hidden absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 grid place-items-center">0</span></button>
        <button id="tour-btn" class="border rounded-lg px-3 py-1.5 hover:bg-slate-50 text-slate-600"><i class="fas fa-graduation-cap mr-1"></i>新手引导</button>
      </div>
    </header>
    <div id="flow-bar" class="bg-white border-b border-slate-200 px-6 py-3 hidden"></div>
    <main id="view" class="flex-1 p-6"></main>
    <footer class="px-6 py-3 text-xs text-slate-400 border-t border-slate-200">AI辅助生成内容均经规则引擎校验并保留人工复核节点 · 测算为示意口径，以主管税务机关意见为准</footer>
  </div>
</div>
<div id="modal-root"></div>
<div id="todo-drawer" class="fixed inset-y-0 right-0 w-96 max-w-full bg-white shadow-2xl z-40 translate-x-full transition-transform flex flex-col"><div class="h-16 border-b flex items-center justify-between px-5"><div class="font-bold"><i class="fas fa-bell text-brand-600 mr-2"></i>本期待办 · 下一步做什么</div><button id="todo-close" class="text-slate-400"><i class="fas fa-xmark"></i></button></div><div id="todo-list" class="flex-1 overflow-auto p-4 space-y-3"></div></div>
<div id="toast-root" class="fixed top-4 right-4 z-50 space-y-2"></div>
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>window.__ROLE__='${role}';window.__USER__=${JSON.stringify(user)};</script>
<script src="/static/common.js"></script>
<script src="/static/${role}.js"></script>
</body></html>`
}
