-- 云工智合佳 Compliance OS · 初始数据库结构
PRAGMA foreign_keys = ON;

-- ========== 账号与会话 ==========
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','enterprise','opc')),
  display_name TEXT NOT NULL,
  enterprise_id INTEGER,
  opc_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== 企业 ==========
CREATE TABLE IF NOT EXISTS enterprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  credit_code TEXT UNIQUE,
  taxpayer_type TEXT NOT NULL DEFAULT 'general' CHECK (taxpayer_type IN ('general','small')),
  industry TEXT,
  region TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  service_rate REAL NOT NULL DEFAULT 0.05,
  status TEXT NOT NULL DEFAULT 'active',
  risk_level TEXT NOT NULL DEFAULT 'green',
  social_config TEXT, -- JSON：社保公积金比例与基数上下限
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 企业人员（三层用工结构：core 核心层 / flex 弹性层 / task 任务层）
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  id_no TEXT,
  phone TEXT,
  layer TEXT NOT NULL CHECK (layer IN ('core','flex','task')),
  employment_type TEXT NOT NULL, -- fulltime 全日制 / parttime 非全日制 / dispatch 劳务派遣 / outsource 业务外包 / platform 平台灵活用工
  position TEXT,
  department TEXT,
  base_salary REAL DEFAULT 0,
  hourly_rate REAL DEFAULT 0,
  social_base REAL DEFAULT 0,
  housing_base REAL DEFAULT 0,
  special_deduction REAL DEFAULT 0, -- 每月专项附加扣除合计
  start_date TEXT,
  end_date TEXT,
  bank_account TEXT,
  worker_id INTEGER, -- 任务层对应平台从业人员
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employees_ent ON employees(enterprise_id);

-- 薪酬批次（按期间+层级）
CREATE TABLE IF NOT EXISTS payroll_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM
  layer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft / calculated / approved / paid
  headcount INTEGER DEFAULT 0,
  total_gross REAL DEFAULT 0,
  total_personal_insurance REAL DEFAULT 0,
  total_employer_insurance REAL DEFAULT 0,
  total_tax REAL DEFAULT 0,
  total_net REAL DEFAULT 0,
  total_employer_cost REAL DEFAULT 0,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  paid_at DATETIME,
  UNIQUE(enterprise_id, period, layer)
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  employee_name TEXT,
  gross REAL DEFAULT 0,
  bonus REAL DEFAULT 0,
  hours REAL DEFAULT 0,
  units REAL DEFAULT 0,
  personal_insurance REAL DEFAULT 0,
  personal_housing REAL DEFAULT 0,
  employer_insurance REAL DEFAULT 0,
  employer_housing REAL DEFAULT 0,
  special_deduction REAL DEFAULT 0,
  cum_income REAL DEFAULT 0,
  cum_taxable REAL DEFAULT 0,
  cum_tax REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  vat REAL DEFAULT 0,
  surcharge REAL DEFAULT 0,
  service_fee REAL DEFAULT 0,
  net REAL DEFAULT 0,
  employer_cost REAL DEFAULT 0,
  detail_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payroll_items_batch ON payroll_items(batch_id);

-- ========== 平台从业人员 ==========
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  id_no TEXT UNIQUE,
  phone TEXT,
  bank_account TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at DATETIME,
  authorized_filing INTEGER NOT NULL DEFAULT 0, -- 是否签署代办申报授权
  region TEXT,
  skills TEXT,
  opc_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== 任务与交付 ==========
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  pricing_mode TEXT NOT NULL DEFAULT 'piece', -- piece 按件 / project 按项目 / milestone 里程碑 / time 按时间
  unit_price REAL DEFAULT 0,
  quantity REAL DEFAULT 1,
  budget REAL DEFAULT 0,
  deliverable_spec TEXT,
  acceptance_std TEXT,
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'green',
  risk_detail TEXT, -- JSON
  status TEXT NOT NULL DEFAULT 'draft', -- draft / blocked / review / published / closed
  deadline TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_ent ON tasks(enterprise_id);

CREATE TABLE IF NOT EXISTS task_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  contract_no TEXT,
  contract_hash TEXT,
  status TEXT NOT NULL DEFAULT 'signed', -- signed / delivered / accepted / settled / rejected
  quantity_done REAL DEFAULT 0,
  amount REAL DEFAULT 0,
  deliverable_desc TEXT,
  deliverable_hash TEXT,
  delivered_at DATETIME,
  accepted_at DATETIME,
  accepted_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_task ON task_orders(task_id);

-- 结算（平台受托分账 + 扣缴 + 代办）
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settlement_no TEXT UNIQUE,
  enterprise_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  task_order_id INTEGER,
  period TEXT NOT NULL,
  amount REAL NOT NULL,
  service_fee REAL DEFAULT 0,
  vat REAL DEFAULT 0,
  surcharge REAL DEFAULT 0,
  iit REAL DEFAULT 0,
  net REAL DEFAULT 0,
  cum_income REAL DEFAULT 0,
  cum_tax REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending / paid / filed
  evidence_json TEXT, -- 五流合一凭证包
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_settle_worker ON settlements(worker_id, period);
CREATE INDEX IF NOT EXISTS idx_settle_ent ON settlements(enterprise_id, period);

-- ========== 合规申报 ==========
CREATE TABLE IF NOT EXISTS tax_filings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filing_no TEXT UNIQUE,
  filing_type TEXT NOT NULL, -- iit_wage 工资薪金扣缴 / iit_labor 劳务报酬累计预扣 / vat_agent 增值税代办 / info_report 涉税信息报送 / collection 委托代征汇总 / opc_cit 企业所得税 / opc_vat
  period TEXT NOT NULL,
  subject_type TEXT NOT NULL, -- platform / enterprise / opc
  subject_id INTEGER,
  subject_name TEXT,
  record_count INTEGER DEFAULT 0,
  total_income REAL DEFAULT 0,
  total_tax REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft / reviewed / submitted / accepted / corrected
  payload_json TEXT,
  reviewer TEXT,
  receipt_no TEXT,
  submitted_at DATETIME,
  accepted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_filings_period ON tax_filings(period, filing_type);

-- ========== 委托代征 ==========
CREATE TABLE IF NOT EXISTS collection_agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agreement_no TEXT UNIQUE NOT NULL,
  tax_authority TEXT NOT NULL,
  region TEXT,
  tax_types TEXT NOT NULL, -- 逗号分隔：vat,surcharge,iit
  scope TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agreement_id INTEGER NOT NULL,
  settlement_id INTEGER,
  worker_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  tax_type TEXT NOT NULL, -- vat / surcharge / iit
  tax_base REAL DEFAULT 0,
  rate REAL DEFAULT 0,
  amount REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'collected', -- collected 已代征 / remitted 已解缴 / certified 已出具凭证
  certificate_no TEXT,
  remitted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_collect_period ON collection_records(period, tax_type);

-- ========== OPC（One Person Company）==========
CREATE TABLE IF NOT EXISTS opcs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('individual','sole_proprietor','company')), -- L1 自然人 / L2 个体户 / L3 一人有限公司
  credit_code TEXT,
  owner_name TEXT NOT NULL,
  owner_id_no TEXT,
  owner_worker_id INTEGER,
  registered_capital REAL DEFAULT 0,
  paid_capital REAL DEFAULT 0,
  region TEXT,
  industry TEXT,
  accounting_method TEXT DEFAULT 'audit', -- audit 查账 / (核定不支持)
  owner_salary REAL DEFAULT 0, -- 股东月工资
  owner_social_base REAL DEFAULT 0,
  owner_special_deduction REAL DEFAULT 0,
  bookkeeping_fee REAL DEFAULT 0, -- 年记账费
  stage TEXT NOT NULL DEFAULT 'L1',
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opc_incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opc_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  client_name TEXT NOT NULL,
  enterprise_id INTEGER,
  amount REAL NOT NULL,
  invoice_type TEXT DEFAULT 'none', -- none / normal / special
  invoice_no TEXT,
  project TEXT,
  income_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_opc_inc ON opc_incomes(opc_id, period);

CREATE TABLE IF NOT EXISTS opc_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opc_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  has_voucher INTEGER DEFAULT 1,
  remark TEXT,
  expense_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_opc_exp ON opc_expenses(opc_id, period);

-- OPC 薪酬（股东工资 + 分红）
CREATE TABLE IF NOT EXISTS opc_payrolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opc_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  owner_salary REAL DEFAULT 0,
  personal_insurance REAL DEFAULT 0,
  employer_insurance REAL DEFAULT 0,
  special_deduction REAL DEFAULT 0,
  cum_income REAL DEFAULT 0,
  cum_taxable REAL DEFAULT 0,
  cum_tax REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  net REAL DEFAULT 0,
  dividend REAL DEFAULT 0,
  dividend_tax REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'calculated', -- calculated / paid
  detail_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(opc_id, period)
);

-- ========== 风控 ==========
CREATE TABLE IF NOT EXISTS risk_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL, -- task / employee / worker / opc / enterprise
  subject_id INTEGER NOT NULL,
  enterprise_id INTEGER,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  factors_json TEXT,
  decision TEXT, -- pass / review / block
  reviewer TEXT,
  review_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_risk_subject ON risk_assessments(subject_type, subject_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 政策法规库（RAG 法规库的结构化种子）
CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  doc_no TEXT,
  effective_date TEXT,
  category TEXT,
  summary TEXT,
  impact TEXT,
  status TEXT DEFAULT 'effective'
);

-- 平台参数（规则引擎参数化配置）
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
