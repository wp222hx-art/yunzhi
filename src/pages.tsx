export const HEAD = (title: string) => `<!DOCTYPE html>
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

const NAVS: Record<string, Array<[string, string, string]>> = {
  admin: [['dashboard', 'fa-gauge-high', '平台总览'], ['filings', 'fa-file-signature', '合规申报中心'], ['collection', 'fa-landmark', '委托代征'], ['risk', 'fa-shield-halved', '风控中心'], ['gateway', 'fa-microchip', '算力网关'], ['aiops', 'fa-robot', 'AI 运营'], ['enterprises', 'fa-building', '企业管理'], ['workers', 'fa-users', '从业人员'], ['opcs', 'fa-rocket', 'OPC管理'], ['policies', 'fa-book', '政策法规库'], ['settings', 'fa-sliders', '规则参数'], ['logs', 'fa-clock-rotate-left', '审计日志']],
  enterprise: [['dashboard', 'fa-gauge-high', '用工驾驶舱'], ['employees', 'fa-sitemap', '三层用工结构'], ['payroll', 'fa-money-check-dollar', '薪酬管理'], ['tasks', 'fa-list-check', '任务与交付'], ['settlements', 'fa-file-shield', '结算与凭证包'], ['compare', 'fa-scale-balanced', '成本对比'], ['__ai', '', 'AI 赋能'], ['ai', 'fa-robot', 'AI 数字员工'], ['aistudio', 'fa-wand-magic-sparkles', 'AIGC 工坊'], ['reports', 'fa-file-lines', 'AI 报告'], ['compute', 'fa-microchip', '算力中心'], ['market', 'fa-store', 'AI 服务集市'], ['__mgmt', '', '管理'], ['reportcenter', 'fa-chart-pie', '经营报表'], ['settings', 'fa-gear', '企业设置'], ['logs', 'fa-clock-rotate-left', '操作日志']],
  opc: [['dashboard', 'fa-gauge-high', '经营舱'], ['income', 'fa-sack-dollar', '收入与成本'], ['payroll', 'fa-wallet', 'OPC薪酬'], ['tax', 'fa-receipt', '税务测算'], ['growth', 'fa-stairs', '三阶跃迁'], ['cabin', 'fa-box-open', '一站式服务'], ['__ai', '', 'AI 赋能'], ['ai', 'fa-robot', 'AI 数字员工'], ['aistudio', 'fa-wand-magic-sparkles', 'AIGC 工坊'], ['reports', 'fa-file-lines', 'AI 报告'], ['compute', 'fa-microchip', '算力中心'], ['market', 'fa-store', 'AI 服务集市']],
  worker: [['home', 'fa-house', '我的首页'], ['hall', 'fa-store', '任务大厅'], ['orders', 'fa-list-check', '我的任务'], ['income', 'fa-wallet', '收入与凭证'], ['tax', 'fa-receipt', '我的税负'], ['growth', 'fa-stairs', '成长路径'], ['__ai', '', 'AI 赋能'], ['ai', 'fa-robot', 'AI 助手'], ['market', 'fa-store', '技能与实训']],
}
const TITLES: Record<string, string> = { admin: '平台合规后台', enterprise: '企业用工管理', opc: 'OPC 一站式经营舱', worker: '灵活就业者工作台' }

export function appShell(role: 'admin' | 'enterprise' | 'opc' | 'worker', user: any) {
  const nav = NAVS[role]
  return `${HEAD(TITLES[role])}
<body class="bg-slate-50 text-ink">
<div class="flex min-h-screen">
  <aside id="sidebar" class="w-60 shrink-0 bg-ink text-slate-300 flex flex-col">
    <a href="/" class="h-16 flex items-center gap-2 px-5 font-bold text-white border-b border-white/10"><span class="w-8 h-8 rounded-lg bg-brand-600 grid place-items-center"><i class="fas fa-shield-halved"></i></span>云工智合佳</a>
    <div class="px-5 py-3 text-xs text-slate-500 uppercase tracking-wider">${TITLES[role]}</div>
    <nav id="side-nav" class="flex-1 px-3 space-y-1">
      ${nav.map(([k, i, n]) => k.startsWith('__') ? `<div class="pt-3 pb-1 px-3 text-[10px] text-slate-500 uppercase tracking-wider">${n}</div>` : `<a href="#${k}" data-view="${k}" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10"><i class="fas ${i} w-4"></i>${n}</a>`).join('')}
    </nav>
    <div class="p-4 border-t border-white/10 text-xs">
      <div class="text-white font-medium">${user.display_name}</div>
      <div class="text-slate-500 mt-0.5">${user.username} · ${role}</div>
      ${role !== 'admin' ? '' : '<div class="mt-2 flex gap-2"><a href="/enterprise" class="text-brand-300 hover:underline">企业端</a><a href="/opc" class="text-brand-300 hover:underline">OPC端</a></div>'}
      <button id="logout-btn" class="mt-3 w-full border border-white/20 rounded-lg py-1.5 hover:bg-white/10"><i class="fas fa-right-from-bracket mr-1"></i>退出登录</button>
    </div>
  </aside>
  <div class="flex-1 min-w-0 flex flex-col">
    <header id="topbar" class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div class="flex items-center gap-3"><h1 id="page-title" class="font-bold text-lg"></h1><button id="help-btn" class="text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg"><i class="fas fa-circle-question mr-1"></i>这页怎么用</button><button id="coach-btn" class="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg"><i class="fas fa-hand-pointer mr-1"></i>操作教练</button></div>
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
<script src="/static/ai.js"></script>
<script src="/static/tour.js"></script>
<script src="/static/assistant.js"></script>
</body></html>`
}
