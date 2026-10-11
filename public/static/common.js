/* 云工智合佳 · 前端公共库 */
const token = localStorage.getItem('cw_token');
const api = axios.create({ baseURL: '/api', headers: token ? { Authorization: 'Bearer ' + token } : {} });
api.interceptors.response.use(r => r, e => {
  if (e.response && e.response.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); }
  return Promise.reject(e);
});
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n, d = 2) => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = n => '¥' + fmt(n);
const pct = n => fmt(n, 1) + '%';
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const period = () => $('#global-period').value;
const errMsg = e => e.response?.data?.error || e.message || '操作失败';

function toast(msg, type = 'success') {
  const c = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-brand-600', warn: 'bg-amber-500' }[type];
  const el = document.createElement('div');
  el.className = `${c} text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-sm animate-[fadein_.2s]`;
  el.innerHTML = msg; $('#toast-root').appendChild(el); setTimeout(() => el.remove(), 3500);
}
function modal(title, body, opts = {}) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" id="modal-bg">
    <div class="bg-white rounded-2xl shadow-2xl w-full ${opts.wide ? 'max-w-5xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b"><h3 class="font-bold">${title}</h3><button id="modal-close" class="text-slate-400 hover:text-slate-700"><i class="fas fa-xmark"></i></button></div>
      <div class="p-6 overflow-auto">${body}</div>
      ${opts.footer ? `<div class="px-6 py-4 border-t flex justify-end gap-2">${opts.footer}</div>` : ''}
    </div></div>`;
  $('#modal-close').onclick = closeModal;
  $('#modal-bg').onclick = e => { if (e.target.id === 'modal-bg') closeModal(); };
}
const closeModal = () => $('#modal-root').innerHTML = '';
const badge = (level, text) => { const m = { green: 'bg-emerald-100 text-emerald-700', yellow: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700', gray: 'bg-slate-100 text-slate-600' }; return `<span class="inline-block text-xs px-2 py-0.5 rounded-full ${m[level] || m.gray}">${text ?? level}</span>`; };
const STATUS = { draft: ['gray', '草稿'], calculated: ['blue', '已试算'], approved: ['yellow', '已审批'], paid: ['green', '已发放'], reviewed: ['yellow', '已复核'], submitted: ['blue', '已提交'], accepted: ['green', '已受理'], corrected: ['red', '已更正'], pending: ['gray', '待处理'], filed: ['green', '已申报'], published: ['green', '已发布'], blocked: ['red', '已拦截'], review: ['yellow', '待复核'], closed: ['gray', '已关闭'], signed: ['blue', '已签约'], delivered: ['yellow', '已交付'], settled: ['green', '已结算'], rejected: ['red', '已驳回'], active: ['green', '有效'], inactive: ['gray', '停用'], collected: ['blue', '已代征'], remitted: ['yellow', '已解缴'], certified: ['green', '已出凭证'] };
const sbadge = s => { const [l, t] = STATUS[s] || ['gray', s]; return badge(l, t); };
const card = (title, body, extra = '') => `<section class="bg-white rounded-2xl border border-slate-200 p-5">${title ? `<div class="flex items-center justify-between mb-4"><h2 class="font-bold">${title}</h2><div>${extra}</div></div>` : ''}${body}</section>`;
const stat = (label, value, sub = '', icon = 'fa-chart-line', color = 'brand') => `<div class="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4"><div class="w-11 h-11 rounded-xl bg-${color}-50 text-${color}-600 grid place-items-center text-lg"><i class="fas ${icon}"></i></div><div><div class="text-xs text-slate-500">${label}</div><div class="text-2xl font-bold mt-0.5">${value}</div>${sub ? `<div class="text-xs text-slate-400 mt-0.5">${sub}</div>` : ''}</div></div>`;
const table = (cols, rows, empty = '暂无数据') => `<div class="overflow-auto"><table class="w-full text-sm"><thead><tr class="text-left text-xs text-slate-500 border-b">${cols.map(c => `<th class="py-2 pr-3 font-medium whitespace-nowrap">${c}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr class="border-b border-slate-100 hover:bg-slate-50">${r.map(x => `<td class="py-2 pr-3 align-top">${x ?? ''}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="py-8 text-center text-slate-400">${empty}</td></tr>`}</tbody></table></div>`;
const input = (id, label, val = '', type = 'text', attrs = '') => `<label class="block text-sm"><span class="text-slate-600">${label}</span><input id="${id}" type="${type}" value="${esc(val)}" ${attrs} class="mt-1 w-full border rounded-lg px-3 py-2"></label>`;
const select = (id, label, opts, val = '') => `<label class="block text-sm"><span class="text-slate-600">${label}</span><select id="${id}" class="mt-1 w-full border rounded-lg px-3 py-2">${opts.map(([v, t]) => `<option value="${v}" ${v == val ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
const btn = (text, cls = 'primary', attrs = '') => `<button ${attrs} class="text-sm px-3 py-1.5 rounded-lg ${{ primary: 'bg-brand-600 text-white hover:bg-brand-700', ghost: 'border hover:bg-slate-50', danger: 'bg-red-600 text-white hover:bg-red-700', success: 'bg-emerald-600 text-white hover:bg-emerald-700' }[cls]}">${text}</button>`;
const v = id => $('#' + id)?.value;
const num = id => +($('#' + id)?.value || 0);

let _charts = {};
function chart(id, cfg) { if (_charts[id]) _charts[id].destroy(); const el = $('#' + id); if (!el) return; _charts[id] = new Chart(el, cfg); }

// 路由
const VIEWS = {};
const DEFAULT_VIEW = window.__ROLE__ === 'worker' ? 'home' : 'dashboard';
function route() {
  const key = (location.hash || '#' + DEFAULT_VIEW).slice(1).split('?')[0];
  $$('.nav-item').forEach(a => a.classList.toggle('bg-brand-600', a.dataset.view === key));
  $$('.nav-item').forEach(a => a.classList.toggle('text-white', a.dataset.view === key));
  const nav = $(`.nav-item[data-view="${key}"]`);
  $('#page-title').textContent = nav ? nav.textContent.trim() : '';
  const fn = VIEWS[key] || VIEWS[DEFAULT_VIEW];
  $('#view').innerHTML = '<div class="text-slate-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>加载中…</div>';
  Promise.resolve(fn()).catch(e => { $('#view').innerHTML = `<div class="bg-red-50 text-red-700 rounded-xl p-4 text-sm">${esc(errMsg(e))}</div>`; });
}
window.addEventListener('hashchange', route);
$('#global-period').addEventListener('change', route);
$('#logout-btn').onclick = async () => { await api.post('/auth/logout'); localStorage.removeItem('cw_token'); location.href = '/login'; };
document.addEventListener('DOMContentLoaded', route);

// 风险评分可视化
function riskPanel(r) {
  const color = { green: 'emerald', yellow: 'amber', red: 'red' }[r.level];
  return `<div class="rounded-xl border p-4 bg-${color}-50 border-${color}-200">
    <div class="flex items-center justify-between"><div><div class="text-xs text-${color}-700">劳动关系风险评分</div><div class="text-3xl font-extrabold text-${color}-600">${r.score}<span class="text-sm font-normal">/100</span></div></div><div class="text-right"><div class="font-bold text-${color}-700">${{ green: '绿 · 自动放行', yellow: '黄 · 人工复核', red: '红 · 禁止发布' }[r.level]}</div><div class="text-xs text-${color}-600">${r.decision}</div></div></div>
    <div class="mt-3 space-y-2">${r.factors.map(f => `<div><div class="flex justify-between text-xs"><span>${f.dimension}（${f.weight}%）<span class="text-slate-500 ml-2">${esc(f.signal)}</span></span><span class="font-medium">${f.score}</span></div><div class="h-1.5 bg-white rounded-full"><div class="h-1.5 rounded-full bg-${color}-500" style="width:${f.score / f.weight * 100}%"></div></div></div>`).join('')}</div>
    <div class="mt-3 text-xs text-slate-700">${esc(r.advice)}</div>
    <div class="mt-2 text-[11px] text-slate-500">依据：${esc(r.basis)}<br>${esc(r.aiNote)}</div></div>`;
}

/* ================= 流程引导层：流程条 · 待办 · 页面帮助 · 新手引导 ================= */
const HELP = {
  enterprise: {
    dashboard: ['用工驾驶舱', '一眼看清本期用工成本、三层结构是否健康、任务与结算进度。', ['看「用工结构体检」分数与提示', '看「本期待办」知道下一步', '点快捷操作直达对应页面']],
    employees: ['三层用工结构', '把人分成三层：核心层签劳动合同、弹性层非全日制/外包、任务层走平台灵活用工。每层税务路径不同。', ['点「新增人员」录入', '选对层级和用工形态（决定怎么算税）', '任务层人员由签约自动带入，无需手录']],
    payroll: ['薪酬管理', '每月做一次：试算 → 生成批次 → 审批 → 发放。发放后系统自动生成申报草稿与凭证包。', ['先点某一层的「试算」看结果', '确认无误点「生成批次」', '审批 → 发放并生成申报', '点「明细」可看每人公式与工资条']],
    tasks: ['任务与交付', '任务必须按成果计价。发布前 AI 自动评分：绿放行、黄待复核、红拦截。', ['点「发布任务」填写并先「AI预评估」', '有从业人员申请时在「接单申请」里确认签约', '从业人员交付后点「验收通过」', '验收通过的金额才会进入任务层薪酬']],
    settlements: ['结算与凭证包', '每笔结算自动生成五流合一凭证包（合同·业务·资金·票据·个税），这是税前扣除的依据。', ['点「五流合一」查看凭证', '点「导出审计包」留档（≥10年）']],
    compare: ['成本对比', '对比直接支付 / 传统灵工 / 本平台三种方案的净成本与风险。', ['输入月发放额与纳税人身份', '重点看「风险」列而不只是金额']],
    logs: ['操作日志', '所有操作与 AI 决策都有留痕，可供审计。', []],
  },
  admin: {
    dashboard: ['平台总览', '平台运营全局：企业、人员、GMV、待办申报、待复核任务。', ['先处理右上角「待办」清单', '关注黄/红任务复核']],
    filings: ['合规申报中心', '每月15日前要完成的事。企业发放薪酬后草稿自动出现在这里。', ['草稿 → 点「复核」（系统重算校验）', '复核通过 → 点「提交申报」拿回执', '涉税信息报送 / 代征汇总需手动「生成草稿」', '点「查看」可导出申报表']],
    collection: ['委托代征', '从业人员的增值税及附加由平台代征 → 解缴 → 出具完税凭证。', ['查看协议与代征明细', '提交增值税代办申报后自动变为「已解缴」', '点「出具代征凭证」完成闭环']],
    risk: ['风控中心', '所有任务的 AI 评分记录 + 实时异常监测。黄色任务必须人工复核。', ['点「因子」看评分依据', '对黄色任务「放行」或「拦截」并填写说明', '用「AI评分沙盒」测试任务描述']],
    enterprises: ['企业管理', '企业入驻尽调、费率与风险等级设置、开通企业账号。', ['点「企业入驻」填写并创建登录账号', '可直接「进入企业端」代为操作']],
    workers: ['从业人员', '实名核验是签约与结算的前提（16号公告强制）。', ['未核验人员点「发起核验」', '查看本年收入与 OPC 关联']],
    opcs: ['OPC 管理', '平台内的个体户与一人公司主体。', ['可「进入经营舱」查看']],
    policies: ['政策法规库', '规则引擎的依据，每条附文号与生效日期。', []],
    settings: ['规则参数', '起征点、费用扣除比例等参数化配置，政策变化时在此调整。', ['修改后点「保存」立即生效']],
    logs: ['审计日志', '全平台操作与 AI 决策留痕。', []],
  },
  opc: {
    dashboard: ['经营舱', '一人公司的财务仪表盘：收入成本趋势、客户集中度、四道防火墙、税务路径推荐。', ['关注「客户集中度」是否超70%', '看「税务路径推荐」']],
    income: ['收入与成本', '记录每笔收入（含开票）与成本（须有凭证）。', ['点「记一笔收入/成本」', '无凭证的成本不能税前列支']],
    payroll: ['OPC 薪酬', '一人公司给自己发钱的两种方式：工资（计入成本）和分红（20%）。系统帮你配比。', ['输入月工资与本期分红', '先「试算」看综合税负与提示', '「生成薪酬单」→「发放并生成申报」']],
    tax: ['税务测算', '本月增值税（10万起征点）与所得税，以及三阶路径对比。', ['看本月是否免征', '调整参数做三阶对比']],
    growth: ['三阶跃迁', '自然人 → 个体户 → 一人公司，什么时候升级最划算，前提是真实经营。', ['看 AI 推荐与前置条件自检']],
    cabin: ['一站式服务', '开业、记账、法务、接单、AI工具、保障。', ['点「咨询开通」']],
  },
  worker: {
    home: ['我的首页', '你的任务进度、本年收入与下一步要做的事。', ['未实名先点「立即实名」', '按「下一步」提示操作']],
    hall: ['任务大厅', '所有已发布的任务，按成果计价。', ['点「申请接单」', '企业确认后在「我的任务」里出现']],
    orders: ['我的任务', '已签约任务：交付 → 等待验收 → 等待发放。', ['对「已签约」任务点「提交交付」', '交付后等企业验收']],
    income: ['收入与凭证', '每笔结算的到手金额、预扣税款与凭证。', ['点「凭证」查看完税信息']],
    tax: ['我的税负', '按累计预扣法预估全年税负，并与传统劳务对比。', ['输入预期月收入', '关注年度汇算提示']],
    growth: ['成长路径', '收入增长后什么时候该升级为个体户 / 一人公司。', []],
  },
};
const FLOW_STEP_VIEW = { enterprise: { task: 'tasks', sign: 'tasks', deliver: 'tasks', pay: 'payroll', evidence: 'settlements' }, admin: { onboard: 'enterprises', file: 'filings', collect: 'collection', task: 'risk', sign: 'workers' }, worker: { sign: 'hall', deliver: 'orders', pay: 'income', evidence: 'income' } };

async function renderFlowBar() {
  if (!['enterprise', 'admin', 'worker'].includes(window.__ROLE__)) return;
  try {
    const { data } = await api.get('/guide/progress', { params: { period: period() } });
    const bar = $('#flow-bar'); bar.classList.remove('hidden');
    bar.innerHTML = `<div class="flex items-center gap-1 overflow-auto text-xs"><span class="text-slate-400 mr-2 whitespace-nowrap"><i class="fas fa-route mr-1"></i>主流程</span>${data.flow.map((s, i) => {
      const cur = i === data.current; const view = FLOW_STEP_VIEW[window.__ROLE__]?.[s.key];
      return `<a href="${view ? '#' + view : 'javascript:void(0)'}" title="${s.desc}（${{ admin: '平台', enterprise: '企业', worker: '从业人员' }[s.owner]}）" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap ${s.done ? 'bg-emerald-50 text-emerald-700' : cur ? 'bg-brand-600 text-white ring-2 ring-brand-200' : 'bg-slate-50 text-slate-400'} ${s.mine ? '' : 'opacity-70'}"><span class="w-4 h-4 rounded-full grid place-items-center text-[10px] ${s.done ? 'bg-emerald-500 text-white' : cur ? 'bg-white text-brand-700' : 'bg-slate-200'}">${s.done ? '✓' : i + 1}</span>${s.name}${s.mine ? '' : '<i class="fas fa-lock text-[9px] ml-0.5"></i>'}</a>${i < data.flow.length - 1 ? '<i class="fas fa-chevron-right text-slate-300 text-[9px]"></i>' : ''}`;
    }).join('')}</div>`;
  } catch (e) { }
}
async function loadTodos() {
  try {
    const { data } = await api.get('/guide/todos', { params: { period: period() } });
    const urgent = data.todos.filter(t => t.level !== 'green').length;
    const cnt = $('#todo-count'); cnt.textContent = urgent; cnt.classList.toggle('hidden', !urgent);
    $('#todo-list').innerHTML = data.todos.map(t => `<a href="#${t.view}" class="block rounded-xl border p-4 hover:border-brand-500 ${{ red: 'bg-red-50 border-red-200', yellow: 'bg-amber-50 border-amber-200', blue: 'bg-blue-50 border-blue-200', green: 'bg-emerald-50 border-emerald-200' }[t.level]}" onclick="closeTodos()"><div class="flex items-start gap-3"><span class="mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${{ red: 'bg-red-500', yellow: 'bg-amber-500', blue: 'bg-blue-500', green: 'bg-emerald-500' }[t.level]}"></span><div><div class="font-medium text-sm">${t.title}</div><div class="text-xs text-slate-600 mt-1">${t.desc}</div><div class="text-xs text-brand-600 mt-2">前往处理 <i class="fas fa-arrow-right"></i></div></div></div></a>`).join('');
    return data.todos;
  } catch (e) { return []; }
}
const openTodos = () => $('#todo-drawer').classList.remove('translate-x-full');
const closeTodos = () => $('#todo-drawer').classList.add('translate-x-full');
$('#todo-btn').onclick = openTodos; $('#todo-close').onclick = closeTodos;

function showHelp() {
  const key = (location.hash || '#' + DEFAULT_VIEW).slice(1).split('?')[0];
  const h = HELP[window.__ROLE__]?.[key]; if (!h) return;
  modal(`<i class="fas fa-circle-question text-brand-600 mr-2"></i>${h[0]} · 这页怎么用`, `<p class="text-slate-700">${h[1]}</p>${h[2].length ? `<div class="mt-4 text-sm font-semibold">操作步骤</div><ol class="mt-2 space-y-2">${h[2].map((x, i) => `<li class="flex gap-3 text-sm"><span class="w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs grid place-items-center font-bold shrink-0">${i + 1}</span>${x}</li>`).join('')}</ol>` : ''}`, { footer: btn('知道了', 'primary', 'onclick="closeModal()"') });
}
$('#help-btn').onclick = showHelp;

/** 新手引导（分步） */
const TOUR = {
  enterprise: [['欢迎使用企业用工管理', '这里帮您把"全职员工、兼职、外包、平台灵工"的薪酬与合规放在一个系统里。每月只需做一件事：发薪。其余申报、凭证自动流转。'], ['第1步 · 录入人员', '在「三层用工结构」把人分成核心层 / 弹性层 / 任务层。层级决定怎么算税。演示企业已预置10人。', 'employees'], ['第2步 · 发布任务（可选）', '需要兼职时在「任务与交付」发布按成果计价的任务。AI 会先打分，红色会被拦住——这是在保护您。', 'tasks'], ['第3步 · 验收交付', '从业人员交付后点「验收通过」，验收金额才会进入结算。这一步就是"真交付"证据。', 'tasks'], ['第4步 · 算薪发放', '在「薪酬管理」逐层试算 → 生成批次 → 审批 → 发放。任务层发放后平台自动代扣代缴并生成凭证包。', 'payroll'], ['第5步 · 拿凭证包', '在「结算与凭证包」查看五流合一凭证，这是您税前扣除的依据。', 'settlements'], ['随时找方向', '右上角「待办」告诉您下一步做什么；每页「这页怎么用」有操作说明；顶部流程条显示整体进度。']],
  admin: [['欢迎使用平台合规后台', '您是整条链路的"合规守门人"。每月按右上角「待办」逐项处理即可零遗漏。'], ['第1步 · 企业入驻与人员实名', '「企业管理」做尽调准入并开通账号；「从业人员」确保人人实名——未实名不可签约。', 'enterprises'], ['第2步 · 风控复核', '企业发布的黄色任务在「风控中心」等您复核；红色已自动拦截。您的决定会留痕。', 'risk'], ['第3步 · 申报复核与提交', '企业发薪后，申报草稿自动出现在「合规申报中心」。点复核（系统重算校验）→ 提交 → 拿回执。', 'filings'], ['第4步 · 代征解缴出凭证', '「委托代征」查看代征税款，解缴后出具完税凭证。', 'collection'], ['参数与政策', '「规则参数」可调起征点等；「政策法规库」是所有计算的依据。']],
  opc: [['欢迎来到 OPC 经营舱', '一人公司 / 个体户 / 超级个体的财税驾驶舱。'], ['第1步 · 记账', '在「收入与成本」记录每笔收入（含开票）和成本（须有凭证）。', 'income'], ['第2步 · 给自己发钱', '在「OPC 薪酬」试算"工资 + 分红"最优配比，生成薪酬单并发放。', 'payroll'], ['第3步 · 看税', '「税务测算」自动算本月增值税与所得税；「三阶跃迁」告诉您身份是否该升级。', 'tax'], ['四道防火墙', '经营舱实时监测财产独立、注册资本、客户集中度、发票成本——帮您避免被认定为"转换收入性质"。', 'dashboard']],
  worker: [['欢迎，灵活就业者', '在这里接任务、看收入、少缴冤枉税。您只需做三件事：实名、接单、交付。'], ['第1步 · 实名', '首页点「立即实名」，1分钟完成人脸活体与三要素核验，并签署代办申报授权。', 'home'], ['第2步 · 接单', '「任务大厅」挑按成果计价的任务，点「申请接单」，等企业确认。', 'hall'], ['第3步 · 交付', '「我的任务」里对已签约任务提交交付，系统自动存证。企业验收后进入结算。', 'orders'], ['收入与税', '「收入与凭证」看每笔到手；「我的税负」看累计预扣法帮您省了多少。', 'income']],
};
function startTour(i = 0) {
  const t = TOUR[window.__ROLE__]; if (!t) return;
  const [title, text, view] = t[i];
  if (view) location.hash = view;
  modal(`<span class="text-xs text-slate-400 mr-2">${i + 1}/${t.length}</span>${title}`, `<p class="text-slate-700 leading-relaxed">${text}</p>`, { footer: (i > 0 ? btn('上一步', 'ghost', `onclick="startTour(${i - 1})"`) : '') + (i < t.length - 1 ? btn('下一步', 'primary', `onclick="startTour(${i + 1})"`) : btn('开始使用', 'success', 'onclick="finishTour()"')) + btn('跳过', 'ghost', 'onclick="finishTour()"') });
}
async function finishTour() { closeModal(); try { await api.post('/auth/onboarded'); } catch (e) { } localStorage.setItem('cw_tour_' + window.__ROLE__, '1'); }
$('#tour-btn').onclick = () => startTour(0);

// 覆盖路由：每次切页刷新流程条与待办
const _route = route;
route = function () { _route(); renderFlowBar(); loadTodos(); };
window.removeEventListener('hashchange', _route); window.addEventListener('hashchange', route);
$('#global-period').removeEventListener('change', _route); $('#global-period').addEventListener('change', route);
document.removeEventListener('DOMContentLoaded', _route);
document.addEventListener('DOMContentLoaded', () => { route(); if (!window.__USER__.onboarded && !localStorage.getItem('cw_tour_' + window.__ROLE__)) setTimeout(() => startTour(0), 600); });
