/* 云工智合佳 · 体验引导层
 * 1) Spotlight 聚光灯：在真实界面元素上打光 + 气泡说明
 * 2) 布局地图：首次进入先讲"这个界面长什么样、每块干嘛"
 * 3) 角色漫游：按工作流程逐页带看（替代旧的纯文字弹窗 TOUR）
 * 4) 操作教练 Playbook：在真实页面上一步步让用户自己点，监听完成后自动推进
 */
(function () {
  const ROLE = window.__ROLE__;
  const ROLE_NAME = { enterprise: '企业 HR / 财务', admin: '平台合规运营', opc: '超级个体 / OPC', worker: '灵活就业者' }[ROLE] || '';

  /* ---------------- Spotlight 引擎 ---------------- */
  const SP = { el: null, steps: [], i: 0, onDone: null, waiting: null };
  function ensureOverlay() {
    if (SP.el) return SP.el;
    const o = document.createElement('div');
    o.id = 'spotlight';
    o.innerHTML = `<div id="sp-mask"></div><div id="sp-hole"></div><div id="sp-pop" role="dialog"></div>`;
    document.body.appendChild(o);
    SP.el = o;
    return o;
  }
  function rectOf(sel) {
    if (!sel) return null;
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return null;
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, el };
  }
  function place(step) {
    const o = ensureOverlay(); o.classList.add('on');
    const hole = o.querySelector('#sp-hole'), pop = o.querySelector('#sp-pop');
    const r = rectOf(step.target);
    const pad = 8;
    const mask = o.querySelector('#sp-mask');
    if (r) {
      hole.style.display = 'block';
      const x1 = r.x - pad, y1 = r.y - pad, x2 = r.x + r.w + pad, y2 = r.y + r.h + pad;
      Object.assign(hole.style, { left: x1 + 'px', top: y1 + 'px', width: x2 - x1 + 'px', height: y2 - y1 + 'px' });
      // 遮罩挖洞：洞内可点击真实元素，洞外被拦截
      mask.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`;
    } else { hole.style.display = 'none'; mask.style.clipPath = 'none'; }
    const total = SP.steps.length, i = SP.i;
    pop.innerHTML = `
      <div class="flex items-center justify-between text-xs text-slate-400"><span>${step.kicker || ROLE_NAME}</span><span>${i + 1} / ${total}</span></div>
      <div class="font-bold text-base mt-1">${step.title}</div>
      <div class="text-sm text-slate-600 mt-2 leading-relaxed">${step.text}</div>
      ${step.wait ? `<div class="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2"><i class="fas fa-hand-pointer mr-1"></i>${step.waitHint || '请在高亮处完成操作，完成后自动进入下一步'}</div>` : ''}
      <div class="flex items-center justify-between mt-4">
        <button class="text-xs text-slate-400 hover:text-slate-700" data-sp="skip">退出引导</button>
        <div class="flex gap-2">
          ${i > 0 ? '<button class="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50" data-sp="prev">上一步</button>' : ''}
          ${step.wait ? '<button class="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50" data-sp="next">跳过此步</button>' : `<button class="text-sm px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700" data-sp="next">${i === total - 1 ? (step.doneText || '完成') : '下一步'}</button>`}
        </div>
      </div>`;
    // 位置：优先放在目标右侧/下方，否则屏幕居中
    const pw = 360, ph = pop.offsetHeight || 220, vw = innerWidth, vh = innerHeight;
    let left, top;
    if (r) {
      if (r.x + r.w + pw + 24 < vw) { left = r.x + r.w + 16; top = Math.min(Math.max(12, r.y), vh - ph - 12); }
      else if (r.y + r.h + ph + 24 < vh) { left = Math.min(Math.max(12, r.x), vw - pw - 12); top = r.y + r.h + 16; }
      else if (r.y - ph - 24 > 0) { left = Math.min(Math.max(12, r.x), vw - pw - 12); top = r.y - ph - 16; }
      else { left = Math.max(12, r.x - pw - 16); top = Math.min(Math.max(12, r.y), vh - ph - 12); }
    } else { left = (vw - pw) / 2; top = (vh - ph) / 2; }
    Object.assign(pop.style, { left: left + 'px', top: top + 'px', width: pw + 'px' });
    pop.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => ({ skip: stop, prev: () => go(SP.i - 1), next: () => go(SP.i + 1) }[b.dataset.sp]()));
    // 等待型步骤：监听目标被点击 / 指定事件
    clearWait();
    if (step.wait && r) {
      const handler = () => { setTimeout(() => go(SP.i + 1), step.waitDelay ?? 600); };
      const evName = step.wait === true ? 'click' : step.wait;
      r.el.addEventListener(evName, handler, { once: true });
      SP.waiting = { el: r.el, evName, handler };
    }
  }
  function clearWait() { if (SP.waiting) { SP.waiting.el.removeEventListener(SP.waiting.evName, SP.waiting.handler); SP.waiting = null; } }
  async function go(i) {
    clearWait();
    if (i < 0) i = 0;
    if (i >= SP.steps.length) { const cb = SP.onDone; stop(); cb && cb(); return; }
    SP.i = i;
    const step = SP.steps[i];
    if (step.view && location.hash.slice(1).split('?')[0] !== step.view) { location.hash = step.view; await waitFor(() => !document.querySelector('#view .fa-spinner'), 2500); await sleep(150); }
    if (step.before) { try { await step.before(); } catch (e) { } }
    if (step.target) await waitFor(() => document.querySelector(step.target), step.targetTimeout ?? 2500);
    place(step);
  }
  function stop() { clearWait(); if (SP.el) SP.el.classList.remove('on'); SP.steps = []; SP.onDone = null; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function waitFor(fn, timeout = 2000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { try { if (fn()) return true; } catch (e) { } await sleep(80); } return false; }
  function run(steps, onDone) { stop(); SP.steps = steps; SP.onDone = onDone || null; go(0); }
  addEventListener('resize', () => { if (SP.el && SP.el.classList.contains('on') && SP.steps[SP.i]) place(SP.steps[SP.i]); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && SP.el?.classList.contains('on')) stop(); });

  /* ---------------- 布局地图：界面每一块是干嘛的 ---------------- */
  const LAYOUT_STEPS = [
    { kicker: '界面布局', title: `欢迎，${window.__USER__?.display_name || ''}`, text: `这是「${{ enterprise: '企业用工管理', admin: '平台合规后台', opc: 'OPC 一站式经营舱', worker: '灵活就业者工作台' }[ROLE]}」。先用 1 分钟认识界面的 6 个区域，然后我会按您的工作流程带您逐页走一遍。` },
    { target: '#sidebar', title: '① 左侧导航', text: '所有功能入口。分为「业务」「AI 赋能」「管理」几组，当前页面高亮显示。您每月常用的就前 3-4 项。' },
    { target: '#flow-bar', title: '② 主流程条', text: '整条业务链（企业入驻 → … → 凭证归档）走到哪一步。绿色已完成，蓝色是当前，带 🔒 的是别的角色负责——点任一步直达对应页面。' },
    { target: '#todo-btn', title: '③ 待办', text: '最重要的按钮。系统按本期必须做的事排好序，红/黄/蓝分级，点一条直达处理页。不知道做什么时就点它。' },
    { target: '#help-btn', title: '④ 这页怎么用', text: '每个页面都有：这页是干嘛的 + 操作步骤。换页后再点一次就是新页面的说明。' },
    { target: '#coach-btn', title: '⑤ 操作教练', text: '手把手模式：在真实页面上高亮按钮，等您自己点完再进入下一步。想真正学会就用它。' },
    { target: '#global-period', title: '⑥ 期间选择', text: '薪酬、申报、报表都按"期间"（月）组织。切换期间，所有页面数据跟着变。' },
    { target: '#cw-assistant-btn', title: '右下角 · AI 助手', text: '随时问："我该先做什么？" "怎么发工资？" "这个红色是什么意思？"——它会回答并直接帮您跳到对应功能、打开对应教练。', targetTimeout: 1500 },
    { title: '接下来', text: '我按您的角色把核心流程走一遍（约 1 分钟，可随时退出）。之后任何时候点右上角「新手引导」都可以重看。', doneText: '开始流程漫游' },
  ];

  /* ---------------- 角色漫游：逐页带看（带高亮） ---------------- */
  const WALK = {
    enterprise: [
      { view: 'dashboard', target: '#view', title: '用工驾驶舱', text: '一眼看清本期用工成本、三层结构是否健康、任务与结算进度。下方有「一键跑通演示流程」可以让系统自动演一遍。' },
      { view: 'employees', target: '#add-emp', title: '第 1 步 · 三层用工结构', text: '把人分成核心层（劳动合同）/ 弹性层（非全日制·外包）/ 任务层（平台灵工）。层级决定怎么算税。点这里新增人员。' },
      { view: 'tasks', target: '#add-task', title: '第 2 步 · 发布任务', text: '需要兼职时按成果计价发布任务。AI 先打分：绿放行 / 黄复核 / 红拦截——红色是在保护您。旁边「AI 帮我拆解定价」可以让 Agent 先把需求拆成任务包。' },
      { view: 'tasks', target: '#view table', title: '第 3 步 · 签约与验收', text: '从业人员申请后在「订单」里确认签约；对方交付后点「验收通过」。只有验收金额才会进入结算——这就是"真交付"证据。' },
      { view: 'payroll', target: '#view', title: '第 4 步 · 算薪发放', text: '每层四步：试算 → 生成批次 → 审批 → 发放。任务层发放后平台自动代扣代缴并生成申报草稿与凭证包。' },
      { view: 'settlements', target: '#view table', title: '第 5 步 · 拿凭证包', text: '每笔结算自动生成五流合一凭证包（合同·业务·资金·票据·个税），点「五流合一」查看，「导出审计包」留档。这是税前扣除的依据。' },
      { view: 'ai', target: '#view', title: 'AI 数字员工', text: '15 个 Agent：合规诊断、任务拆解定价、智能合同、税负解读…… 输出可以「保存为报告」或「一键创建为任务草稿」。' },
      { view: 'reportcenter', target: '#view', title: '经营报表', text: '月底看成本结构、结算趋势、部门分布与节省测算，一键导出 CSV。', doneText: '开始使用' },
    ],
    admin: [
      { view: 'dashboard', target: '#view', title: '平台总览', text: '企业、人员、GMV、待办申报、待复核任务——先看右上角「待办」。' },
      { view: 'enterprises', target: '#add-ent', title: '第 1 步 · 企业入驻', text: '尽调准入、设置纳税人身份与服务费率、开通企业账号。' },
      { view: 'workers', target: '#view table', title: '第 2 步 · 从业人员实名', text: '未实名不可签约（16号公告强制）。对未核验人员点「发起核验」。' },
      { view: 'risk', target: '#view', title: '第 3 步 · 风控复核', text: '企业发布的黄色任务在这里等您复核；红色已自动拦截。点「因子」看评分依据，决定会留痕。' },
      { view: 'filings', target: '#view table', title: '第 4 步 · 申报复核与提交', text: '企业发薪后草稿自动出现。点「复核」（规则引擎重算校验）→「提交申报」拿回执。' },
      { view: 'collection', target: '#view', title: '第 5 步 · 代征解缴出凭证', text: '查看代征税款，提交增值税代办申报后变为"已解缴"，点「出具代征凭证」完成闭环。' },
      { view: 'gateway', target: '#view', title: '算力网关', text: '在这里粘贴 DeepSeek / 算力网 / 平台托管 Key，点「测试连通」。接入后全平台 15 个 Agent 变成真实大模型。', doneText: '开始使用' },
    ],
    opc: [
      { view: 'dashboard', target: '#view', title: '经营舱', text: '一人公司的财务仪表盘：收入成本趋势、客户集中度、四道防火墙、税务路径推荐。' },
      { view: 'income', target: '#add-inc', title: '第 1 步 · 记账', text: '记录每笔收入（含开票）和成本（须有凭证）。' },
      { view: 'payroll', target: '#s-dry', title: '第 2 步 · 给自己发钱', text: '工资计入成本（省 5% 企业所得税），分红按 20%。输入后先「试算」看综合税负，再生成薪酬单。' },
      { view: 'tax', target: '#view', title: '第 3 步 · 看税', text: '本月增值税（10 万起征点）与所得税，以及三阶路径对比。' },
      { view: 'growth', target: '#view', title: '三阶跃迁', text: '自然人 → 个体户 → 一人公司，什么时候升级最划算，前提是真实经营。', doneText: '开始使用' },
    ],
    worker: [
      { view: 'home', target: '#view', title: '我的首页', text: '任务进度、本年收入、下一步要做的事。只需做三件事：实名、接单、交付。' },
      { view: 'home', target: '#do-verify, #view', title: '第 1 步 · 实名', text: '1 分钟完成人脸活体与三要素核验，并签署代办申报授权。未实名不能签约。', targetTimeout: 800 },
      { view: 'hall', target: '#view', title: '第 2 步 · 接单', text: '所有任务按成果计价、经过平台风控放行。点「申请接单」，等企业确认。' },
      { view: 'orders', target: '#view', title: '第 3 步 · 交付', text: '对"已签约"任务点「提交交付」，系统自动存证；企业验收后进入结算。' },
      { view: 'income', target: '#view', title: '收入与凭证', text: '每笔到手金额、预扣税款与完税凭证。' },
      { view: 'tax', target: '#view', title: '我的税负', text: '累计预扣法帮您省了多少，与传统劳务按次预扣对比。', doneText: '开始使用' },
    ],
  };

  /* ---------------- 操作教练 Playbooks：在真实页面上让用户自己点 ---------------- */
  const PLAYBOOKS = {
    enterprise: {
      payroll: { name: '发一次工资', steps: [
        { view: 'payroll', target: '[data-calc]', title: '1. 点「试算」', text: '选一层（建议核心层）点「试算」，系统按累计预扣法 + 五险一金计算每个人。', wait: true },
        { target: '#dry', title: '2. 试算（不保存）', text: '先看结果和公式，确认无误。', wait: true, targetTimeout: 3000 },
        { target: '#save', title: '3. 生成批次', text: '把试算结果固化为一个薪酬批次。', wait: true },
        { view: 'payroll', target: '[data-approve]', title: '4. 审批', text: '对刚生成的批次点「审批」。', wait: true, targetTimeout: 3000 },
        { target: '[data-pay]', title: '5. 发放', text: '发放后：任务层自动生成结算记录、委托代征记录与凭证包；申报草稿推送到平台。', wait: true, targetTimeout: 3000 },
        { view: 'settlements', target: '#view table', title: '完成 ✓ 去看凭证包', text: '发放完成。这里每一笔都有五流合一凭证包，点「五流合一」查看。', doneText: '完成' },
      ] },
      tasks: { name: '发布一个任务', steps: [
        { view: 'tasks', target: '#add-task', title: '1. 点「发布任务」', text: '任务必须按成果计价（按件 / 项目 / 里程碑），不要写"坐班""月薪"。', wait: true },
        { target: '#t-assess', title: '2. 先「AI 预评估」', text: '填好标题、描述、计价后点预评估，看劳动关系风险评分。', wait: true, targetTimeout: 3000 },
        { target: '#t-save', title: '3. 发布', text: '绿色直接发布；黄色进入平台复核；红色会被拦截并给出改造建议。', wait: true, targetTimeout: 3000 },
        { view: 'tasks', target: '#view table', title: '完成 ✓', text: '任务已在列表中。从业人员申请后，在「订单」里确认签约。', doneText: '完成' },
      ] },
      ai: { name: '用 AI 拆解一个需求并生成任务草稿', steps: [
        { view: 'ai', target: '[data-agent="task_pricer"], #view', title: '1. 打开「任务拆解定价师」', text: '在 Agent 卡片里找到「任务拆解定价师」点「运行」。', wait: true, targetTimeout: 3000 },
        { target: '#in-run', title: '2. 填需求 → 运行', text: '写清楚要做什么、数量、周期、预算，点「运行」。模型会流式输出任务包表格。', wait: true, targetTimeout: 3000 },
        { target: '#act-tasks', title: '3. 一键创建为任务草稿', text: '等输出完成后点这里，系统解析表格 → 自动风控评分 → 生成草稿。', wait: true, targetTimeout: 90000, waitHint: '等待 AI 输出完成后，点击高亮按钮' },
        { target: '#ct-go', title: '4. 确认创建', text: '确认任务清单。', wait: true, targetTimeout: 5000 },
        { view: 'tasks', target: '[data-publish], #view table', title: '完成 ✓ 发布草稿', text: '草稿已在「任务与交付」。对绿色草稿点「发布」即可上架。', doneText: '完成', targetTimeout: 3000 },
      ] },
      employees: { name: '新增一名人员', steps: [
        { view: 'employees', target: '#add-emp', title: '1. 点「新增人员」', text: '', wait: true },
        { target: '#f-save', title: '2. 选层级与用工形态后保存', text: '核心层 = 劳动合同；弹性层 = 非全日制 / 派遣 / 外包；任务层由签约自动带入。', wait: true, targetTimeout: 3000 },
        { view: 'employees', target: '#view table', title: '完成 ✓', text: '人员已进入对应层，下次发薪会包含在内。', doneText: '完成' },
      ] },
    },
    admin: {
      filings: { name: '完成一次申报', steps: [
        { view: 'filings', target: '[data-review]', title: '1. 复核草稿', text: '点任一草稿的「复核」，规则引擎会重算并比对一致性。', wait: true, targetTimeout: 3000 },
        { view: 'filings', target: '[data-submit]', title: '2. 提交申报', text: '复核通过后点「提交申报」，获得受理回执。', wait: true, targetTimeout: 4000, before: () => closeModal && closeModal() },
        { view: 'collection', target: '#view', title: '完成 ✓ 去代征解缴', text: '增值税代办申报提交后，代征记录自动变为"已解缴"，在这里出具凭证。', doneText: '完成' },
      ] },
      risk: { name: '复核一个黄色任务', steps: [
        { view: 'risk', target: '[data-pass], [data-block], #view table', title: '1. 对黄色任务做决定', text: '点「放行」或「拦截」并填写说明；决定会写入审计日志。', wait: true, targetTimeout: 3000 },
        { view: 'risk', target: '#view', title: '完成 ✓', text: '企业端任务状态同步更新。', doneText: '完成' },
      ] },
      gateway: { name: '接入真实大模型 Key', steps: [
        { view: 'gateway', target: '#view', title: '1. 找到供应商卡片', text: '推荐先接 DeepSeek 官方（境内备案池，涉税 Agent 必须走境内）。粘贴 Key 到输入框。' },
        { target: '[data-check], #view', title: '2. 测试连通', text: '点「测试连通」，系统真实发一条最小请求；成功后自动置为"已启用"。', wait: true, targetTimeout: 3000 },
        { title: '完成 ✓', text: '现在企业端 / OPC / 从业人员的 Agent 都会显示"已接入真实算力"。', doneText: '完成' },
      ] },
    },
    opc: {
      payroll: { name: '给自己发一次工资 + 分红', steps: [
        { view: 'payroll', target: '#s-dry', title: '1. 输入工资与分红 → 试算', text: '看综合税负与系统提示（工资计入成本，分红 20%）。', wait: true },
        { target: '#s-save', title: '2. 生成薪酬单', text: '', wait: true, targetTimeout: 3000 },
        { view: 'payroll', target: '[data-pay]', title: '3. 发放并生成申报', text: '', wait: true, targetTimeout: 3000 },
        { view: 'tax', target: '#view', title: '完成 ✓', text: '去「税务测算」看本月增值税与所得税。', doneText: '完成' },
      ] },
      income: { name: '记一笔收入', steps: [
        { view: 'income', target: '#add-inc', title: '1. 点「记一笔收入」', text: '', wait: true },
        { target: '#i-save', title: '2. 填客户、项目、金额、发票 → 保存', text: '只就真实业务开票。', wait: true, targetTimeout: 3000 },
        { view: 'income', target: '#view', title: '完成 ✓', text: '', doneText: '完成' },
      ] },
    },
    worker: {
      hall: { name: '接一个任务', steps: [
        { view: 'hall', target: '[data-apply]', title: '1. 点「申请接单」', text: '任务都按成果计价、经过风控放行。', wait: true, targetTimeout: 3000 },
        { view: 'orders', target: '#view', title: '2. 等企业确认', text: '企业确认后会出现在「我的任务」，状态为"已签约"。', doneText: '完成' },
      ] },
      orders: { name: '提交一次交付', steps: [
        { view: 'orders', target: '[data-deliver]', title: '1. 点「提交交付」', text: '', wait: true, targetTimeout: 3000 },
        { target: '#d-go', title: '2. 填完成数量与说明 → 提交', text: '系统自动对交付物做哈希存证。', wait: true, targetTimeout: 3000 },
        { view: 'income', target: '#view', title: '完成 ✓', text: '企业验收并发放后，在这里看到手金额与凭证。', doneText: '完成' },
      ] },
    },
  };

  /* ---------------- 对外 API ---------------- */
  function startLayoutTour() { run(LAYOUT_STEPS, () => startWalk()); }
  function startWalk() { const w = WALK[ROLE]; if (!w) return; run(w, () => markOnboarded()); }
  function startPlaybook(key) {
    const pb = PLAYBOOKS[ROLE]?.[key];
    if (!pb) { toast('该页面暂无操作教练，试试「这页怎么用」', 'info'); return false; }
    run(pb.steps.map(s => ({ ...s, kicker: `操作教练 · ${pb.name}` })));
    return true;
  }
  function listPlaybooks() { return Object.entries(PLAYBOOKS[ROLE] || {}).map(([k, v]) => ({ key: k, name: v.name })); }
  function coachMenu() {
    const cur = (location.hash || '#' + DEFAULT_VIEW).slice(1).split('?')[0];
    const items = listPlaybooks();
    if (!items.length) return toast('当前角色暂无操作教练', 'info');
    modal('<i class="fas fa-hand-pointer text-emerald-600 mr-2"></i>操作教练 · 选一个任务，我在真实页面上带您做', `<div class="grid md:grid-cols-2 gap-3">${items.map(it => `<button data-pb="${it.key}" class="text-left rounded-xl border p-4 hover:border-emerald-500 hover:bg-emerald-50 ${it.key === cur ? 'border-emerald-500 bg-emerald-50' : ''}"><div class="font-semibold text-sm">${it.name}</div><div class="text-xs text-slate-500 mt-1">${PLAYBOOKS[ROLE][it.key].steps.length} 步 · 在「${$(`.nav-item[data-view="${it.key}"]`)?.textContent.trim() || it.key}」页</div></button>`).join('')}</div><div class="text-xs text-slate-400 mt-4">教练会高亮按钮并等您点击；随时按 Esc 或「退出引导」结束。</div>`, { footer: btn('关闭', 'ghost', 'onclick="closeModal()"') });
    $$('[data-pb]').forEach(b => b.onclick = () => { closeModal(); startPlaybook(b.dataset.pb); });
  }
  async function markOnboarded() { try { await api.post('/auth/onboarded'); } catch (e) { } localStorage.setItem('cw_tour_' + ROLE, '1'); }

  window.CWTour = { run, stop, startLayoutTour, startWalk, startPlaybook, listPlaybooks, coachMenu, isActive: () => !!(SP.el && SP.el.classList.contains('on')), spotlight: (target, title, text) => run([{ target, title, text, doneText: '知道了' }]) };

  // 接管旧按钮：新手引导 → 布局地图 + 漫游；操作教练按钮
  const tourBtn = $('#tour-btn'); if (tourBtn) tourBtn.onclick = startLayoutTour;
  const coachBtn = $('#coach-btn'); if (coachBtn) coachBtn.onclick = coachMenu;
  window.startTour = startLayoutTour; // 兼容 common.js 的首次自动触发
})();
