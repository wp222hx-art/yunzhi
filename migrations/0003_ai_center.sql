-- AI 赋能中心 · 算力网关 · DLP · 数字员工 · AI 服务集市

-- 算力供应商（网关配置，支持多供应商 / BYOK）
CREATE TABLE IF NOT EXISTS ai_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,            -- suanli / openai_compat / byok_xxx
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,              -- 例如 https://api.suanli.com/v1
  api_key TEXT,                        -- 服务端保存，前端仅展示掩码
  protocol TEXT NOT NULL DEFAULT 'openai', -- openai / anthropic
  pool TEXT NOT NULL DEFAULT 'domestic',   -- domestic 境内备案池 / overseas 海外可控池
  priority INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active',   -- active / disabled / mock
  features TEXT,                       -- JSON: {chat,image,video,embedding,rerank,tts,stt}
  last_check_at DATETIME,
  last_check_ok INTEGER,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 模型目录
CREATE TABLE IF NOT EXISTS ai_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT UNIQUE NOT NULL,       -- deepseek-v4-flash
  display_name TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  vendor TEXT,
  type TEXT NOT NULL DEFAULT 'chat',   -- chat / reasoning / image / video / embedding / rerank / tts / stt
  pool TEXT NOT NULL DEFAULT 'domestic',
  context_k INTEGER DEFAULT 32,
  price_in REAL DEFAULT 0,             -- Credits / 1K tokens（输入）
  price_out REAL DEFAULT 0,            -- Credits / 1K tokens（输出）
  quality INTEGER DEFAULT 3,           -- 1-5
  latency INTEGER DEFAULT 3,           -- 1-5（越高越快）
  cost INTEGER DEFAULT 3,              -- 1-5（越高越便宜）
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sort INTEGER DEFAULT 100
);

-- 算力钱包（企业 / OPC）
CREATE TABLE IF NOT EXISTS ai_wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL,            -- enterprise / opc
  owner_id INTEGER NOT NULL,
  credits REAL NOT NULL DEFAULT 0,     -- 1 Credit = ¥0.01
  bonus_tokens REAL NOT NULL DEFAULT 0,-- 消费返 Token（权益）
  plan TEXT NOT NULL DEFAULT 'free',   -- free / basic / pro / enterprise
  plan_expires TEXT,
  routing_policy TEXT NOT NULL DEFAULT 'balanced', -- quality / balanced / cost / latency
  pool_policy TEXT NOT NULL DEFAULT 'domestic_first', -- domestic_only / domestic_first / any
  dlp_level TEXT NOT NULL DEFAULT 'standard',      -- off / standard / strict
  api_key TEXT,                        -- 企业自己的调用子密钥（对外开放 OpenAI 兼容接口）
  byok_json TEXT,                      -- 企业自带 Key 配置（可选）
  total_recharged REAL DEFAULT 0,
  total_spent REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS ai_wallet_txns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  type TEXT NOT NULL,                  -- recharge / spend / bonus / plan / refund
  amount REAL NOT NULL,                -- Credits（正为入，负为出）
  cny REAL DEFAULT 0,
  remark TEXT,
  ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wtx ON ai_wallet_txns(wallet_id, id);

-- 调用用量 / 审计（含 DLP 处置与路由原因）
CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  owner_type TEXT, owner_id INTEGER,
  user_name TEXT,
  agent_key TEXT,
  model_id TEXT,
  provider_key TEXT,
  pool TEXT,
  route_reason TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  credits REAL DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  dlp_action TEXT DEFAULT 'pass',      -- pass / desensitize / block / divert
  dlp_hits TEXT,                       -- JSON
  status TEXT DEFAULT 'ok',            -- ok / blocked / error / mock
  evidence_hash TEXT,                  -- 全链路存证哈希
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_wallet ON ai_usage(wallet_id, created_at);

-- DLP 规则
CREATE TABLE IF NOT EXISTS dlp_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  module TEXT NOT NULL,                -- parse / identify / stream / action / defense / injection / routing / audit
  pattern TEXT,                        -- 正则（PII）
  action TEXT NOT NULL DEFAULT 'desensitize', -- pass / desensitize / block / divert
  level TEXT NOT NULL DEFAULT 'standard',     -- standard / strict
  enabled INTEGER NOT NULL DEFAULT 1,
  description TEXT
);

-- 数字员工 / AI Agent 目录
CREATE TABLE IF NOT EXISTS ai_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,              -- 合规 / 销售 / 内容 / 运营 / 财税 / 人事 / 电商
  icon TEXT,
  tagline TEXT,
  description TEXT,
  system_prompt TEXT,
  input_schema TEXT,                   -- JSON: [{key,label,type,placeholder}]
  preferred_type TEXT DEFAULT 'chat',
  preferred_policy TEXT DEFAULT 'balanced',
  deterministic INTEGER DEFAULT 0,     -- 1=涉及税额：由规则引擎计算后再交给模型解释
  price_hint TEXT,
  roles TEXT DEFAULT 'enterprise,opc', -- 可用角色
  status TEXT NOT NULL DEFAULT 'active',
  sort INTEGER DEFAULT 100
);

-- 会话
CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  agent_key TEXT,
  title TEXT,
  messages_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI 服务集市（项目超市 / 服务集市 / AI人才 / 特色专区 / 政策补贴 / 投融路演 / 轻站 / 托盘赋能 / 实训）
CREATE TABLE IF NOT EXISTS ai_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,               -- project / service / talent / vertical / policy / roadshow / site / tray / training / compute
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  tags TEXT,
  price_text TEXT,
  price_credits REAL DEFAULT 0,
  provider TEXT,
  delivery_days INTEGER,
  rating REAL DEFAULT 4.8,
  sold INTEGER DEFAULT 0,
  meta_json TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sort INTEGER DEFAULT 100
);

CREATE TABLE IF NOT EXISTS ai_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE,
  wallet_id INTEGER NOT NULL,
  owner_type TEXT, owner_id INTEGER,
  catalog_id INTEGER NOT NULL,
  title TEXT,
  section TEXT,
  credits REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending / in_progress / delivered / done / cancelled
  requirement TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
