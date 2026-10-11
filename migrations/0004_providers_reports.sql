-- 供应商：支持环境变量注入 Key；新增 DeepSeek 官方与平台内置算力
ALTER TABLE ai_providers ADD COLUMN env_var TEXT;
ALTER TABLE ai_providers ADD COLUMN default_model TEXT;
ALTER TABLE ai_providers ADD COLUMN docs_url TEXT;

-- AI 报告（Agent 输出沉淀为业务资产）
CREATE TABLE IF NOT EXISTS ai_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  owner_type TEXT, owner_id INTEGER,
  agent_key TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  inputs_json TEXT,
  model_id TEXT,
  evidence_hash TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reports_wallet ON ai_reports(wallet_id, id);

-- 通知中心
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  role TEXT,
  enterprise_id INTEGER, opc_id INTEGER, worker_id INTEGER,
  level TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
