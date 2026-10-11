/**
 * 劳动关系风险 AI 评分卡（全案 4.1）
 * 满分100，分数越高风险越大。0-39 绿 / 40-69 黄 / ≥70 红
 * 维度：人格从属25 · 经济从属20 · 组织从属20 · 工作时间15 · 交付计价10 · 身份迁移10（命中一票否决）
 */
export interface RiskInput {
  title?: string
  description?: string
  pricing_mode?: string      // piece / project / milestone / time
  category?: string
  requires_attendance?: boolean   // 坐班/打卡
  subject_to_rules?: boolean      // 遵守企业规章/奖惩
  fixed_monthly_pay?: boolean     // 固定月薪
  income_concentration?: number   // 0-1 来自单一客户收入占比
  core_business?: boolean         // 核心主营岗位
  uses_company_identity?: boolean // 工牌/邮箱
  daily_hours?: number
  weekly_hours?: number
  long_term?: boolean             // 长期固定
  has_deliverable?: boolean
  is_former_employee?: boolean    // 在职或3个月内离职员工
}

export interface RiskFactor { dimension: string; weight: number; score: number; signal: string; evidence: string }

const KW = {
  attendance: ['坐班', '打卡', '考勤', '在岗', '上下班', '9:00', '朝九晚五', '全职'],
  rules: ['规章', '奖惩', '罚款', '服从', '汇报', '绩效考核', '领导安排', '部门管理'],
  fixedPay: ['月薪', '固定工资', '底薪', '每月固定'],
  identity: ['工牌', '企业邮箱', '入职', '员工', '部门', '岗位'],
  longTerm: ['长期', '常驻', '驻场', '全年'],
}
const hit = (text: string, list: string[]) => list.filter(k => text.includes(k))

export function scoreLaborRisk(i: RiskInput) {
  const text = `${i.title || ''} ${i.description || ''} ${i.category || ''}`
  const factors: RiskFactor[] = []

  // 1 人格从属 25
  {
    const kws = [...hit(text, KW.attendance), ...hit(text, KW.rules)]
    let s = 0, sig: string[] = []
    if (i.requires_attendance || hit(text, KW.attendance).length) { s += 15; sig.push('要求坐班/打卡') }
    if (i.subject_to_rules || hit(text, KW.rules).length) { s += 10; sig.push('受规章/奖惩约束') }
    factors.push({ dimension: '人格从属', weight: 25, score: Math.min(25, s), signal: sig.join('、') || '无', evidence: kws.length ? `命中关键词：${kws.join('/')}` : '按成果交付、不受考勤约束' })
  }
  // 2 经济从属 20
  {
    let s = 0, sig: string[] = []
    if (i.fixed_monthly_pay || i.pricing_mode === 'time' || hit(text, KW.fixedPay).length) { s += 12; sig.push('固定月薪/按时间计价') }
    const c = i.income_concentration ?? 0
    if (c > 0.8) { s += 8; sig.push(`单一客户收入占比${Math.round(c*100)}%`) } else if (c > 0.6) { s += 4; sig.push(`客户集中度${Math.round(c*100)}%`) }
    factors.push({ dimension: '经济从属', weight: 20, score: Math.min(20, s), signal: sig.join('、') || '无', evidence: `计价方式：${i.pricing_mode || '未知'}` })
  }
  // 3 组织从属 20
  {
    let s = 0, sig: string[] = []
    if (i.core_business) { s += 10; sig.push('核心主营长期岗位') }
    if (i.uses_company_identity || hit(text, KW.identity).length) { s += 10; sig.push('使用企业工牌/邮箱') }
    factors.push({ dimension: '组织从属', weight: 20, score: Math.min(20, s), signal: sig.join('、') || '无', evidence: hit(text, KW.identity).length ? `命中：${hit(text, KW.identity).join('/')}` : '任务独立于企业组织体系' })
  }
  // 4 工作时间 15
  {
    let s = 0, sig: string[] = []
    const dh = i.daily_hours ?? 0, wh = i.weekly_hours ?? 0
    if (dh > 4) { s += 7; sig.push(`日均${dh}小时>4小时`) }
    if (wh > 24) { s += 5; sig.push(`周${wh}小时>24小时`) }
    if (i.long_term || hit(text, KW.longTerm).length) { s += 3; sig.push('长期固定') }
    if (/\d{1,2}:\d{2}\s*[-~至—]\s*\d{1,2}:\d{2}/.test(text)) { s = Math.max(s, 12); sig.push('描述含固定工作时段') }
    factors.push({ dimension: '工作时间', weight: 15, score: Math.min(15, s), signal: sig.join('、') || '无', evidence: '非全日制标准：日均≤4小时、周≤24小时' })
  }
  // 5 交付计价 10
  {
    let s = 0, sig: string[] = []
    if (i.pricing_mode === 'time') { s += 6; sig.push('以时间计价') }
    if (i.has_deliverable === false) { s += 4; sig.push('无验收物') }
    factors.push({ dimension: '交付计价', weight: 10, score: Math.min(10, s), signal: sig.join('、') || '按成果/件数/项目计价', evidence: i.has_deliverable === false ? '缺少可验证交付物' : '存在可验收交付标准' })
  }
  // 6 身份迁移 10（一票否决）
  const veto = !!i.is_former_employee
  factors.push({ dimension: '身份迁移', weight: 10, score: veto ? 10 : 0, signal: veto ? '命中：客户在职/3个月内离职员工（一票否决）' : '未命中', evidence: '同一身份证与客户社保/个税工资记录比对' })

  let score = factors.reduce((s, f) => s + f.score, 0)
  // 组合规则：坐班/打卡 + 固定月薪/按时间计价 = 典型事实劳动关系特征，直接升红
  const attendanceHit = i.requires_attendance || hit(text, KW.attendance).length > 0
  const fixedHit = i.fixed_monthly_pay || i.pricing_mode === 'time' || hit(text, KW.fixedPay).length > 0
  if (attendanceHit && fixedHit) score = Math.max(score, 75)
  if (veto) score = Math.max(score, 90)
  const level = score >= 70 ? 'red' : score >= 40 ? 'yellow' : 'green'
  const decision = level === 'red' ? 'block' : level === 'yellow' ? 'review' : 'pass'
  const advice = level === 'red'
    ? '禁止发布。建议客户采用劳动合同/非全日制/业务外包等合规替代方案；如为在职员工，一律不得以劳务报酬替代工资。'
    : level === 'yellow'
      ? '需补充任务说明、改为按成果计价并增加验收标准，提交人工复核后方可发布。'
      : '自动放行。请保证交付物可验证、资金单向流动，凭证包将自动归档。'
  return { score, level, decision, factors, advice, basis: '原劳动和社会保障部《关于确立劳动关系有关事项的通知》三要素；新就业形态劳动者权益保障指导意见；最高法劳动争议司法解释（二）', aiNote: 'AI辅助生成，经规则引擎校验；红/黄结果保留人工复核与申诉通道（PIPL第24条）' }
}

/** 企业用工结构体检（全案 5.2 三层优化模型） */
export function structureDiagnosis(employees: Array<{ layer: string; employment_type: string; base_salary: number; hourly_rate: number }>) {
  const total = employees.length || 1
  const cnt = (l: string) => employees.filter(e => e.layer === l).length
  const core = cnt('core'), flex = cnt('flex'), task = cnt('task')
  const dispatch = employees.filter(e => e.employment_type === 'dispatch').length
  const pct = (n: number) => Math.round(n / total * 1000) / 10
  const findings: Array<{ level: string; text: string }> = []
  if (pct(core) < 50) findings.push({ level: 'yellow', text: `核心层占比${pct(core)}%低于50%，警惕核心岗位过度灵活化带来的穿透认定风险` })
  if (pct(core) > 70) findings.push({ level: 'blue', text: `核心层占比${pct(core)}%偏高，阶段性/辅助性岗位可评估转入弹性层或任务层` })
  if (dispatch / total > 0.1) findings.push({ level: 'red', text: `劳务派遣占比${pct(dispatch)}%超过10%法定上限` })
  if (pct(task) > 30) findings.push({ level: 'yellow', text: `任务层占比${pct(task)}%超过建议上限30%，需逐一核验任务真实性与计价方式` })
  if (!findings.length) findings.push({ level: 'green', text: '三层结构处于建议区间（核心50-70%、弹性10-30%、任务10-30%）' })
  const score = Math.max(40, 100 - findings.filter(f => f.level === 'red').length * 25 - findings.filter(f => f.level === 'yellow').length * 10)
  return { total: employees.length, layers: { core: { count: core, pct: pct(core), target: '50%-70%' }, flex: { count: flex, pct: pct(flex), target: '10%-30%' }, task: { count: task, pct: pct(task), target: '10%-30%' } }, findings, score }
}
