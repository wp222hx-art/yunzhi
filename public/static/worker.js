/* 灵活就业者工作台：实名 → 接单 → 交付 → 收款 → 看税 → 成长 */
const WP = window.__ROLE__ === 'admin' ? { worker_id: new URLSearchParams(location.hash.split('?')[1] || '').get('wid') || 2 } : {};
const wapi = { get: (u, p = {}) => api.get('/worker' + u, { params: { ...WP, ...p } }), post: (u, b) => api.post('/worker' + u, b, { params: WP }) };
const PRICING_W = { piece: '按件/场次', project: '按项目', milestone: '里程碑', time: '按时间' };
const ORDER_STEP = { signed: ['已签约 · 待我交付', 'yellow', 1], delivered: ['已交付 · 等企业验收', 'blue', 2], accepted: ['已验收 · 等企业发放', 'blue', 3], settled: ['已到账', 'green', 4], rejected: ['被驳回', 'red', 0] };

VIEWS.home = async () => {
  const { data: d } = await wapi.get('/home');
  const me = d.me;
  const steps = [['实名核验', me.verified], ['接单签约', d.orders.length > 0], ['交付成果', d.orders.some(o => ['delivered', 'accepted', 'settled'].includes(o.status))], ['企业验收', d.orders.some(o => ['accepted', 'settled'].includes(o.status))], ['收到款项', d.ytd.n > 0]];
  const curStep = steps.findIndex(s => !s[1]);
  $('#view').innerHTML = `
  <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div><div class="text-emerald-100 text-sm">你好，${esc(me.name)}</div><div class="text-2xl font-bold mt-1">${me.verified ? '今天也要多接几单 💪' : '先完成实名，1分钟就好'}</div><div class="text-sm text-emerald-100 mt-1">${esc(me.skills || '')} · ${esc(me.region || '')}</div></div>
      <div class="flex gap-6 text-center"><div><div class="text-3xl font-bold">${money(d.ytd.net)}</div><div class="text-xs text-emerald-100">今年到手</div></div><div><div class="text-3xl font-bold">${money(d.ytd.tax)}</div><div class="text-xs text-emerald-100">已预扣个税</div></div><div><div class="text-3xl font-bold">${d.orders.length}</div><div class="text-xs text-emerald-100">累计任务</div></div></div>
    </div>
    <div class="mt-6 flex items-center gap-2 text-xs overflow-auto">${steps.map((s, i) => `<div class="flex items-center gap-2 whitespace-nowrap"><span class="w-6 h-6 rounded-full grid place-items-center font-bold ${s[1] ? 'bg-white text-emerald-700' : i === curStep ? 'bg-amber-400 text-amber-900 ring-4 ring-amber-300/40' : 'bg-white/20'}">${s[1] ? '✓' : i + 1}</span><span class="${s[1] || i === curStep ? '' : 'text-white/60'}">${s[0]}</span>${i < steps.length - 1 ? '<i class="fas fa-chevron-right text-white/40 mx-1"></i>' : ''}</div>`).join('')}</div>
  </div>
  <div class="grid lg:grid-cols-3 gap-4 mt-4">
    <div class="lg:col-span-2 space-y-4">
      ${card('<i class="fas fa-location-arrow text-brand-600 mr-2"></i>下一步做什么', `<div class="space-y-3">${d.todos.map(t => `<div class="flex items-center justify-between rounded-xl border p-4 ${t.urgent ? 'bg-red-50 border-red-200' : t.passive ? 'bg-slate-50' : 'bg-brand-50 border-brand-100'}"><div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full grid place-items-center text-sm font-bold ${t.urgent ? 'bg-red-500 text-white' : 'bg-brand-600 text-white'}">${t.step}</span><div class="font-medium">${esc(t.text)}</div></div>${t.action === 'verify' ? btn('<i class="fas fa-id-card mr-1"></i>立即实名', 'danger', 'id="do-verify"') : t.passive ? '<span class="text-xs text-slate-400"><i class="fas fa-hourglass-half mr-1"></i>等待对方</span>' : btn('去处理 <i class="fas fa-arrow-right ml-1"></i>', 'primary', `onclick="location.hash='${t.action}'"`)}</div>`).join('')}</div>`)}
      ${card('我的任务', d.orders.length ? table(['任务', '企业', '金额', '进度'], d.orders.slice(0, 5).map(o => [`<b>${esc(o.title)}</b>`, esc(o.enterprise), money(o.amount || o.unit_price * o.quantity), badge(ORDER_STEP[o.status][1], ORDER_STEP[o.status][0])])) : '<div class="text-sm text-slate-400">还没有任务，去任务大厅看看</div>', `<a href="#orders" class="text-sm text-brand-600">全部 <i class="fas fa-arrow-right"></i></a>`)}
    </div>
    <div class="space-y-4">
      ${card('我的身份', `<div class="space-y-2 text-sm">${[['实名核验', me.verified ? badge('green', '已通过') : badge('red', '未完成')], ['代办申报授权', me.authorized_filing ? badge('green', '已签署') : badge('red', '未签署')], ['身份证', `<span class="font-mono text-xs">${me.id_no}</span>`], ['收款账户', `<span class="font-mono text-xs">${esc(me.bank_account || '—')}</span>`]].map(([k, x]) => `<div class="flex justify-between"><span class="text-slate-500">${k}</span>${x}</div>`).join('')}</div>${me.verified ? '' : `<div class="mt-3">${btn('立即实名（1分钟）', 'danger', 'id="do-verify2" class="w-full"')}</div>`}`)}
      ${card('收入趋势', '<canvas id="w-trend" height="160"></canvas>')}
      ${card('成长提示', `<div class="text-sm text-slate-700"><i class="fas fa-lightbulb text-amber-500 mr-1"></i>${d.growthHint}</div><div class="text-xs text-slate-400 mt-2">年化收入 ${money(d.annualized)}</div><a href="#growth" class="text-sm text-brand-600 mt-2 inline-block">查看成长路径 <i class="fas fa-arrow-right"></i></a>`)}
    </div>
  </div>`;
  chart('w-trend', { type: 'bar', data: { labels: d.monthly.map(m => m.period), datasets: [{ label: '到手', data: d.monthly.map(m => m.net), backgroundColor: '#10b981' }, { label: '预扣税', data: d.monthly.map(m => m.tax), backgroundColor: '#f59e0b' }] }, options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true } } } });
  const verify = () => modal('实名核验与代办申报授权', `<div class="space-y-4 text-sm"><div class="rounded-xl bg-slate-50 p-4"><div class="font-semibold"><i class="fas fa-face-smile text-brand-600 mr-2"></i>第1步 · 人脸活体检测</div><div class="text-slate-500 mt-1">仅存储人脸特征值，不存原图（PIPL 第28/29条，单独同意）</div></div><div class="rounded-xl bg-slate-50 p-4"><div class="font-semibold"><i class="fas fa-id-card text-brand-600 mr-2"></i>第2步 · 公安/运营商三要素核验</div><div class="text-slate-500 mt-1">姓名 + 身份证 + 手机号一致性</div></div><div class="rounded-xl bg-slate-50 p-4"><div class="font-semibold"><i class="fas fa-file-signature text-brand-600 mr-2"></i>第3步 · 签署《代办申报授权书》</div><div class="text-slate-500 mt-1">授权平台依据税务总局2025年第16号公告，为您办理个税累计预扣申报与增值税代办申报</div></div><label class="flex items-start gap-2"><input type="checkbox" id="v-agree" class="mt-1"><span>我已阅读并单独同意《个人信息处理告知书》《人脸信息处理授权》《代办申报授权书》</span></label></div>`, { footer: btn('取消', 'ghost', 'onclick="closeModal()"') + btn('<i class="fas fa-check mr-1"></i>开始核验（演示即时通过）', 'primary', 'id="v-go"') });
  $('#do-verify') && ($('#do-verify').onclick = verify); $('#do-verify2') && ($('#do-verify2').onclick = verify);
  document.body.addEventListener('click', async e => { if (e.target.id === 'v-go' || e.target.closest('#v-go')) { if (!$('#v-agree').checked) return toast('请先勾选同意', 'warn'); await wapi.post('/verify', {}); toast('实名核验通过，授权书已签署，现在可以接单了'); closeModal(); route(); } }, { once: true });
};

VIEWS.hall = async () => {
  const { data: tasks } = await wapi.get('/hall');
  $('#view').innerHTML = `<p class="text-sm text-slate-500 mb-4"><i class="fas fa-circle-info mr-1"></i>这里的任务都按成果计价、经过平台风控放行。接单后收入按累计预扣法预扣个税，月销售额10万元以下免增值税。</p>
  <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">${tasks.map(t => `<article class="bg-white rounded-2xl border p-5 flex flex-col"><div class="flex items-start justify-between gap-2"><div class="font-bold">${esc(t.title)}</div>${badge('green', '风控 ' + t.risk_score)}</div><div class="text-xs text-slate-400 mt-1">${esc(t.enterprise)} · ${esc(t.category || '')}</div><p class="text-sm text-slate-600 mt-3 flex-1">${esc(t.description || '')}</p>
    <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><div class="bg-slate-50 rounded-lg p-2"><div class="text-slate-400">计价</div><div class="font-medium">${PRICING_W[t.pricing_mode]}</div></div><div class="bg-slate-50 rounded-lg p-2"><div class="text-slate-400">单价</div><div class="font-medium">${money(t.unit_price)}</div></div><div class="bg-slate-50 rounded-lg p-2"><div class="text-slate-400">总预算</div><div class="font-medium text-brand-700">${money(t.budget)}</div></div></div>
    <div class="mt-2 text-xs text-slate-500"><i class="fas fa-box mr-1"></i>交付：${esc(t.deliverable_spec || '—')}<br><i class="fas fa-check-double mr-1"></i>验收：${esc(t.acceptance_std || '—')}${t.deadline ? `<br><i class="far fa-calendar mr-1"></i>截止 ${t.deadline}` : ''}</div>
    <div class="mt-4">${t.my_order ? badge('green', '已签约 · 见我的任务') : t.my_application === 'pending' ? badge('yellow', '已申请 · 等企业确认') : t.my_application === 'rejected' ? badge('gray', '未通过') : btn('<i class="fas fa-hand mr-1"></i>申请接单', 'primary', `data-apply="${t.id}" class="w-full"`)}</div></article>`).join('')}</div>`;
  $$('[data-apply]').forEach(b => b.onclick = async () => { try { await wapi.post(`/hall/${b.dataset.apply}/apply`, { message: '我可以按时交付' }); toast('已申请，等企业确认后自动生成电子合同'); route(); } catch (e) { toast(errMsg(e), 'error'); } });
};

VIEWS.orders = async () => {
  const { data: d } = await wapi.get('/home');
  $('#view').innerHTML = card('我的任务（签约 → 交付 → 验收 → 到账）', d.orders.length ? `<div class="space-y-3">${d.orders.map(o => { const st = ORDER_STEP[o.status]; return `<div class="rounded-xl border p-4"><div class="flex items-center justify-between flex-wrap gap-2"><div><div class="font-bold">${esc(o.title)}</div><div class="text-xs text-slate-400">${esc(o.enterprise)} · 合同 <span class="font-mono">${o.contract_no}</span></div></div><div class="text-right"><div class="font-bold text-brand-700">${money(o.amount || o.unit_price * o.quantity)}</div>${badge(st[1], st[0])}</div></div>
    <div class="mt-3 flex items-center gap-1 text-xs">${['签约', '交付', '验收', '到账'].map((s, i) => `<span class="px-2 py-0.5 rounded ${i < st[2] ? 'bg-emerald-100 text-emerald-700' : i === st[2] ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}">${s}</span>${i < 3 ? '<i class="fas fa-chevron-right text-slate-300 text-[9px]"></i>' : ''}`).join('')}</div>
    ${o.deliverable_desc ? `<div class="mt-2 text-xs text-slate-500">交付：${esc(o.deliverable_desc)} · 存证 <span class="font-mono">${(o.deliverable_hash || '').slice(0, 12)}…</span></div>` : ''}
    ${o.status === 'signed' ? `<div class="mt-3">${btn('<i class="fas fa-upload mr-1"></i>提交交付', 'primary', `data-deliver="${o.id}" data-qty="${o.quantity}"`)}</div>` : ''}</div>`; }).join('')}</div>` : '<div class="text-sm text-slate-400">暂无任务，去任务大厅接单</div>');
  $$('[data-deliver]').forEach(b => b.onclick = () => { modal('提交交付', `${input('d-qty', '完成数量', b.dataset.qty, 'number')}<div class="mt-3"><label class="text-sm text-slate-600">交付说明 / 成果链接</label><textarea id="d-desc" rows="3" class="mt-1 w-full border rounded-lg px-3 py-2" placeholder="例如：成片已上传至网盘 https://... 共10条"></textarea></div><div class="mt-3 text-xs text-slate-500">提交后系统生成 SHA-256 存证哈希，作为"真交付"证据写入凭证包。</div>`, { footer: btn('取消', 'ghost', 'onclick="closeModal()"') + btn('确认交付', 'primary', 'id="d-go"') }); $('#d-go').onclick = async () => { try { const { data } = await wapi.post(`/orders/${b.dataset.deliver}/deliver`, { quantity_done: num('d-qty'), deliverable_desc: v('d-desc') }); toast(`交付成功，金额 ${money(data.amount)}，已存证`); closeModal(); route(); } catch (e) { toast(errMsg(e), 'error'); } }; });
};

VIEWS.income = async () => {
  const { data: rows } = await wapi.get('/income');
  $('#view').innerHTML = card('收入与凭证', table(['期间', '企业', '结算额', '预扣个税', '增值税+附加', '到手', '累计收入', '状态', '凭证'], rows.map(s => [s.period, esc(s.enterprise), money(s.amount), money(s.iit), money(s.vat + s.surcharge), `<b class="text-emerald-700">${money(s.net)}</b>`, money(s.cum_income), sbadge(s.status), btn('查看', 'ghost', `data-ev='${JSON.stringify(s.evidence || {})}' data-no="${s.settlement_no}"`)])) + `<div class="mt-3 text-xs text-slate-500">平台服务费由企业承担，不从您的收入中扣除。个税按累计预扣法预扣，次年3-6月年度汇算可能多退少补。</div>`);
  $$('[data-ev]').forEach(b => b.onclick = () => { const e = JSON.parse(b.dataset.ev); modal(`凭证 · ${b.dataset.no}`, `<div class="text-sm space-y-2">${Object.entries(e).map(([k, x]) => `<div class="flex justify-between border-b border-slate-100 py-1"><span class="text-slate-500">${{ contract: '合同', acceptance: '验收', settlement_no: '结算单', iit_record: '个税扣缴', vat_record: '增值税代办', generated_at: '生成时间', retention: '保存期限' }[k] || k}</span><span class="font-mono text-xs">${esc(x)}</span></div>`).join('')}</div>`, { footer: btn('关闭', 'ghost', 'onclick="closeModal()"') }); });
};

VIEWS.tax = async () => {
  const run = async () => {
    const { data: t } = await wapi.get('/tax', { monthly: num('t-monthly') || 8000 });
    $('#t-out').innerHTML = `<div class="grid md:grid-cols-4 gap-3">${stat('今年已累计收入', money(t.ytd.inc), `已预扣 ${money(t.ytd.tax)}`, 'fa-sack-dollar', 'emerald')}${stat('预计全年收入', money(t.annual_income), '', 'fa-calendar')}${stat('平台累计预扣 · 全年', money(t.annual_tax), '', 'fa-receipt', 'brand')}${stat('传统劳务按次预扣', money(t.legacy_tax), `少缴 ${money(t.legacy_tax - t.annual_tax)}`, 'fa-scale-unbalanced', 'amber')}</div>
    <div class="mt-4 grid lg:grid-cols-2 gap-4">${card('逐月预测', table(['月', '收入', '预扣个税', '传统方式', '增值税', '到手'], t.rows.map(r => [r.month, money(r.income), money(r.tax), `<span class="text-slate-400 line-through">${money(r.legacy)}</span>`, r.vat ? money(r.vat) : '免', `<b>${money(r.net)}</b>`])))}
    ${card('身份建议', `<div class="space-y-2">${t.compare.paths.map(p => `<div class="flex items-center justify-between rounded-lg border p-3 ${p.key === t.compare.recommend ? 'border-brand-500 bg-brand-50' : ''}"><span class="text-sm">${p.name}${p.key === t.compare.recommend ? ' <i class="fas fa-star text-amber-400"></i>' : ''}</span><span class="font-bold">${p.rate}%</span></div>`).join('')}</div><div class="mt-3 text-sm text-slate-600">${t.compare.reason}</div><div class="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-3"><i class="fas fa-circle-info mr-1"></i>${t.note}</div>`)}</div>`;
  };
  $('#view').innerHTML = `${card('我的税负测算', `<div class="flex items-end gap-3">${input('t-monthly', '预期月收入（元）', 8000, 'number')}${btn('测算', 'primary', 'id="t-run"')}</div>`)}<div id="t-out" class="mt-4"></div>`;
  $('#t-run').onclick = run; run();
};

VIEWS.growth = async () => {
  const { data: t } = await wapi.get('/tax', { monthly: 8000 });
  const c = t.compare;
  $('#view').innerHTML = card('三阶跃迁 · 收入涨了该怎么选身份', `<div class="grid md:grid-cols-3 gap-4">${[['L1 起步期', '平台从业人员', '< 20万/年', '劳务报酬累计预扣，月10万以下免增值税', '什么都不用做，继续接单'], ['L2 成长期', '个体工商户', '20万-60万/年', '经营所得5%-35%，200万内减半', '需要真实多客户经营，平台可代注册、代记账'], ['L3 公司化', '一人有限公司', '> 60万/年', '小微企业5% + 工资/分红，可开专票', '承接企业大项目、再投入设备算力时最优']].map(([s, i, inc, tax, act], idx) => `<div class="rounded-2xl border p-5 ${['L1', 'L2', 'L3R'][idx] === c.recommend || (idx === 2 && c.recommend === 'L3D') ? 'border-brand-500 bg-brand-50' : ''}"><div class="text-brand-600 font-bold text-sm">${s}</div><div class="font-bold text-lg">${i}</div><div class="text-xs text-slate-500">${inc}</div><div class="mt-3 text-xs"><div class="text-slate-400">税务</div>${tax}</div><div class="mt-2 text-xs"><div class="text-slate-400">你要做的</div>${act}</div></div>`).join('')}</div><div class="mt-4 text-sm bg-amber-50 text-amber-800 rounded-xl p-4"><i class="fas fa-lightbulb mr-1"></i>基于你年化收入 ${money(c.income)}：${c.reason}<div class="text-xs mt-1">${c.caveat}</div></div>`);
};
