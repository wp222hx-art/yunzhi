/**
 * 云工智合佳 · 确定性税务规则引擎
 * 原则：所有税额计算由规则引擎完成，大模型只负责解释与建议（"三不原则"）。
 * 政策基准日：2026-10-09
 */

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// ---------- 综合所得预扣率表（工资薪金累计预扣 / 劳务报酬累计预扣 / 年度汇算） ----------
export const COMPREHENSIVE_TABLE = [
  { limit: 36000, rate: 0.03, quick: 0 },
  { limit: 144000, rate: 0.10, quick: 2520 },
  { limit: 300000, rate: 0.20, quick: 16920 },
  { limit: 420000, rate: 0.25, quick: 31920 },
  { limit: 660000, rate: 0.30, quick: 52920 },
  { limit: 960000, rate: 0.35, quick: 85920 },
  { limit: Infinity, rate: 0.45, quick: 181920 },
]

// ---------- 经营所得税率表 ----------
export const BUSINESS_TABLE = [
  { limit: 30000, rate: 0.05, quick: 0 },
  { limit: 90000, rate: 0.10, quick: 1500 },
  { limit: 300000, rate: 0.20, quick: 10500 },
  { limit: 500000, rate: 0.30, quick: 40500 },
  { limit: Infinity, rate: 0.35, quick: 65500 },
]

// ---------- 传统劳务报酬预扣率表（非平台口径，用于对比） ----------
export const LABOR_LEGACY_TABLE = [
  { limit: 20000, rate: 0.20, quick: 0 },
  { limit: 50000, rate: 0.30, quick: 2000 },
  { limit: Infinity, rate: 0.40, quick: 7000 },
]

export const PARAMS = {
  basicDeduction: 5000,          // 每月基本减除费用
  laborExpenseRatio: 0.2,        // 劳务报酬费用扣除比例
  vatSmallThresholdMonth: 100000,// 小规模月销售额免征起征点（至2027-12-31）
  vatSmallRate: 0.01,            // 3%减按1%
  vatPerTimeThreshold: 1000,     // 自然人按次起征点
  surchargeRate: 0.06,           // 附加税费（12%减半）
  citSmallRate: 0.05,            // 小微企业实际税负（≤300万）
  citStandardRate: 0.25,
  dividendTaxRate: 0.20,
  businessHalfLimit: 2000000,    // 个体户200万以内减半
  registerGuideThreshold: 5000000,
}

export function bracket(table: typeof COMPREHENSIVE_TABLE, taxable: number) {
  const t = Math.max(0, taxable)
  const b = table.find(x => t <= x.limit) || table[table.length - 1]
  return { tax: r2(t * b.rate - b.quick), rate: b.rate, quick: b.quick }
}

// ======================================================================
// 1. 工资薪金累计预扣法（居民个人）
// ======================================================================
export interface WageCumInput {
  cumIncome: number           // 累计收入（含本期）
  cumInsurance: number        // 累计专项扣除（三险一金个人部分）
  cumSpecialDeduction: number // 累计专项附加扣除
  months: number              // 累计月数（本年任职月数）
  cumTaxPaid: number          // 累计已预扣预缴税额
  cumOtherDeduction?: number
}
export function wageCumulative(i: WageCumInput) {
  const cumBasic = PARAMS.basicDeduction * i.months
  const cumTaxable = Math.max(0, i.cumIncome - cumBasic - i.cumInsurance - i.cumSpecialDeduction - (i.cumOtherDeduction || 0))
  const { tax: cumTax, rate, quick } = bracket(COMPREHENSIVE_TABLE, cumTaxable)
  const tax = Math.max(0, r2(cumTax - i.cumTaxPaid))
  return { cumBasic, cumTaxable: r2(cumTaxable), cumTax, tax, rate, quick,
    formula: `累计应纳税所得额=${r2(i.cumIncome)}−${cumBasic}−${r2(i.cumInsurance)}−${r2(i.cumSpecialDeduction)}=${r2(cumTaxable)}；累计应预扣=${r2(cumTaxable)}×${rate*100}%−${quick}=${cumTax}；本期=${cumTax}−已预扣${r2(i.cumTaxPaid)}=${tax}` }
}

// ======================================================================
// 2. 劳务报酬累计预扣法（2025年第16号公告：平台从业人员）
// ======================================================================
export interface LaborCumInput {
  cumIncome: number     // 本年度在本平台累计劳务报酬收入（含本期）
  months: number        // 累计月数（自年初或首次取得收入月起）
  cumTaxPaid: number
  cumSpecialDeduction?: number
}
export function laborCumulative(i: LaborCumInput) {
  const cumRevenue = r2(i.cumIncome * (1 - PARAMS.laborExpenseRatio))
  const cumBasic = PARAMS.basicDeduction * i.months
  const cumTaxable = Math.max(0, cumRevenue - cumBasic - (i.cumSpecialDeduction || 0))
  const { tax: cumTax, rate, quick } = bracket(COMPREHENSIVE_TABLE, cumTaxable)
  const tax = Math.max(0, r2(cumTax - i.cumTaxPaid))
  return { cumRevenue, cumBasic, cumTaxable: r2(cumTaxable), cumTax, tax, rate, quick,
    formula: `累计收入额=${r2(i.cumIncome)}×80%=${cumRevenue}；减除${cumBasic}；应纳税所得额=${r2(cumTaxable)}；累计应预扣=${cumTax}；本期=${tax}` }
}

// 传统劳务报酬按次预扣（用于对比展示）
export function laborLegacy(amount: number) {
  let revenue: number
  if (amount <= 4000) revenue = Math.max(0, amount - 800)
  else revenue = amount * 0.8
  const { tax, rate, quick } = bracket(LABOR_LEGACY_TABLE, revenue)
  return { revenue: r2(revenue), tax, rate, quick }
}

// ======================================================================
// 3. 增值税代办申报（小规模/自然人口径）
// ======================================================================
export function vatAgent(monthSales: number, opts: { perTime?: boolean } = {}) {
  // 平台代办：按月合并全部销售额适用10万元标准，不得拆分
  if (opts.perTime) {
    if (monthSales < PARAMS.vatPerTimeThreshold) return { vat: 0, surcharge: 0, exempt: true, rule: '按次销售额未达1000元起征点，免征' }
  }
  if (monthSales <= PARAMS.vatSmallThresholdMonth) {
    return { vat: 0, surcharge: 0, exempt: true, rule: '月销售额≤10万元，免征增值税及附加（财税2026年第10号）' }
  }
  const taxBase = monthSales / (1 + 0.01) // 含税价换算（简化：按1%征收率价税分离）
  const vat = r2(taxBase * PARAMS.vatSmallRate)
  const surcharge = r2(vat * PARAMS.surchargeRate)
  return { vat, surcharge, exempt: false, rule: '月销售额>10万元，全额按3%减按1%征收（不得拆分）' }
}

// ======================================================================
// 4. 社保公积金
// ======================================================================
export interface SocialConfig {
  pension: { p: number; e: number }
  medical: { p: number; e: number }
  unemployment: { p: number; e: number }
  injury: { p: number; e: number }
  maternity: { p: number; e: number }
  housing: { p: number; e: number }
  base_min: number
  base_max: number
}
export const DEFAULT_SOCIAL: SocialConfig = {
  pension: { p: 0.08, e: 0.16 }, medical: { p: 0.02, e: 0.08 }, unemployment: { p: 0.005, e: 0.005 },
  injury: { p: 0, e: 0.002 }, maternity: { p: 0, e: 0.0045 }, housing: { p: 0.07, e: 0.07 },
  base_min: 2520, base_max: 30000,
}
export function socialInsurance(cfg: SocialConfig, socialBase: number, housingBase: number, opts: { injuryOnly?: boolean } = {}) {
  const clamp = (b: number) => Math.min(cfg.base_max, Math.max(cfg.base_min, b || 0))
  const sb = clamp(socialBase), hb = clamp(housingBase)
  if (opts.injuryOnly) {
    return { personal: 0, personalHousing: 0, employer: r2(sb * cfg.injury.e), employerHousing: 0, socialBase: sb, housingBase: hb,
      items: [{ name: '工伤保险', p: 0, e: r2(sb * cfg.injury.e) }] }
  }
  const items = [
    { name: '养老保险', p: r2(sb * cfg.pension.p), e: r2(sb * cfg.pension.e) },
    { name: '医疗保险', p: r2(sb * cfg.medical.p), e: r2(sb * cfg.medical.e) },
    { name: '失业保险', p: r2(sb * cfg.unemployment.p), e: r2(sb * cfg.unemployment.e) },
    { name: '工伤保险', p: 0, e: r2(sb * cfg.injury.e) },
    { name: '生育保险', p: 0, e: r2(sb * cfg.maternity.e) },
  ]
  const personal = r2(items.reduce((s, x) => s + x.p, 0))
  const employer = r2(items.reduce((s, x) => s + x.e, 0))
  const personalHousing = r2(hb * cfg.housing.p)
  const employerHousing = r2(hb * cfg.housing.e)
  return { personal, personalHousing, employer, employerHousing, socialBase: sb, housingBase: hb, items: [...items, { name: '住房公积金', p: personalHousing, e: employerHousing }] }
}

// ======================================================================
// 5. 经营所得（个体工商户，查账征收）
// ======================================================================
export function businessIncomeTax(annualRevenue: number, annualCost: number, specialDeduction = 0, opts: { halfPolicy?: boolean; basicDeduction?: number } = {}) {
  const basic = opts.basicDeduction ?? 60000
  const taxable = Math.max(0, annualRevenue - annualCost - basic - specialDeduction)
  const { tax: full, rate, quick } = bracket(BUSINESS_TABLE, taxable)
  let tax = full
  let reduction = 0
  if (opts.halfPolicy !== false) {
    // 年应纳税所得额不超过200万元部分减半
    const halfPart = Math.min(taxable, PARAMS.businessHalfLimit)
    reduction = r2(full * (taxable > 0 ? halfPart / taxable : 0) * 0.5)
    tax = r2(full - reduction)
  }
  return { taxable: r2(taxable), fullTax: full, reduction, tax, rate, quick,
    formula: `应纳税所得额=${r2(annualRevenue)}−${r2(annualCost)}−${basic}−${specialDeduction}=${r2(taxable)}；应纳税=${r2(taxable)}×${rate*100}%−${quick}=${full}；减半优惠−${reduction}；实缴${tax}` }
}

// ======================================================================
// 6. 企业所得税（小型微利 ≤300万：实际税负5%）
// ======================================================================
export function corporateIncomeTax(taxableProfit: number, opts: { smallMicro?: boolean } = {}) {
  const t = Math.max(0, taxableProfit)
  if (opts.smallMicro !== false && t <= 3000000) {
    return { tax: r2(t * PARAMS.citSmallRate), rate: PARAMS.citSmallRate, rule: '小型微利企业：减按25%计入应纳税所得额，按20%税率，实际5%' }
  }
  return { tax: r2(t * PARAMS.citStandardRate), rate: PARAMS.citStandardRate, rule: '一般企业25%' }
}

export function dividendTax(amount: number) {
  return r2(Math.max(0, amount) * PARAMS.dividendTaxRate)
}

// ======================================================================
// 7. 年度综合所得汇算（劳务报酬口径，用于三阶测算）
// ======================================================================
export function annualComprehensive(laborIncome: number, wageIncome = 0, insurance = 0, specialDeduction = 0) {
  const revenue = laborIncome * 0.8 + wageIncome
  const taxable = Math.max(0, revenue - 60000 - insurance - specialDeduction)
  const { tax, rate, quick } = bracket(COMPREHENSIVE_TABLE, taxable)
  return { revenue: r2(revenue), taxable: r2(taxable), tax, rate, quick }
}

// ======================================================================
// 8. OPC 三阶跃迁税负对比（与全案 8.3 口径一致）
// ======================================================================
export interface OpcCompareInput {
  annualIncome: number
  costRatio?: number       // 真实经营成本占比，默认30%
  ownerSalaryMonthly?: number // OPC股东月工资，默认6000
  bookkeepingFee?: number  // 年记账费，默认5000
  specialDeduction?: number
  ownerInsuranceMonthly?: number // 股东社保（个人部分），默认0
}
export function opcCompare(i: OpcCompareInput) {
  const income = i.annualIncome
  const costRatio = i.costRatio ?? 0.3
  const salary = (i.ownerSalaryMonthly ?? 6000) * 12
  const book = i.bookkeepingFee ?? 5000
  const sd = i.specialDeduction ?? 0
  const ins = (i.ownerInsuranceMonthly ?? 0) * 12
  const monthly = income / 12

  // L1 平台从业人员
  const vatL1 = vatAgent(monthly)
  const l1Tax = annualComprehensive(income, 0, 0, sd).tax
  const l1Total = r2(l1Tax + (vatL1.vat + vatL1.surcharge) * 12)

  // L2 个体户
  const cost = income * costRatio
  const vatL2 = vatAgent(monthly)
  const l2 = businessIncomeTax(income, cost, sd)
  const l2Total = r2(l2.tax + (vatL2.vat + vatL2.surcharge) * 12)

  // L3 OPC（留存 / 全分配）
  const profit = Math.max(0, income - cost - salary - book - ins)
  const cit = corporateIncomeTax(profit).tax
  const salaryTax = annualComprehensive(0, salary, ins, sd).tax
  const vatL3 = vatAgent(monthly)
  const retainTotal = r2(cit + salaryTax + (vatL3.vat + vatL3.surcharge) * 12)
  const afterTaxProfit = profit - cit
  const divTax = dividendTax(afterTaxProfit)
  const distributeTotal = r2(retainTotal + divTax)

  const pct = (t: number) => income > 0 ? r2(t / income * 100) : 0
  const paths = [
    { key: 'L1', name: '平台从业人员（劳务报酬）', tax: l1Total, rate: pct(l1Total), net: r2(income - l1Total), detail: { iit: l1Tax, vat: r2(vatL1.vat * 12), surcharge: r2(vatL1.surcharge * 12) } },
    { key: 'L2', name: '个体工商户（查账+减半）', tax: l2Total, rate: pct(l2Total), net: r2(income - cost - l2Total), detail: { iit: l2.tax, vat: r2(vatL2.vat * 12), surcharge: r2(vatL2.surcharge * 12), cost } },
    { key: 'L3R', name: 'OPC（利润留存）', tax: retainTotal, rate: pct(retainTotal), net: r2(income - cost - book - retainTotal), detail: { cit, salaryTax, vat: r2(vatL3.vat * 12), surcharge: r2(vatL3.surcharge * 12), profit: r2(profit), cost, salary, book } },
    { key: 'L3D', name: 'OPC（利润全分配）', tax: distributeTotal, rate: pct(distributeTotal), net: r2(income - cost - book - distributeTotal), detail: { cit, salaryTax, dividendTax: divTax, afterTaxProfit: r2(afterTaxProfit), vat: r2(vatL3.vat * 12), surcharge: r2(vatL3.surcharge * 12) } },
  ]
  // 推荐逻辑（与全案一致）
  let recommend = 'L1', reason = '年收入20万元以下，留在平台作为从业人员最简单、税负最低'
  if (income > 600000) { recommend = 'L3R'; reason = '60万元以上且有多客户、需承接企业大项目、计划再投入，OPC“利润留存再投资”最优；注意分红时另缴20%' }
  else if (income > 200000) { recommend = 'L2'; reason = '20万-60万元区间，真实经营的个体工商户优势明显' }
  return { income, assumptions: { costRatio, salary, book, sd, ins }, paths, recommend, reason,
    caveat: '升级为个体户/OPC必须基于真实经营（多客户、自有工具、独立承担风险、按成果收费）；若仅为单一企业提供类员工劳动，将被认定为转换收入性质甚至劳动关系。' }
}

// ======================================================================
// 9. 企业用工方案成本对比（全案 3.4 重算“降本账”）
// ======================================================================
export function enterpriseCostCompare(monthlyPayout: number, taxpayerType: 'general' | 'small', serviceRate = 0.05) {
  // 直接支付：无合规凭证，不得税前扣除 → 多承担25%企业所得税
  const direct = { name: '直接支付（无合规凭证）', nominal: monthlyPayout, deductible: 0, extraCit: r2(monthlyPayout * 0.25), risk: '极高', net: r2(monthlyPayout * 1.25) }
  // 老灵工：10%含6%专票
  const legacyNominal = r2(monthlyPayout * 1.10)
  const legacyInput = taxpayerType === 'general' ? r2(legacyNominal / 1.06 * 0.06) : 0
  const legacy = { name: '传统灵工平台（10%含6%专票）', nominal: legacyNominal, deductible: legacyInput, extraCit: 0, risk: '高', net: r2(legacyNominal - legacyInput) }
  // 云工智合佳：仅服务费开6%专票
  const fee = r2(monthlyPayout * serviceRate)
  const ourNominal = r2(monthlyPayout + fee)
  const ourInput = taxpayerType === 'general' ? r2(fee / 1.06 * 0.06) : 0
  const ours = { name: `云工智合佳（${(serviceRate*100).toFixed(1)}%服务费）`, nominal: ourNominal, deductible: ourInput, extraCit: 0, risk: '低', net: r2(ourNominal - ourInput) }
  return { monthlyPayout, taxpayerType, options: [direct, legacy, ours],
    insight: taxpayerType === 'general'
      ? '一般纳税人：名义成本与传统灵工接近，核心卖点是“同等成本下风险归零：无虚开连带、扣除凭证合法、从业人员到手更多、劳动争议可防可控”'
      : '小规模/免税主体无进项抵扣，平台成本优势显著' }
}
