/* 企业端：三层用工结构 · 全量薪酬 · 任务与交付 · 结算凭证包 */
const LAYER = { core: ['核心层', '劳动合同（全日制）', 'brand'], flex: ['弹性层', '非全日制 / 劳务派遣 / 业务外包', 'amber'], task: ['任务层', '平台灵活用工 / OPC项目外包', 'emerald'] };
const ETYPE = { fulltime: '全日制劳动合同', parttime: '非全日制', dispatch: '劳务派遣', outsource: '业务外包', platform: '平台灵活用工' };
const PRICING = { piece: '按件/场次', project: '按项目', milestone: '里程碑', time: '按时间' };
const EP = window.__ROLE__ === 'admin' ? '?enterprise_id=' + (new URLSearchParams(location.hash.split('?')[1] || '').get('eid') || 1) : '';
const eapi = { get: (u, p = {}) => api.get('/enterprise' + u, { params: { ...(EP ? { enterprise_id: EP.split('=')[1] } : {}), ...p } }), post: (u, b) => api.post('/enterprise' + u + EP, b), put: (u, b) => api.put('/enterprise' + u + EP, b), del: u => api.delete('/enterprise' + u + EP) };

// ---------------- 驾驶舱 ----------------
VIEWS.dashboard = async () => {
  const [{ data: d }, { data: p }] = await Promise.all([eapi.get('/dashboard', { period: period() }), eapi.get('/profile')]);
  const emp = Object.fromEntries(d.employees.map(x => [x.layer, x.n]));
  const pay = d.payroll.reduce((s, b) => ({ cost: s.cost + (b.total_employer_cost || 0), tax: s.tax + (b.total_tax || 0), net: s.net + (b.total_net || 0) }), { cost: 0, tax: 0, net: 0 });
  const risk = Object.fromEntries(d.risk.map(x => [x.risk_level, x.n]));
  $('#view').innerHTML = `
  <div class="flex items-center justify-between mb-5"><div><div class="text-xl font-bold">${esc(p.name)}</div><div class="text-sm text-slate-500">${p.taxpayer_type === 'general' ? '一般纳税人' : '小规模纳税人'} · ${esc(p.industry || '')} · ${esc(p.region || '')} · 平台服务费 ${(p.service_rate * 100).toFixed(1)}%</div></div><div>${badge(p.risk_level, '企业风险 ' + p.risk_level)}</div></div>
  <div class="grid md:grid-cols-4 gap-4">
    ${stat('在册人员', (emp.core || 0) + (emp.flex || 0) + (emp.task || 0), `核心${emp.core || 0} · 弹性${emp.flex || 0} · 任务${emp.task || 0}`, 'fa-users')}
    ${stat(period() + ' 用工总成本', money(pay.cost), `个税 ${money(pay.tax)} · 实发 ${money(pay.net)}`, 'fa-coins', 'amber')}
    ${stat('本期平台结算', money(d.settlement?.amt || 0), `${d.settlement?.n || 0}笔 · 服务费 ${money(d.settlement?.fee || 0)}`, 'fa-file-shield', 'emerald')}
    ${stat('任务风控', `${risk.green || 0} / ${risk.yellow || 0} / ${risk.red || 0}`, '绿 / 黄 / 红', 'fa-shield-halved', 'red')}
  </div>
  <div class="grid lg:grid-cols-3 gap-4 mt-4">
    ${card('用工结构合规体检（三层优化模型）', `
      <div class="flex items-center gap-6"><div class="text-5xl font-extrabold ${d.diagnosis.score >= 80 ? 'text-emerald-600' : d.diagnosis.score >= 60 ? 'text-amber-500' : 'text-red-600'}">${d.diagnosis.score}</div><div class="flex-1 space-y-2">
      ${Object.entries(d.diagnosis.layers).map(([k, l]) => `<div><div class="flex justify-between text-xs"><span>${LAYER[k][0]} <span class="text-slate-400">目标${l.target}</span></span><span>${l.count}人 · ${l.pct}%</span></div><div class="h-2 bg-slate-100 rounded-full mt-1"><div class="h-2 rounded-full bg-${LAYER[k][2]}-500" style="width:${l.pct}%"></div></div></div>`).join('')}</div></div>
      <ul class="mt-4 space-y-1 text-sm">${d.diagnosis.findings.map(f => `<li class="flex gap-2"><span class="mt-1 w-2 h-2 rounded-full shrink-0 ${{ red: 'bg-red-500', yellow: 'bg-amber-500', green: 'bg-emerald-500', blue: 'bg-blue-500' }[f.level]}"></span>${esc(f.text)}</li>`).join('')}</ul>`)}
    ${card('近6期用工成本趋势', '<canvas id="trend-chart" height="180"></canvas>')}
    ${card('交付与结算漏斗', `<div class="space-y-3 text-sm">${['signed', 'delivered', 'accepted', 'settled'].map(s => { const o = d.orders.find(x => x.status === s) || { n: 0, amt: 0 }; return `<div class="flex items-center justify-between"><span>${sbadge(s)}</span><span>${o.n}单 · ${money(o.amt)}</span></div>`; }).join('')}</div>
      <div class="mt-4 pt-4 border-t text-xs text-slate-500">任务：${d.tasks.map(t => `${STATUS[t.status]?.[1] || t.status} ${t.n}`).join(' · ')}</div>`)}
  </div>
  <div class="mt-4 grid lg:grid-cols-3 gap-4">
    <div class="lg:col-span-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-2xl p-6">
      <div class="font-bold text-lg"><i class="fas fa-route mr-2"></i>每月这样用（3步）</div>
      <div class="grid md:grid-cols-3 gap-4 mt-4 text-sm">
        <div class="bg-white/10 rounded-xl p-4"><div class="text-2xl font-extrabold">1</div><div class="font-semibold mt-1">验收交付</div><div class="text-brand-100 text-xs mt-1">兼职交付后在「任务与交付」点验收，金额进入结算</div><a href="#tasks" class="inline-block mt-2 text-xs underline">去验收</a></div>
        <div class="bg-white/10 rounded-xl p-4"><div class="text-2xl font-extrabold">2</div><div class="font-semibold mt-1">算薪发放</div><div class="text-brand-100 text-xs mt-1">「薪酬管理」三层各点一次：试算→生成→审批→发放</div><a href="#payroll" class="inline-block mt-2 text-xs underline">去发薪</a></div>
        <div class="bg-white/10 rounded-xl p-4"><div class="text-2xl font-extrabold">3</div><div class="font-semibold mt-1">拿凭证</div><div class="text-brand-100 text-xs mt-1">发放后凭证包自动生成，申报由平台完成</div><a href="#settlements" class="inline-block mt-2 text-xs underline">看凭证</a></div>
      </div>
    </div>
    <div class="bg-white rounded-2xl border border-dashed border-brand-300 p-6 flex flex-col justify-between">
      <div><div class="font-bold"><i class="fas fa-wand-magic-sparkles text-brand-600 mr-2"></i>不想手动点？</div><div class="text-sm text-slate-500 mt-2">一键模拟"发布任务→从业人员签约→交付→验收"，然后您只需去「薪酬管理」发放任务层，就能看到完整链路。</div></div>
      ${btn('<i class="fas fa-play mr-1"></i>一键跑通演示流程', 'primary', 'id="run-demo" class="mt-4 w-full"')}
    </div>
  </div>
  <div class="mt-4">${card('<i class="fas fa-robot text-brand-600 mr-2"></i>AI 数字员工 · 今天帮您做什么', `<div class="grid md:grid-cols-4 gap-3">${[['compliance_doctor', 'fa-stethoscope', '用工合规体检', '30 分钟出报告'], ['task_pricer', 'fa-sitemap', '把需求拆成任务包', '可一键创建任务'], ['ecom_copywriter', 'fa-pen-nib', '写电商文案', '自动规避广告法'], ['finance_assistant', 'fa-file-invoice-dollar', '发票能否扣除', '附政策依据']].map(([k, i, t, d]) => `<button onclick="openAgent('${k}')" class="text-left rounded-xl border p-3 hover:border-brand-500 hover:bg-brand-50/40 transition"><i class="fas ${i} text-brand-600"></i><div class="font-medium text-sm mt-1">${t}</div><div class="text-xs text-slate-500">${d}</div></button>`).join('')}</div><div class="mt-3 text-right"><a href="#ai" class="text-sm text-brand-600">全部 15 个数字员工 <i class="fas fa-arrow-right"></i></a></div>`)}</div>
  <div class="mt-4">${card('快捷操作', `<div class="flex flex-wrap gap-2">${btn('<i class="fas fa-plus mr-1"></i>新增人员', 'primary', 'onclick="location.hash=\'employees\'"')}${btn('<i class="fas fa-calculator mr-1"></i>薪酬试算', 'ghost', 'onclick="location.hash=\'payroll\'"')}${btn('<i class="fas fa-list-check mr-1"></i>发布任务（AI风控）', 'ghost', 'onclick="location.hash=\'tasks\'"')}${btn('<i class="fas fa-scale-balanced mr-1"></i>用工方案成本对比', 'ghost', 'onclick="location.hash=\'compare\'"')}</div>`)}</div>`;
  $('#run-demo').onclick = async () => { try { const { data } = await eapi.post('/demo/run-flow', {}); modal('演示流程已完成 ✓', `<div class="text-sm space-y-2"><div>✅ 发布任务「演示任务 · 短视频剪辑」（AI 评分 0，绿色放行）</div><div>✅ 从业人员 <b>${esc(data.worker)}</b> 实名签约，电子合同已存证</div><div>✅ 交付 10 条成片，SHA-256 存证</div><div>✅ 您已验收，金额 <b>${money(data.amount)}</b> 进入待结算</div><div class="mt-4 p-3 bg-brand-50 rounded-lg text-brand-800"><i class="fas fa-arrow-right mr-1"></i>${data.next}</div></div>`, { footer: btn('稍后', 'ghost', 'onclick="closeModal()"') + btn('去薪酬管理发放 →', 'primary', 'onclick="closeModal();location.hash=\'payroll\'"') }); } catch (e) { toast(errMsg(e), 'error'); } };
  chart('trend-chart', { type: 'bar', data: { labels: d.trend.map(t => t.period), datasets: [{ label: '用工总成本', data: d.trend.map(t => t.cost), backgroundColor: '#2f5bea' }, { label: '实发', data: d.trend.map(t => t.net), backgroundColor: '#10b981' }] }, options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } } });
};

// ---------------- 三层用工结构 ----------------
VIEWS.employees = async () => {
  const { data: rows } = await eapi.get('/employees');
  const group = k => rows.filter(r => r.layer === k && r.status === 'active');
  $('#view').innerHTML = `
  <div class="flex items-center justify-between mb-4"><p class="text-sm text-slate-500">让每一类岗位匹配最恰当的法律关系与税务路径：核心层 50-70% · 弹性层 10-30% · 任务层 10-30%</p>${btn('<i class="fas fa-plus mr-1"></i>新增人员', 'primary', 'id="add-emp"')}</div>
  ${['core', 'flex', 'task'].map(k => card(`<span class="inline-block w-2 h-2 rounded-full bg-${LAYER[k][2]}-500 mr-2"></span>${LAYER[k][0]} <span class="text-xs text-slate-400 font-normal ml-2">${LAYER[k][1]}</span>`,
    table(['姓名', '用工形态', '岗位/部门', '薪酬基准', '社保/公积金基数', '专项附加', '入职', '状态', '操作'], group(k).map(e => [esc(e.name), ETYPE[e.employment_type] || e.employment_type, `${esc(e.position || '')}<div class="text-xs text-slate-400">${esc(e.department || '')}</div>`,
      e.employment_type === 'parttime' ? `${money(e.hourly_rate)}/小时` : e.employment_type === 'platform' ? '<span class="text-xs text-slate-400">按任务结算</span>' : money(e.base_salary),
      ['fulltime'].includes(e.employment_type) ? `${fmt(e.social_base, 0)} / ${fmt(e.housing_base, 0)}` : '—', e.special_deduction ? money(e.special_deduction) : '—', e.start_date || '', e.employment_type === 'platform' ? (e.worker_verified ? badge('green', '已实名') : badge('red', '未实名')) : sbadge(e.status),
      `${btn('编辑', 'ghost', `data-edit="${e.id}"`)} ${btn('离职', 'ghost', `data-del="${e.id}"`)}`]), '该层暂无人员'), `<span class="text-sm text-slate-500">${group(k).length} 人</span>`)).join('<div class="h-4"></div>')}`;
  $('#add-emp').onclick = () => empForm();
  $$('[data-edit]').forEach(b => b.onclick = () => empForm(rows.find(r => r.id == b.dataset.edit)));
  $$('[data-del]').forEach(b => b.onclick = async () => { if (!confirm('确认办理离职/停用？')) return; await eapi.del('/employees/' + b.dataset.del); toast('已停用'); route(); });
};
function empForm(e = {}) {
  modal(e.id ? '编辑人员' : '新增人员', `<div class="grid md:grid-cols-2 gap-4">
    ${input('f-name', '姓名 *', e.name)}${input('f-idno', '身份证号', e.id_no)}${input('f-phone', '手机', e.phone)}
    ${select('f-layer', '用工层级 *', [['core', '核心层 · 劳动合同'], ['flex', '弹性层 · 非全日制/派遣/外包'], ['task', '任务层 · 平台灵活用工']], e.layer || 'core')}
    ${select('f-etype', '用工形态 *', Object.entries(ETYPE), e.employment_type || 'fulltime')}
    ${input('f-position', '岗位', e.position)}${input('f-dept', '部门', e.department)}
    ${input('f-salary', '月薪/外包月费（元）', e.base_salary || '', 'number')}${input('f-hourly', '小时工资（非全日制）', e.hourly_rate || '', 'number')}
    ${input('f-sbase', '社保基数', e.social_base || '', 'number')}${input('f-hbase', '公积金基数', e.housing_base || '', 'number')}
    ${input('f-sd', '专项附加扣除（月）', e.special_deduction || '', 'number')}${input('f-start', '入职/开始日期', e.start_date || '', 'date')}
    ${e.id ? input('f-end', '离职/结束日期', e.end_date || '', 'date') : ''}${input('f-bank', '银行账号', e.bank_account)}</div>
    <div class="mt-4 text-xs text-slate-500 bg-slate-50 rounded-lg p-3"><i class="fas fa-shield-halved text-brand-600 mr-1"></i>风控提示：任务层人员将与本企业核心/弹性层在职及近3个月离职人员比对身份证，命中即一票否决（"老员工转灵工"红线）。</div>`,
    { footer: btn('取消', 'ghost', 'onclick="closeModal()"') + btn('保存', 'primary', 'id="f-save"') });
  $('#f-layer').onchange = () => { const m = { core: 'fulltime', flex: 'parttime', task: 'platform' }; $('#f-etype').value = m[v('f-layer')]; };
  $('#f-save').onclick = async () => {
    const body = { name: v('f-name'), id_no: v('f-idno'), phone: v('f-phone'), layer: v('f-layer'), employment_type: v('f-etype'), position: v('f-position'), department: v('f-dept'), base_salary: num('f-salary'), hourly_rate: num('f-hourly'), social_base: num('f-sbase'), housing_base: num('f-hbase'), special_deduction: num('f-sd'), start_date: v('f-start'), end_date: v('f-end'), bank_account: v('f-bank'), status: 'active' };
    try { e.id ? await eapi.put('/employees/' + e.id, body) : await eapi.post('/employees', body); toast('保存成功'); closeModal(); route(); } catch (ex) { toast(errMsg(ex), 'error'); }
  };
}

// ---------------- 薪酬管理 ----------------
VIEWS.payroll = async () => {
  const { data: batches } = await eapi.get('/payroll/batches');
  const cur = k => batches.find(b => b.period === period() && b.layer === k);
  const stepOf = b => !b ? 0 : { calculated: 1, approved: 2, paid: 3 }[b.status] || 0;
  $('#view').innerHTML = `
  <div class="bg-white rounded-2xl border p-5 mb-4"><div class="font-bold mb-3"><i class="fas fa-list-ol text-brand-600 mr-2"></i>${period()} 发薪进度 <span class="text-xs text-slate-400 font-normal ml-2">每层四步：试算 → 生成批次 → 审批 → 发放</span></div>
    <div class="grid md:grid-cols-3 gap-4">${['core', 'flex', 'task'].map(k => { const b = cur(k); const st = stepOf(b); return `<div><div class="text-sm font-medium mb-2"><span class="inline-block w-2 h-2 rounded-full bg-${LAYER[k][2]}-500 mr-2"></span>${LAYER[k][0]}</div><div class="flex items-center gap-1 text-xs">${['试算', '批次', '审批', '发放'].map((s, i) => `<span class="flex-1 text-center py-1 rounded ${i < st ? 'bg-emerald-100 text-emerald-700' : i === st ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}">${i < st ? '✓ ' : ''}${s}</span>`).join('')}</div></div>`; }).join('')}</div></div>
  <div class="grid md:grid-cols-3 gap-4">
    ${['core', 'flex', 'task'].map(k => `<div class="bg-white rounded-2xl border border-slate-200 p-5"><div class="flex items-center justify-between"><div><div class="font-bold"><span class="inline-block w-2 h-2 rounded-full bg-${LAYER[k][2]}-500 mr-2"></span>${LAYER[k][0]}薪酬</div><div class="text-xs text-slate-500 mt-1">${{ core: '工资薪金累计预扣 · 三险一金', flex: '非全日制按小时计薪+工伤险 · 外包取票', task: '劳务报酬累计预扣（16号公告）+ 增值税代办' }[k]}</div></div></div>
      <div class="mt-4 flex gap-2">${btn('<i class="fas fa-calculator mr-1"></i>试算 ' + period(), 'primary', `data-calc="${k}"`)}</div></div>`).join('')}
  </div>
  <div class="mt-4">${card('薪酬批次', table(['期间', '层级', '人数', '应发合计', '个人社保公积金', '单位社保公积金', '个税/预扣', '实发', '企业总成本', '状态', '操作'], batches.map(b => [b.period, LAYER[b.layer][0], b.headcount, money(b.total_gross), money(b.total_personal_insurance), money(b.total_employer_insurance), money(b.total_tax), money(b.total_net), `<b>${money(b.total_employer_cost)}</b>`, sbadge(b.status),
    `${btn('明细', 'ghost', `data-view="${b.id}"`)} ${b.status === 'calculated' ? btn('审批', 'success', `data-approve="${b.id}"`) : ''} ${['approved', 'calculated'].includes(b.status) ? btn('发放并生成申报', 'primary', `data-pay="${b.id}"`) : ''}`])))}</div>`;
  $$('[data-calc]').forEach(b => b.onclick = () => payrollCalc(b.dataset.calc));
  $$('[data-view]').forEach(b => b.onclick = () => batchDetail(b.dataset.view));
  $$('[data-approve]').forEach(b => b.onclick = async () => { await eapi.post(`/payroll/batches/${b.dataset.approve}/approve`); toast('已审批'); route(); });
  $$('[data-pay]').forEach(b => b.onclick = async () => { if (!confirm('确认发放？发放后将自动生成扣缴申报草稿（任务层同时生成结算记录、凭证包与委托代征记录）')) return; try { await eapi.post(`/payroll/batches/${b.dataset.pay}/pay`); toast('发放完成，申报草稿已推送至平台合规申报中心'); route(); } catch (e) { toast(errMsg(e), 'error'); } });
};
async function payrollCalc(layer) {
  const { data: emps } = await eapi.get('/employees', { layer });
  const active = emps.filter(e => e.status === 'active');
  const col = layer === 'core' ? '本期奖金/补贴' : layer === 'flex' ? '本期工时(h) / 外包金额' : '本期结算金额（空=按已验收任务）';
  modal(`${LAYER[layer][0]}薪酬试算 · ${period()}`, `<div class="text-xs text-slate-500 mb-3">${LAYER[layer][1]}</div>${table(['姓名', '形态', '基准', col], active.map(e => [esc(e.name), ETYPE[e.employment_type], e.employment_type === 'parttime' ? money(e.hourly_rate) + '/h' : e.employment_type === 'platform' ? '按任务' : money(e.base_salary), `<input data-emp="${e.id}" type="number" class="border rounded px-2 py-1 w-36" placeholder="${layer === 'flex' && e.employment_type === 'parttime' ? '工时' : layer === 'core' ? '0' : '金额'}">`]))}
    <div id="calc-result" class="mt-4"></div>`, { wide: true, footer: btn('关闭', 'ghost', 'onclick="closeModal()"') + btn('试算（不保存）', 'ghost', 'id="dry"') + btn('生成批次', 'primary', 'id="save"') });
  const collect = () => active.map(e => { const val = $(`[data-emp="${e.id}"]`).value; const o = { employee_id: e.id }; if (val === '') return o; if (layer === 'core') o.bonus = +val; else if (layer === 'flex' && e.employment_type === 'parttime') o.hours = +val; else o.gross = +val; return o; });
  const run = async dry => { try { const { data } = await eapi.post('/payroll/calculate', { period: period(), layer, inputs: collect(), dry_run: dry }); $('#calc-result').innerHTML = renderItems(data); if (!dry) { toast('批次已生成'); setTimeout(() => { closeModal(); route(); }, 800); } } catch (e) { toast(errMsg(e), 'error'); } };
  $('#dry').onclick = () => run(true); $('#save').onclick = () => run(false);
}
function renderItems(d) {
  const isTask = d.layer === 'task';
  return `<div class="grid grid-cols-4 gap-3 text-sm mb-3">${[['应发合计', d.total_gross], [isTask ? '预扣个税' : '个税', d.total_tax], ['实发', d.total_net], ['企业总成本', d.total_employer_cost]].map(([l, x]) => `<div class="rounded-lg bg-slate-50 p-3"><div class="text-xs text-slate-500">${l}</div><div class="font-bold">${money(x)}</div></div>`).join('')}</div>
  ${table(isTask ? ['姓名', '结算额', '累计收入', '累计应纳税所得', '本期预扣', '增值税+附加', '平台服务费', '实到手', '企业成本', '较传统劳务少缴'] : ['姓名', '应发', '个人社保+公积金', '单位社保+公积金', '专项附加', '累计应纳税所得', '本期个税', '实发', '企业成本'],
    d.items.map(i => isTask ? [esc(i.employee_name), money(i.gross), money(i.cum_income), money(i.cum_taxable), money(i.tax), money((i.vat || 0) + (i.surcharge || 0)), money(i.service_fee), `<b>${money(i.net)}</b>`, money(i.employer_cost), `<span class="text-emerald-600">${money(i.detail?.saving_vs_legacy)}</span>`]
      : [esc(i.employee_name) + (i.detail?.warn ? ` <i class="fas fa-triangle-exclamation text-amber-500" title="${esc(i.detail.warn)}"></i>` : ''), money((i.gross || 0) + (i.bonus || 0)), money((i.personal_insurance || 0) + (i.personal_housing || 0)), money((i.employer_insurance || 0) + (i.employer_housing || 0)), money(i.special_deduction), money(i.cum_taxable), money(i.tax), `<b>${money(i.net)}</b>`, money(i.employer_cost)]))}
  <details class="mt-3 text-xs text-slate-500"><summary class="cursor-pointer">计算公式与依据</summary><ul class="mt-2 space-y-1">${d.items.map(i => `<li><b>${esc(i.employee_name)}</b> · ${esc(i.detail?.method || '')}<br>${esc(i.detail?.formula || '')}${i.detail?.vat_rule ? '<br>增值税：' + esc(i.detail.vat_rule) : ''}${i.detail?.warn ? '<br><span class="text-amber-600">⚠ ' + esc(i.detail.warn) + '</span>' : ''}</li>`).join('')}</ul></details>`;
}
async function batchDetail(id) {
  const { data } = await eapi.get('/payroll/batches/' + id);
  modal(`${data.period} · ${LAYER[data.layer][0]}薪酬明细 ${sbadge(data.status)}`, renderItems(data) + `<div class="mt-3 text-right">${data.items.map(i => btn('工资条·' + esc(i.employee_name), 'ghost', `data-slip="${i.id}" class="text-xs m-0.5"`)).join('')}</div>`, { wide: true, footer: btn('关闭', 'ghost', 'onclick="closeModal()"') });
  $$('[data-slip]').forEach(b => b.onclick = async () => { const { data: s } = await eapi.get('/payroll/payslip/' + b.dataset.slip); modal(`工资条 · ${esc(s.employee_name)} · ${s.period}`, `<div class="text-sm space-y-1">${[['企业', s.enterprise_name], ['应发', money((s.gross || 0) + (s.bonus || 0))], ['个人社保', money(s.personal_insurance)], ['个人公积金', money(s.personal_housing)], ['专项附加扣除', money(s.special_deduction)], ['累计应纳税所得额', money(s.cum_taxable)], ['累计已预扣', money(s.cum_tax - s.tax)], ['本期个税', money(s.tax)], ['实发', `<b>${money(s.net)}</b>`]].map(([k, x]) => `<div class="flex justify-between border-b border-slate-100 py-1"><span class="text-slate-500">${k}</span><span>${x}</span></div>`).join('')}</div><div class="mt-3 text-xs text-slate-500">${esc(s.detail?.formula || '')}</div>${s.detail?.insurance ? table(['险种', '个人', '单位'], s.detail.insurance.map(x => [x.name, money(x.p), money(x.e)])) : ''}`, { footer: btn('关闭', 'ghost', 'onclick="closeModal()"') }); });
}

// ---------------- 任务与交付 ----------------
VIEWS.tasks = async () => {
  const [{ data: tasks }, { data: apps }] = await Promise.all([eapi.get('/tasks'), eapi.get('/applications')]);
  const pendingDeliv = tasks.reduce((s, t) => s + 0, 0);
  $('#view').innerHTML = `
  <div class="flex items-center justify-between mb-4 flex-wrap gap-2"><p class="text-sm text-slate-500">流程：发布任务（AI评分）→ 从业人员申请 → 您确认签约 → 对方交付 → 您验收 → 进入薪酬结算</p><div class="flex gap-2">${btn('<i class="fas fa-robot mr-1"></i>AI 帮我拆解定价', 'ghost', `onclick="openAgent('task_pricer')"`)}${btn('<i class="fas fa-plus mr-1"></i>发布任务', 'primary', 'id="add-task"')}</div></div>
  ${apps.length ? card(`<i class="fas fa-inbox text-brand-600 mr-2"></i>接单申请（${apps.length}）· 需要您确认`, `<div class="space-y-2">${apps.map(a => `<div class="flex items-center justify-between rounded-xl border p-3 bg-brand-50/50"><div class="text-sm"><b>${esc(a.worker_name)}</b> ${a.verified ? badge('green', '已实名') : badge('red', '未实名')} 申请「${esc(a.title)}」<div class="text-xs text-slate-500">${esc(a.skills || '')} · ${esc(a.region || '')} · ${money(a.unit_price)} × ${a.quantity}${a.message ? ' · "' + esc(a.message) + '"' : ''}</div></div><div class="flex gap-2">${btn('确认签约', 'success', `data-app-ok="${a.id}"`)}${btn('婉拒', 'ghost', `data-app-no="${a.id}"`)}</div></div>`).join('')}</div>`) + '<div class="h-4"></div>' : ''}
  ${card('', table(['任务', '类别', '计价', '预算', '风险评分', '状态', '接单', '截止', '操作'], tasks.map(t => [`<b>${esc(t.title)}</b><div class="text-xs text-slate-400 max-w-xs truncate">${esc(t.description || '')}</div>`, esc(t.category || ''), `${PRICING[t.pricing_mode]}<div class="text-xs text-slate-400">${money(t.unit_price)} × ${t.quantity}</div>`, money(t.budget), `<span class="font-bold ${{ green: 'text-emerald-600', yellow: 'text-amber-500', red: 'text-red-600' }[t.risk_level]}">${t.risk_score}</span> ${badge(t.risk_level, t.risk_level)}`, sbadge(t.status), t.order_count, t.deadline || '', `${btn('风控详情', 'ghost', `data-risk="${t.id}"`)} ${t.status === 'draft' ? btn('发布', 'success', `data-publish="${t.id}"`) : ''} ${t.status === 'published' ? btn('派单/签约', 'ghost', `data-assign="${t.id}"`) : ''} ${btn((t.delivered_count ? '<span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>验收(' + t.delivered_count + ')' : '订单'), t.delivered_count ? 'primary' : 'ghost', `data-orders="${t.id}"`)}`])))}`;
  $('#add-task').onclick = taskForm;
  $$('[data-app-ok]').forEach(b => b.onclick = async () => { try { const { data } = await eapi.post(`/applications/${b.dataset.appOk}/decide`, { accept: true }); toast(`签约成功，电子合同 ${data.contract_no}`); route(); } catch (e) { toast(errMsg(e), 'error'); } });
  $$('[data-app-no]').forEach(b => b.onclick = async () => { await eapi.post(`/applications/${b.dataset.appNo}/decide`, { accept: false }); toast('已婉拒', 'warn'); route(); });
  $$('[data-risk]').forEach(b => b.onclick = () => { const t = tasks.find(x => x.id == b.dataset.risk); modal(`风控评估 · ${esc(t.title)}`, riskPanel(t.risk_detail), { footer: btn('关闭', 'ghost', 'onclick="closeModal()"') }); });
  $$('[data-assign]').forEach(b => b.onclick = () => assignForm(tasks.find(x => x.id == b.dataset.assign)));
  $$('[data-publish]').forEach(b => b.onclick = async () => { try { await eapi.post(`/tasks/${b.dataset.publish}/publish`, {}); toast('已发布'); route(); } catch (e) { toast(errMsg(e), 'error'); } });
  $$('[data-orders]').forEach(b => b.onclick = () => ordersView(tasks.find(x => x.id == b.dataset.orders)));
};
function taskForm() {
  modal('发布任务 · AI风控实时评估', `<div class="grid md:grid-cols-2 gap-4">
    <div class="md:col-span-2">${input('t-title', '任务标题 *', '')}</div>
    ${select('t-cat', '场景类别', ['直播电商/MCN', 'AI数据标注', '软件众包', '设计创意', '教育培训', '专家顾问/翻译', '会展活动', '零售促销', '同城配送（专项方案）', '制造计件（严格风控）', '其他'].map(x => [x, x]))}
    ${select('t-pricing', '计价方式', Object.entries(PRICING), 'piece')}
    ${input('t-price', '单价（元）', '', 'number')}${input('t-qty', '数量', 1, 'number')}
    <div class="md:col-span-2"><label class="text-sm text-slate-600">任务描述</label><textarea id="t-desc" rows="3" class="mt-1 w-full border rounded-lg px-3 py-2" placeholder="描述真实商业需求、交付方式。注意：含“坐班/打卡/月薪/固定工作时段”等描述将触发风控"></textarea></div>
    ${input('t-deliv', '交付物要求', '')}${input('t-accept', '验收标准', '')}
    ${input('t-deadline', '截止日期', '', 'date')}
    <div class="text-sm space-y-2"><label class="flex items-center gap-2"><input type="checkbox" id="t-core">属于企业核心主营长期岗位</label><label class="flex items-center gap-2"><input type="checkbox" id="t-former">接单人为本企业在职/3个月内离职员工</label></div>
    </div>
    <div class="mt-4 flex gap-2">${btn('<i class="fas fa-robot mr-1"></i>AI预评估', 'ghost', 'id="t-assess"')}</div>
    <div id="t-risk" class="mt-3"></div>`, { wide: true, footer: btn('取消', 'ghost', 'onclick="closeModal()"') + btn('发布', 'primary', 'id="t-save"') });
  const body = () => ({ title: v('t-title'), category: v('t-cat'), description: v('t-desc'), pricing_mode: v('t-pricing'), unit_price: num('t-price'), quantity: num('t-qty'), deliverable_spec: v('t-deliv'), acceptance_std: v('t-accept'), deadline: v('t-deadline'), core_business: $('#t-core').checked, is_former_employee: $('#t-former').checked, has_deliverable: !!v('t-deliv') });
  $('#t-assess').onclick = async () => { const { data } = await eapi.post('/tasks/assess', body()); $('#t-risk').innerHTML = riskPanel(data); };
  $('#t-save').onclick = async () => { try { const { data } = await eapi.post('/tasks', body()); toast({ published: '任务已发布（绿）', review: '任务进入人工复核（黄）', blocked: '任务被风控拦截（红）' }[data.status], data.status === 'published' ? 'success' : data.status === 'review' ? 'warn' : 'error'); $('#t-risk').innerHTML = riskPanel(data.risk); setTimeout(() => { closeModal(); route(); }, 1500); } catch (e) { toast(errMsg(e), 'error'); } };
}
async function assignForm(t) {
  const { data: workers } = await eapi.get('/workers');
  modal(`派单签约 · ${esc(t.title)}`, `${select('a-worker', '选择从业人员', workers.map(w => [w.id, `${w.name} · ${w.region || ''} · ${w.skills || ''} ${w.verified ? '✓已实名' : '✗未实名'}`]))}
    <div class="mt-4 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">签约将生成《服务合作协议》电子合同并存证哈希；平台作为结算运营主体履行扣缴与代办申报义务；接单人须完成实名核验与代办申报授权。</div>`, { footer: btn('取消', 'ghost', 'onclick="closeModal()"') + btn('<i class="fas fa-file-signature mr-1"></i>电子签约', 'primary', 'id="a-save"') });
  $('#a-save').onclick = async () => { try { const { data } = await eapi.post(`/tasks/${t.id}/orders`, { worker_id: +v('a-worker') }); toast(`签约成功 ${data.contract_no}`); closeModal(); ordersView(t); } catch (e) { toast(errMsg(e), 'error'); } };
}
async function ordersView(t) {
  const { data: orders } = await eapi.get(`/tasks/${t.id}/orders`);
  modal(`订单 · ${esc(t.title)}`, table(['合同号', '从业人员', '状态', '完成量', '金额', '交付物', '存证', '操作'], orders.map(o => [`<span class="font-mono text-xs">${o.contract_no}</span>`, esc(o.worker_name), sbadge(o.status), o.quantity_done, money(o.amount), esc(o.deliverable_desc || ''), o.deliverable_hash ? `<span class="font-mono text-xs" title="${o.deliverable_hash}">${o.deliverable_hash.slice(0, 10)}…</span>` : '', `${o.status === 'signed' ? btn('登记交付', 'ghost', `data-deliver="${o.id}"`) : ''} ${o.status === 'delivered' ? btn('验收通过', 'success', `data-accept="${o.id}"`) + ' ' + btn('驳回', 'danger', `data-reject="${o.id}"`) : ''}`])), { wide: true, footer: btn('关闭', 'ghost', 'onclick="closeModal()"') });
  $$('[data-deliver]').forEach(b => b.onclick = async () => { const qty = prompt('完成数量（按件/场次/里程碑）', t.quantity); if (qty == null) return; const desc = prompt('交付物说明（将生成哈希存证）', ''); try { await eapi.post(`/orders/${b.dataset.deliver}/deliver`, { quantity_done: +qty, deliverable_desc: desc }); toast('交付已登记并存证'); ordersView(t); } catch (e) { toast(errMsg(e), 'error'); } });
  $$('[data-accept]').forEach(b => b.onclick = async () => { await eapi.post(`/orders/${b.dataset.accept}/accept`, {}); toast('验收通过，可进入任务层薪酬结算'); ordersView(t); });
  $$('[data-reject]').forEach(b => b.onclick = async () => { const reason = prompt('驳回原因'); await eapi.post(`/orders/${b.dataset.reject}/accept`, { reject: true, reason }); toast('已驳回', 'warn'); ordersView(t); });
}

// ---------------- 结算与凭证包 ----------------
VIEWS.settlements = async () => {
  const { data: rows } = await eapi.get('/settlements');
  $('#view').innerHTML = card('平台受托结算记录（资金：企业 → 持牌支付机构受托账户 → 从业人员，单向不回流）', table(['结算单号', '期间', '从业人员', '结算额', '服务费', '预扣个税', '增值税+附加', '实到手', '累计收入', '状态', '凭证包'], rows.map(s => [`<span class="font-mono text-xs">${s.settlement_no}</span>`, s.period, esc(s.worker_name), money(s.amount), money(s.service_fee), money(s.iit), money(s.vat + s.surcharge), `<b>${money(s.net)}</b>`, money(s.cum_income), sbadge(s.status), btn('<i class="fas fa-file-shield mr-1"></i>五流合一', 'ghost', `data-ev="${s.id}"`)])));
  $$('[data-ev]').forEach(b => b.onclick = async () => { const { data: e } = await eapi.get(`/settlements/${b.dataset.ev}/evidence`); modal(`凭证包 ${e.package_no}`, `<div class="text-sm text-slate-500 mb-3">${esc(e.enterprise)} · ${e.period} · ${esc(e.worker.name)}（${e.worker.id_no_masked}）· ${e.retention}</div><div class="grid md:grid-cols-5 gap-3">${Object.values(e.five_flows).map(f => `<div class="rounded-xl border p-3"><div class="font-bold text-brand-700 text-sm">${f.name}</div>${f.items.map(i => `<div class="mt-2 text-xs"><div class="font-medium">${esc(i.type)}</div>${i.no ? `<div class="font-mono text-slate-500 break-all">${esc(i.no)}</div>` : ''}${i.amount != null ? `<div>${money(i.amount)}</div>` : ''}${i.hash ? `<div class="font-mono text-slate-400 break-all" title="${i.hash}">${String(i.hash).slice(0, 16)}…</div>` : ''}${i.direction ? `<div class="text-slate-500">${i.direction}</div>` : ''}${i.desc ? `<div class="text-slate-500">${esc(i.desc)}</div>` : ''}</div>`).join('')}</div>`).join('')}</div>${e.collection.length ? `<div class="mt-4">${table(['代征税种', '计税依据', '征收率', '税额', '状态', '凭证号'], e.collection.map(c => [c.tax_type === 'vat' ? '增值税' : '附加税费', money(c.tax_base), pct(c.rate * 100), money(c.amount), sbadge(c.status), c.certificate_no || '—']))}</div>` : ''}<div class="mt-4 text-xs text-slate-400">${e.disclaimer}</div>`, { wide: true, footer: btn('关闭', 'ghost', 'onclick="closeModal()"') + btn('<i class="fas fa-download mr-1"></i>导出审计包（JSON）', 'primary', `onclick='downloadJSON(${JSON.stringify(e).replace(/'/g, "&#39;")},"${e.package_no}.json")'`) }); });
};
function downloadJSON(obj, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })); a.download = name; a.click(); }

// ---------------- 成本对比 ----------------
VIEWS.compare = async () => {
  const render = async () => {
    const { data } = await eapi.get('/cost-compare', { payout: num('c-payout') || 300000, taxpayer_type: v('c-type') });
    $('#c-result').innerHTML = table(['方案', '名义总支出/月', '可抵扣进项', '不可扣除多缴企业所得税', '净成本', '合规风险'], data.options.map((o, i) => [`${i === 2 ? '<b class="text-brand-700">' + o.name + '</b>' : o.name}`, money(o.nominal), money(o.deductible), money(o.extraCit), `<b>${money(o.net)}</b>`, badge({ 极高: 'red', 高: 'red', 低: 'green' }[o.risk], o.risk)])) + `<div class="mt-4 text-sm bg-brand-50 text-brand-800 rounded-xl p-4"><i class="fas fa-lightbulb mr-1"></i>${data.insight}</div>`;
    chart('c-chart', { type: 'bar', data: { labels: data.options.map(o => o.name), datasets: [{ label: '净成本', data: data.options.map(o => o.net), backgroundColor: ['#ef4444', '#f59e0b', '#2f5bea'] }] }, options: { plugins: { legend: { display: false } } } });
  };
  $('#view').innerHTML = `<div class="grid lg:grid-cols-3 gap-4"><div>${card('参数', `${input('c-payout', '月发放总额（元）', 300000, 'number')}<div class="mt-3">${select('c-type', '纳税人身份', [['general', '一般纳税人'], ['small', '小规模纳税人']])}</div><div class="mt-4">${btn('重新计算', 'primary', 'id="c-run"')}</div><p class="mt-4 text-xs text-slate-500">销售话术从"比别人便宜"转为"同等成本下风险归零：无虚开连带风险、税前扣除凭证合法、从业人员到手收入提升、劳动争议可防可控"。</p>`)}</div><div class="lg:col-span-2 space-y-4">${card('三方案净成本对比', '<canvas id="c-chart" height="120"></canvas>')}<div id="c-result">${card('', '')}</div></div></div>`;
  $('#c-run').onclick = render; render();
};

VIEWS.logs = async () => { const { data } = await eapi.get('/audit-logs'); $('#view').innerHTML = card('操作日志（AI决策审计 + 人工操作留痕）', table(['时间', '操作人', '动作', '对象', '详情'], data.map(l => [l.created_at, esc(l.user_name), `<span class="font-mono text-xs">${l.action}</span>`, esc(l.target || ''), esc(l.detail || '')]))); };

/* ---------------- 经营报表 ---------------- */
VIEWS.reportcenter = async () => {
  const year = period().slice(0, 4);
  const { data: r } = await eapi.get('/reports/summary', { year });
  const periods = [...new Set([...r.payroll.map(x => x.period), ...r.settle.map(x => x.period)])].sort();
  const sum = (arr, k) => arr.reduce((s, x) => s + (+x[k] || 0), 0);
  const risk = Object.fromEntries(r.risk.map(x => [x.risk_level, x.n]));
  const dl = t => `${location.origin}/api/enterprise/reports/export/${t}?period=${period()}${EP ? '&' + EP.slice(1) : ''}`;
  $('#view').innerHTML = `
  <div class="grid md:grid-cols-4 gap-4">
    ${stat(year + ' 年用工总成本', money(sum(r.payroll, 'cost')), `个税 ${money(sum(r.payroll, 'tax'))} · 单位社保 ${money(sum(r.payroll, 'ins'))}`, 'fa-coins', 'amber')}
    ${stat('平台结算总额', money(r.saving.payout), `服务费 ${money(sum(r.settle, 'fee'))} · ${sum(r.settle, 'n')} 笔`, 'fa-file-shield', 'emerald')}
    ${stat('较传统灵工节省', money(r.saving.vs_legacy), `较无凭证直接支付节省 ${money(r.saving.vs_direct)}（含25%不可扣除）`, 'fa-piggy-bank')}
    ${stat('任务风控', `${risk.green || 0}/${risk.yellow || 0}/${risk.red || 0}`, '绿 / 黄 / 红 · AI 调用 ' + sum(r.ai, 'n') + ' 次', 'fa-shield-halved', 'red')}
  </div>
  <div class="grid lg:grid-cols-2 gap-4 mt-4">
    ${card('月度用工成本（按层级）', '<canvas id="rc-cost" height="200"></canvas>')}
    ${card('平台结算与税款', '<canvas id="rc-settle" height="200"></canvas>')}
  </div>
  <div class="grid lg:grid-cols-2 gap-4 mt-4">
    ${card('部门 × 层级分布', table(['部门', '层级', '人数', '月薪合计'], r.dept.map(d => [esc(d.d), LAYER[d.layer][0], d.n, money(d.salary)])))}
    ${card('数据导出（CSV · 可直接导入 Excel / 财务系统）', `<div class="space-y-2 text-sm">${[['payroll', '薪酬明细表', '本期全部层级每人应发/扣款/个税/实发/企业成本'], ['settlements', '平台结算表', '本期任务层每笔结算、预扣、服务费、凭证状态'], ['employees', '人员花名册', '全部在册人员及三层属性']].map(([t, n, d]) => `<div class="flex items-center justify-between border-b border-slate-100 py-2"><div><div class="font-medium">${n}</div><div class="text-xs text-slate-500">${d}</div></div><a href="${dl(t)}" class="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg"><i class="fas fa-download mr-1"></i>导出 ${period()}</a></div>`).join('')}</div><div class="text-xs text-slate-400 mt-3">导出需登录态（Cookie）；申报表与完税凭证请在平台合规申报中心下载。</div>`)}
  </div>`;
  const byLayer = l => periods.map(p => r.payroll.filter(x => x.period === p && x.layer === l).reduce((s, x) => s + x.cost, 0));
  chart('rc-cost', { type: 'bar', data: { labels: periods, datasets: [{ label: '核心层', data: byLayer('core'), backgroundColor: '#2f5bea' }, { label: '弹性层', data: byLayer('flex'), backgroundColor: '#f59e0b' }, { label: '任务层', data: byLayer('task'), backgroundColor: '#10b981' }] }, options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true } } } });
  chart('rc-settle', { type: 'line', data: { labels: r.settle.map(x => x.period), datasets: [{ label: '结算额', data: r.settle.map(x => x.amt), borderColor: '#2f5bea', tension: .3 }, { label: '预扣个税', data: r.settle.map(x => x.iit), borderColor: '#ef4444', tension: .3 }, { label: '服务费', data: r.settle.map(x => x.fee), borderColor: '#f59e0b', tension: .3 }] }, options: { plugins: { legend: { position: 'bottom' } } } });
};

/* ---------------- 企业设置 ---------------- */
VIEWS.settings = async () => {
  const { data: p } = await eapi.get('/profile');
  const sc = p.social_config;
  $('#view').innerHTML = `<div class="grid lg:grid-cols-2 gap-4">
    ${card('企业信息', `<div class="grid md:grid-cols-2 gap-3">${input('s-name', '企业名称', p.name)}${input('s-code', '统一社会信用代码', p.credit_code || '', 'text', 'disabled')}${select('s-type', '纳税人身份（影响进项抵扣与成本对比）', [['general', '一般纳税人'], ['small', '小规模纳税人']], p.taxpayer_type)}${input('s-ind', '行业', p.industry)}${input('s-region', '地区（影响代征协议匹配）', p.region)}${input('s-contact', '联系人', p.contact_name)}${input('s-phone', '电话', p.contact_phone)}<div class="flex items-end"><div class="text-sm text-slate-500">平台服务费率 <b>${(p.service_rate * 100).toFixed(1)}%</b>（由平台设置）</div></div></div><div class="mt-4">${btn('保存', 'primary', 'id="s-save"')}</div>`)}
    ${card('社保公积金参数（核心层计薪依据）', `<div class="grid grid-cols-3 gap-2 text-sm"><div class="text-xs text-slate-500">险种</div><div class="text-xs text-slate-500">个人比例</div><div class="text-xs text-slate-500">单位比例</div>${[['pension', '养老'], ['medical', '医疗'], ['unemployment', '失业'], ['injury', '工伤'], ['maternity', '生育'], ['housing', '公积金']].map(([k, n]) => `<div class="py-1">${n}</div><input data-sp="${k}" value="${sc[k].p}" step="0.001" type="number" class="border rounded px-2 py-1"><input data-se="${k}" value="${sc[k].e}" step="0.001" type="number" class="border rounded px-2 py-1">`).join('')}</div><div class="grid grid-cols-2 gap-3 mt-3">${input('s-bmin', '缴费基数下限', sc.base_min, 'number')}${input('s-bmax', '缴费基数上限', sc.base_max, 'number')}</div><div class="mt-3">${btn('保存参数', 'primary', 'id="s-social"')}</div><div class="text-xs text-slate-400 mt-2">按当地人社/公积金中心公布的年度比例与基数填写；修改后下期试算生效。</div>`)}
  </div>
  <div class="mt-4">${card('批量导入人员（CSV）', `<p class="text-sm text-slate-600">列顺序：<code>姓名,身份证,手机,层级(core/flex/task),用工形态(fulltime/parttime/dispatch/outsource/platform),岗位,部门,月薪,时薪,社保基数,公积金基数,专项附加,入职日期</code>。第一行为表头将自动跳过。任务层人员会与在职员工比对身份证（老员工转灵工拦截）。</p><div class="mt-3 flex items-center gap-3"><input type="file" id="imp-file" accept=".csv,text/csv" class="text-sm"><a href="data:text/csv;charset=utf-8,%EF%BB%BF姓名,身份证,手机,层级,用工形态,岗位,部门,月薪,时薪,社保基数,公积金基数,专项附加,入职日期%0A示例·李四,440301199001011234,13800000000,core,fulltime,运营专员,运营部,12000,0,12000,12000,1000,2026-01-01" download="人员导入模板.csv" class="text-sm text-brand-600 underline">下载模板</a></div><div id="imp-preview" class="mt-3"></div>`)}</div>`;
  $('#s-save').onclick = async () => { await eapi.put('/profile', { name: v('s-name'), taxpayer_type: v('s-type'), industry: v('s-ind'), region: v('s-region'), contact_name: v('s-contact'), contact_phone: v('s-phone') }); toast('已保存'); };
  $('#s-social').onclick = async () => { const cfg = { base_min: num('s-bmin'), base_max: num('s-bmax') }; ['pension', 'medical', 'unemployment', 'injury', 'maternity', 'housing'].forEach(k => cfg[k] = { p: +$(`[data-sp="${k}"]`).value, e: +$(`[data-se="${k}"]`).value }); await eapi.put('/profile', { social_config: cfg }); toast('社保参数已保存，下期试算生效'); };
  $('#imp-file').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; const text = await f.text();
    const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter(l => l.trim());
    const keys = ['name', 'id_no', 'phone', 'layer', 'employment_type', 'position', 'department', 'base_salary', 'hourly_rate', 'social_base', 'housing_base', 'special_deduction', 'start_date'];
    const rows = lines.slice(/姓名/.test(lines[0]) ? 1 : 0).map(l => { const c = l.split(',').map(x => x.trim().replace(/^"|"$/g, '')); return Object.fromEntries(keys.map((k, i) => [k, c[i] || ''])); }).filter(r => r.name);
    $('#imp-preview').innerHTML = table(['姓名', '层级', '形态', '岗位', '月薪'], rows.slice(0, 20).map(r => [esc(r.name), r.layer, r.employment_type, esc(r.position), r.base_salary])) + `<div class="mt-2 text-sm">共 ${rows.length} 行 ${btn('确认导入', 'primary', 'id="imp-go"')}</div>`;
    $('#imp-go').onclick = async () => { const { data } = await eapi.post('/employees/import', { rows }); toast(`导入 ${data.ok} 人${data.skipped.length ? '，跳过：' + data.skipped.join('、') : ''}`, data.skipped.length ? 'warn' : 'success'); location.hash = 'employees'; };
  };
};
Object.assign(HELP.enterprise, { reportcenter: ['经营报表', '年度用工成本、平台结算、节省对比、部门分布，以及 CSV 导出。', ['切换顶部期间可导出对应月份', '导出 CSV 可直接导入财务系统']], settings: ['企业设置', '企业信息、纳税人身份、社保公积金比例与基数、人员批量导入。', ['先下载模板再导入', '社保参数修改后下期试算生效']], reports: ['AI 报告', 'Agent 输出沉淀为报告资产，含存证哈希，可打印导出。', ['在 Agent 结果上点「保存为报告」']] });
