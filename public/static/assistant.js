/* 云工智合佳 · 右下角 AI 助手「小合」
 * 工作台 + 营销页通用。知道当前页面/待办，回答带动作按钮：跳页 / 启动教练 / 打开 Agent / 站内链接 / 界面漫游
 */
(function () {
  const ROLE = window.__ROLE__ || 'guest';
  const isApp = ROLE !== 'guest';
  const token = localStorage.getItem('cw_token') || '';
  const hdr = () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const history = []; // {role, content}
  let busy = false, opened = false;

  /* ---------- DOM ---------- */
  const btn = document.createElement('button');
  btn.id = 'cw-assistant-btn'; btn.title = 'AI 助手 · 小合';
  btn.innerHTML = '<i class="fas fa-comment-dots"></i><span class="dot"></span>';
  const box = document.createElement('div');
  box.id = 'cw-assistant';
  box.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white">
      <div class="flex items-center gap-2"><span class="w-8 h-8 rounded-full bg-white/20 grid place-items-center"><i class="fas fa-robot"></i></span><div><div class="font-bold text-sm">小合 · 平台 AI 助手</div><div class="text-[11px] text-white/80" id="cw-status">问我"该先做什么"，我带你点</div></div></div>
      <div class="flex items-center gap-1"><button id="cw-reset" class="w-8 h-8 rounded-lg hover:bg-white/15" title="新对话"><i class="fas fa-rotate-left"></i></button><button id="cw-close" class="w-8 h-8 rounded-lg hover:bg-white/15"><i class="fas fa-xmark"></i></button></div>
    </div>
    <div id="cw-msgs"></div>
    <div id="cw-chips" class="flex gap-2 overflow-auto px-3 py-2 border-t bg-white"></div>
    <form id="cw-form" class="flex items-center gap-2 px-3 py-2 border-t bg-white">
      <input id="cw-input" class="flex-1 border rounded-xl px-3 py-2 text-sm" placeholder="输入问题，如：怎么发工资？" autocomplete="off">
      <button class="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center hover:bg-brand-700" id="cw-send"><i class="fas fa-paper-plane"></i></button>
    </form>`;
  document.body.appendChild(btn); document.body.appendChild(box);
  const $ = s => box.querySelector(s);
  const msgs = $('#cw-msgs');

  /* ---------- 渲染 ---------- */
  const mdLite = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^\| (.*) \|$/gm, (m, r) => '<tr>' + r.split(' | ').map(x => `<td>${x}</td>`).join('') + '</tr>')
    .replace(/(<tr>.*<\/tr>\n?)+/g, m => `<table>${m}</table>`)
    .replace(/^(\d+)\. (.*)$/gm, '<div class="flex gap-2"><span class="text-brand-600 font-semibold">$1.</span><span>$2</span></div>')
    .replace(/^- (.*)$/gm, '<div class="ml-3">• $1</div>')
    .replace(/\n/g, '<br>');
  // 动作标签 → 按钮
  function renderActions(text) {
    const acts = [];
    const body = text.replace(/\[\[(go|coach|agent|link):([^\]|]+)\|([^\]]+)\]\]|\[\[tour\|([^\]]+)\]\]/g, (m, type, arg, label, tourLabel) => {
      if (tourLabel) { acts.push({ type: 'tour', label: tourLabel }); return ''; }
      acts.push({ type, arg: arg.trim(), label }); return '';
    }).trim();
    return { body, acts };
  }
  function actBtn(a) {
    const icon = { go: 'fa-arrow-right', coach: 'fa-hand-pointer', agent: 'fa-robot', link: 'fa-link', tour: 'fa-map' }[a.type];
    return `<button class="cw-act" data-type="${a.type}" data-arg="${esc(a.arg || '')}"><i class="fas ${icon}"></i>${esc(a.label)}</button>`;
  }
  function addMsg(role, content, opts = {}) {
    const el = document.createElement('div');
    el.className = 'cw-m ' + (role === 'user' ? 'user' : 'bot');
    if (role === 'user') el.textContent = content;
    else {
      const { body, acts } = renderActions(content);
      el.innerHTML = `<div class="cw-body">${mdLite(body)}</div>${acts.length ? `<div class="cw-acts">${acts.map(actBtn).join('')}</div>` : ''}${opts.meta ? `<div class="text-[10px] text-slate-400 mt-1">${opts.meta}</div>` : ''}`;
      el.querySelectorAll('.cw-act').forEach(b => b.onclick = () => doAction(b.dataset.type, b.dataset.arg));
    }
    msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight; return el;
  }
  function typing() { const el = document.createElement('div'); el.className = 'cw-m bot cw-typing'; el.innerHTML = '<span></span><span></span><span></span>'; msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight; return el; }

  /* ---------- 动作执行 ---------- */
  function doAction(type, arg) {
    if (type === 'link') { location.href = arg; return; }
    if (!isApp) { location.href = '/login'; return; }
    if (type === 'go') { location.hash = arg; flash(`已切换到「${navName(arg)}」`); return; }
    if (type === 'tour') { close(); window.CWTour && CWTour.startLayoutTour(); return; }
    if (type === 'coach') { close(); if (window.CWTour && !CWTour.startPlaybook(arg)) { location.hash = arg; } return; }
    if (type === 'agent') { close(); if (window.openAgent) { location.hash = ROLE === 'worker' ? 'ai' : 'ai'; setTimeout(() => openAgent(arg, {}), 400); } }
  }
  const navName = v => (document.querySelector(`.nav-item[data-view="${v}"]`)?.textContent || v).trim();
  function flash(t) { $('#cw-status').textContent = t; setTimeout(() => $('#cw-status').textContent = '问我"该先做什么"，我带你点', 2500); }

  /* ---------- 上下文 ---------- */
  async function ctx() {
    if (!isApp) return { page: window.__PAGE__ || location.pathname };
    const view = (location.hash || '#' + (window.DEFAULT_VIEW || 'dashboard')).slice(1).split('?')[0];
    let todos = [], flow = '';
    try {
      const p = document.getElementById('global-period')?.value;
      const [t, f] = await Promise.all([axios.get('/api/guide/todos', { params: { period: p }, headers: hdr() }), axios.get('/api/guide/progress', { params: { period: p }, headers: hdr() })]);
      todos = t.data.todos || [];
      flow = f.data.flow.map((s, i) => `${i + 1}.${s.name}${s.done ? '✓' : i === f.data.current ? '(当前)' : ''}`).join(' ');
    } catch (e) { }
    return { view, todos, flow };
  }

  /* ---------- 发送 ---------- */
  async function send(q) {
    if (!q || busy) return; busy = true;
    $('#cw-chips').innerHTML = '';
    addMsg('user', q); history.push({ role: 'user', content: q });
    const tp = typing();
    let text = '', el = null, meta = null;
    try {
      const res = await fetch('/api/assistant/chat', { method: 'POST', headers: hdr(), body: JSON.stringify({ messages: history.slice(-10), ctx: await ctx() }) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n'); buf = parts.pop();
        for (const part of parts) {
          const ev = (part.match(/^event: (.*)$/m) || [])[1], data = (part.match(/^data: (.*)$/m) || [])[1];
          if (!ev || !data) continue;
          let j = {}; try { j = JSON.parse(data); } catch { }
          if (ev === 'meta') { meta = j; tp.remove(); el = addMsg('assistant', ''); }
          if (ev === 'delta') { text += j.d || ''; if (!el) { tp.remove(); el = addMsg('assistant', ''); } el.querySelector('.cw-body').innerHTML = mdLite(renderActions(text).body); msgs.scrollTop = msgs.scrollHeight; }
          if (ev === 'done' && j.final) { text = j.final; }
          if (ev === 'error') { text += (text ? '\n' : '') + '（出错了：' + (j.error || '未知') + '）'; }
        }
      }
    } catch (e) { tp.remove(); text = text || '网络开小差了，请稍后再试。'; }
    tp.remove();
    if (el) el.remove();
    addMsg('assistant', text, { meta: meta ? (meta.mode === 'live' ? `<i class="fas fa-bolt text-emerald-500"></i> ${meta.model}${meta.pool === 'domestic' ? ' · 境内池' : ''}` : '<i class="fas fa-book"></i> 平台知识库') : '' });
    history.push({ role: 'assistant', content: text });
    busy = false; loadChips();
  }

  async function loadChips() {
    try { const { data } = await axios.get('/api/assistant/suggest', { headers: hdr() }); $('#cw-chips').innerHTML = data.suggestions.map(s => `<button class="cw-chip">${esc(s)}</button>`).join(''); $('#cw-chips').querySelectorAll('.cw-chip').forEach(b => b.onclick = () => send(b.textContent)); } catch (e) { }
  }

  /* ---------- 开关 ---------- */
  function open(prefillQ) {
    box.classList.add('open'); btn.querySelector('.dot')?.remove();
    if (!opened) {
      opened = true;
      const hello = isApp
        ? `你好，${window.__USER__?.display_name || ''}！我是小合。我知道你现在在哪个页面、有哪些待办——直接问"我该先做什么"，或者点下面的快捷问题。\n[[tour|带我认识界面]]`
        : '你好！我是平台助手小合。这里是 AI 合规用工操作系统：企业发薪拿凭证、灵工接单增收、OPC 财税一体。想从哪里开始？\n[[link:/login|选择身份进入]] [[link:/guide|1 分钟看懂怎么运转]]';
      addMsg('assistant', hello); loadChips();
    }
    if (prefillQ) send(prefillQ); else setTimeout(() => $('#cw-input').focus(), 50);
  }
  function close() { box.classList.remove('open'); }
  btn.onclick = () => box.classList.contains('open') ? close() : open();
  $('#cw-close').onclick = close;
  $('#cw-reset').onclick = () => { history.length = 0; msgs.innerHTML = ''; opened = false; open(); };
  $('#cw-form').onsubmit = e => { e.preventDefault(); const q = $('#cw-input').value.trim(); $('#cw-input').value = ''; send(q); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });

  window.CWAssistant = { open, close, ask: send };
})();
