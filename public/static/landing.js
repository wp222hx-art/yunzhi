const f = (n, d = 0) => Number(n).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
async function calcLabor() {
  const monthly = +document.getElementById('calc-labor-monthly').value || 8000;
  const { data } = await axios.post('/api/public/calc/labor', { monthly, months: 12 });
  document.getElementById('calc-labor-result').innerHTML = `
    <div class="grid grid-cols-2 gap-3"><div class="rounded-lg bg-slate-50 p-3"><div class="text-xs text-slate-500">传统劳务按次预扣 · 全年</div><div class="text-lg font-bold text-slate-700">¥${f(data.legacy_total)}</div></div>
    <div class="rounded-lg bg-emerald-50 p-3"><div class="text-xs text-emerald-700">平台累计预扣 · 全年</div><div class="text-lg font-bold text-emerald-600">¥${f(data.platform_total)}</div></div></div>
    <div class="mt-3 text-emerald-700 font-medium">预缴少缴 ¥${f(data.saving)}，到手更多</div>
    <div class="mt-2 text-xs text-slate-400">${data.note}</div>`;
}
async function calcEnt() {
  const payout = +document.getElementById('calc-ent-payout').value || 300000;
  const taxpayer_type = document.getElementById('calc-ent-type').value;
  const { data } = await axios.post('/api/public/calc/enterprise', { payout, taxpayer_type });
  document.getElementById('calc-ent-result').innerHTML = data.options.map((o, i) => `<div class="flex items-center justify-between py-2 border-b border-slate-100 ${i === 2 ? 'text-brand-700 font-semibold' : ''}"><div><div>${o.name}</div><div class="text-xs text-slate-400 font-normal">风险：${o.risk}${o.extraCit ? ' · 不可扣除多缴企业所得税¥' + f(o.extraCit) : ''}</div></div><div>¥${f(o.net)}</div></div>`).join('') + `<div class="mt-3 text-xs text-slate-500">${data.insight}</div>`;
}
async function calcOpc() {
  const income = +document.getElementById('calc-opc-income').value || 600000;
  const { data } = await axios.post('/api/public/calc/opc', { income });
  document.getElementById('calc-opc-result').innerHTML = data.paths.map(p => `<div class="flex items-center justify-between py-2 border-b border-slate-100 ${p.key === data.recommend ? 'text-brand-700 font-semibold' : ''}"><span>${p.name}${p.key === data.recommend ? ' <i class="fas fa-star text-amber-400"></i>' : ''}</span><span>综合税负 ${p.rate}%</span></div>`).join('') + `<div class="mt-3 text-xs text-slate-600">${data.reason}</div><div class="mt-1 text-[11px] text-slate-400">${data.caveat}</div>`;
}
