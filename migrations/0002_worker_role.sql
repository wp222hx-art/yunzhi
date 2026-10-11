-- 新增从业人员角色（users.role 增加 worker）与 worker_id 关联
CREATE TABLE IF NOT EXISTS users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','enterprise','opc','worker')),
  display_name TEXT NOT NULL,
  enterprise_id INTEGER,
  opc_id INTEGER,
  worker_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  onboarded INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users_new (id,username,password_hash,salt,role,display_name,enterprise_id,opc_id,status,created_at)
  SELECT id,username,password_hash,salt,role,display_name,enterprise_id,opc_id,status,created_at FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- 任务大厅：任务可见范围与申请
CREATE TABLE IF NOT EXISTS task_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending / accepted / rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, worker_id)
);
