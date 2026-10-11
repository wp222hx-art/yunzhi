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
function route() {
  const key = (location.hash || '#dashboard').slice(1).split('?')[0];
  $$('.nav-item').forEach(a => a.classList.toggle('bg-brand-600', a.dataset.view === key));
  $$('.nav-item').forEach(a => a.classList.toggle('text-white', a.dataset.view === key));
  const nav = $(`.nav-item[data-view="${key}"]`);
  $('#page-title').textContent = nav ? nav.textContent.trim() : '';
  const fn = VIEWS[key] || VIEWS.dashboard;
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
