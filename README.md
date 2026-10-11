# 云工智合佳 · AI 合规用工操作系统（Compliance OS）

> 合规 × AI 赋能 × 算力 · 三位一体的企业操作系统

> 用工有弹性，合规有确定性。让每一笔灵活用工都**可证明、可审计、可扣除**；让每一位灵活就业者都**合法增收、可持续成长**。

基于《云工智合佳 · 可行性风险与落地策划全案》（政策基准日 2026-10-09）完成的前后台一体化平台 MVP。

## 项目概览

- **名称**：云工智合佳 CloudWork Intel
- **定位**：从"个税代缴通道"升级为 AI 驱动的合规用工操作系统
- **技术栈**：Hono + TypeScript + Cloudflare Pages/Workers + D1 (SQLite) + TailwindCSS + Chart.js
- **设计原则**：确定性计算（税额/申报）全部由**规则引擎**完成，AI 只做理解、识别、预警与建议（"三不原则"）

## 访问地址

- **沙盒预览**：https://3000-iom0iwx7idi6d45o8v8db-5c13a017.sandbox.novita.ai
- **门户首页**：`/`（含三个免费测算器：从业人员累计预扣、企业成本对比、OPC 三阶跃迁）
- **登录**：`/login`
- **演示直登**：`/demo/admin` · `/demo/enterprise` · `/demo/opc`

| 角色（面向客户） | 账号 | 密码 | 入口 | 一键直登 |
|---|---|---|---|---|
| 企业 HR / 财务（星河直播传媒） | `hr_demo` | `Ent@2026` | `/enterprise` | `/demo/enterprise` |
| 灵活就业者（周小雨） | `worker_demo` | `Worker@2026` | `/worker` | `/demo/worker` |
| OPC 超级个体（林深数字创意） | `opc_demo` | `Opc@2026` | `/opc` | `/demo/opc` |
| 平台合规运营 | `admin` | `Admin@2026` | `/admin` | `/demo/admin` |

## 怎么用（执行流程 × 客户角色）

**一条主流程（8步）**：企业入驻 → 发布任务 → 接单签约 → 交付验收 → 一键发放 → 扣缴申报 → 代征解缴 → 凭证归档
流程说明页：`/guide`

每个工作台内置四件导航工具：
- **顶部流程条**：显示主流程走到哪一步、哪些步骤归我（带锁的是别人负责）
- **右上角「待办」**：按本期必须做的事排序，点击直达
- **每页「这页怎么用」**：这页是干嘛的 + 操作步骤
- **「新手引导」**：首次登录自动弹出的分步教程

| 角色 | 每月只需做 |
|---|---|
| 企业 HR | ① 验收交付 → ② 三层薪酬试算→审批→发放 → ③ 拿凭证包（或点「一键跑通演示流程」） |
| 灵活就业者 | ① 1分钟实名 → ② 任务大厅申请 → ③ 提交交付；然后看收入与税负 |
| OPC | ① 记收入/成本 → ② 股东工资+分红试算发放 → ③ 看税务测算与三阶跃迁 |
| 平台运营 | 按「待办」：实名核验 → 风控复核 → 申报复核提交 → 代征解缴出凭证 |

## 已完成的四大核心模块

### 1️⃣ PC 端合规申报（平台后台 `/admin#filings`）
- 五类申报：工资薪金扣缴 / 劳务报酬累计预扣（16号公告）/ 增值税及附加代办 / 涉税信息报送（15号公告）/ 委托代征汇总解缴
- 流程：**草稿 → 双人复核（规则引擎重算一致性校验）→ 提交 → 受理回执 → 更正申报**
- 申报日历（次月15日截止）、申报表 JSON 导出、每类申报附政策依据与表单名称
- 企业发放薪酬后自动生成对应申报草稿，推送至平台申报中心

### 2️⃣ 合理征税与委托代征（`/admin#collection`）
- 委托代征协议管理（委托税务机关、税种、有效期）
- 代征记录全链路：**已代征 → 已解缴 → 已出具完税凭证**
- 合理征税规则落地：按月**合并**从业人员全部销售额适用 10 万元起征点、超出 3% 减按 1%、附加减半、**不得拆分**、连续12个月超500万元引导登记
- 起征点分布看板（免征人数 vs 征收人数）

### 3️⃣ 企业全量薪酬管理（`/enterprise`）
- **三层用工结构**（全案 5.2）：核心层（劳动合同）/ 弹性层（非全日制·派遣·外包）/ 任务层（平台灵活用工）
- 三套计算引擎：
  - 核心层：工资薪金**累计预扣法** + 五险一金（可配置比例与基数上下限）+ 专项附加扣除
  - 弹性层：非全日制按小时计薪 + 单独工伤险 + 周工时超24h预警；派遣/外包取票不代扣
  - 任务层：劳务报酬**累计预扣**（16号公告）+ 增值税代办 + 平台服务费 + 与传统劳务按次预扣对比
- 批次流程：试算（dry-run）→ 生成批次 → 审批 → 发放（任务层自动生成结算记录、委托代征记录、五流合一凭证包）
- 用工结构合规体检评分；工资条；每笔计算附公式与依据
- 任务与交付：发布任务 → **劳动关系风控 Agent 实时评分**（绿放行/黄复核/红拦截）→ 电子签约（合同哈希）→ 交付存证 → 验收
- 风控硬规则：**老员工转灵工一票否决**（身份证与核心/弹性层在职及近3个月离职比对）、未实名不可签约、"坐班+月薪"组合直接升红
- 五流合一凭证包（合同/业务/资金/票据/个税）一键导出审计 JSON
- 用工方案成本对比（直接支付 / 传统灵工 / 云工智合佳，区分一般/小规模纳税人）

### 4️⃣ OPC 薪酬管理与经营舱（`/opc`）
- 经营舱：收入/成本趋势、客户结构、年化税负推荐、**四道防火墙**（财产独立 / 注册资本 / 客户集中度>70%预警 / 发票与成本）
- 收入与成本台账（发票类型、凭证标记）
- **OPC 薪酬**：股东工资（累计预扣）+ 分红（20%）组合，可分配税后利润校验（防抽逃出资），工资 vs 分红最优配比提示
- 税务测算：按主体形态自动切换（L1 劳务报酬 / L2 经营所得减半 / L3 小微 5% 企业所得税）+ 增值税起征点判定 + 500万登记预警
- **三阶跃迁**（L1 自然人 → L2 个体户 → L3 一人公司）税负对比与 AI 推荐，附真实经营前置条件自检
- 一站式服务舱：开业包 / 财税托管 / 法务包 / 接单引擎 / AI 工具包 / 保障包

### 5️⃣ 灵活就业者工作台（`/worker`，新增）
- 首页：进度步骤条（实名→接单→交付→验收→收款）+ 「下一步做什么」+ 本年到手/预扣
- 自助实名核验与代办申报授权（PIPL 单独同意流程）
- 任务大厅申请接单 → 企业确认后自动签约；我的任务自助交付（哈希存证）
- 收入与凭证、我的税负（累计预扣 vs 传统劳务逐月预测）、成长路径

### 6️⃣ 企业 AI 赋能中心（企业 / OPC / 从业人员共用）
- **AI 数字员工矩阵（15 个 Agent）**：用工合规诊断官 · 任务拆解定价师 · 智能合同 · 税负解读官 · OPC 成长教练 · AI 销售宝 · 电商文案官 · AIGC 工坊 · 智能客服 · 经营分析师 · 人事助理 · 财务助理 · 轻站搭建 · 政策补贴匹配 · 路演 BP 教练
  - 涉税 Agent 标记 `deterministic`：规则引擎先算，模型只解释（三不原则）
  - 每次调用：L2 DLP 输入 → L3 智能路由 → L4 调用 → L2 DLP 输出 → L5 计费 + 存证
- **AIGC 工坊**：文生图 / 文生视频，自动添加 AI 生成标识
- **算力中心**：算力钱包（Credits，1 Cr = ¥0.01）、充值返 Token 10-15%、四档订阅（Free/Basic/Pro/Enterprise）、网关配置（路由策略 / 资源池 / DLP 级别 / BYOK）、OpenAI 兼容子密钥、60+ 模型目录与定价、DLP 八大模块测试、账单与调用审计
- **AI 服务集市（八大能力模块）**：任务中心（即任务与交付）· 算力中心 · 项目超市 · 服务集市（Skill/MCP/Agent）· AI 人才 · 特色专区 · 政策政府 · 投融路演，另有轻站 / 托盘赋能
- **对外 OpenAI 兼容网关** `POST /v1/chat/completions`、`GET /v1/models`：企业用子密钥把自有系统接入，`model:"auto"` 走智能路由，响应含 `x_gateway{pool,route_reason,dlp_action,credits,evidence_hash}`

### 7️⃣ 算力网关（平台后台 · 五层架构）
| 层 | 能力 | 实现 |
|---|---|---|
| L1 统一接入 | OpenAI 兼容 · 子密钥 · BYOK | `/v1/*`、`ai_wallets.api_key / byok_json` |
| L2 DLP 网关 | 八大模块：全报文解析 / 双引擎识别(PII) / 流式检测 / 分级处置(放行·脱敏·阻断·分流) / 双向防护 / 提示词注入防护 / 风险路由 / 全链路审计 | `src/lib/gateway.ts runDlp/dlpOutput`，规则表 `dlp_rules` |
| L3 聚合分发 | 质量 / 均衡 / 成本 / 时延四种策略打分；敏感业务强制境内 | `routeModel` |
| L4 资源适配 | 境内备案池 + 海外可控池；多供应商优先级；连通性检查 | `ai_providers / ai_models` |
| L5 运营合规 | Token 计量计费、返 Token、订单、SHA-256 存证哈希 | `ai_usage / ai_wallet_txns` |

**接入真实算力**：平台后台 → 算力网关 → 在「算力网 · 统一算力网关」卡片填入上游 API Key（Base URL 默认 `https://api.suanli.com/v1`）→ 状态改为"已启用"→ 保存。未配置时为演示模式（链路完整、输出为结构化示例并明确标注）。

### 平台后台其他能力
风控中心（评估记录、人工放行/拦截、T+0 异常监测：一人多号、经济从属、起征点、实名、OPC集中度、AI 评分沙盒）、企业入驻与费率/风险等级管理、从业人员实名核验、OPC 管理、政策法规库（9 条，附文号与生效日期）、规则引擎参数化配置、审计日志。

## API 一览

| 前缀 | 说明 |
|---|---|
| `POST /api/auth/login` `/logout` `GET /me` | 会话认证（Bearer 或 Cookie） |
| `GET/PUT /api/enterprise/profile` `GET /dashboard` `GET /structure` | 企业信息与驾驶舱 |
| `GET/POST/PUT/DELETE /api/enterprise/employees` | 三层人员管理 |
| `POST /api/enterprise/payroll/calculate` `GET /payroll/batches[/:id]` `POST /batches/:id/approve|pay` `GET /payroll/payslip/:id` | 薪酬引擎 |
| `GET/POST /api/enterprise/tasks` `POST /tasks/assess` `GET/POST /tasks/:id/orders` `POST /orders/:id/deliver|accept` | 任务·签约·交付·验收 |
| `GET /api/enterprise/settlements[/:id/evidence]` `GET /cost-compare` | 结算、凭证包、成本对比 |
| `GET/PUT /api/opc/profile` `GET /dashboard` `GET/POST/DELETE /incomes|expenses` | OPC 经营 |
| `GET /api/opc/payrolls` `POST /payrolls/calculate` `POST /payrolls/:period/pay` | OPC 薪酬 |
| `GET /api/opc/tax/period` `GET /tax/compare` `GET /growth` | OPC 税务与成长 |
| `GET /api/admin/dashboard` `GET/POST /filings` `POST /filings/generate` `POST /filings/:id/review|submit|correct` `GET /filings/calendar/:period` | 合规申报中心 |
| `GET/POST /api/admin/collection/agreements` `GET /collection/records|summary` `POST /collection/certify/:period` | 委托代征 |
| `GET /api/admin/risk/assessments|monitor` `POST /risk/assess` `POST /risk/tasks/:id/decision` | 风控 |
| `GET/POST/PUT /api/admin/enterprises` `GET/POST /workers` `POST /workers/:id/verify` `GET /opcs` `GET /policies` `GET/PUT /settings` `GET /audit-logs` | 平台管理 |
| `GET /api/ai/overview|wallet|models|agents|usage|catalog|orders|conversations` `POST /ai/chat|image|route/preview|dlp/test|wallet/recharge|wallet/plan|wallet/rotate-key|catalog/:id/order` `PUT /ai/wallet/settings` | AI 赋能中心 |
| `GET/PUT /api/admin/ai/providers|models|dlp/rules|agents|catalog|orders` `POST /admin/ai/providers/:key/check` `GET /admin/ai/stats` | 算力网关管理 |
| `POST /v1/chat/completions` `GET /v1/models` | 对外 OpenAI 兼容网关 |
| `GET /api/worker/home|hall|income|tax` `POST /worker/verify` `POST /worker/hall/:id/apply` `POST /worker/orders/:id/deliver` | 从业人员端 |
| `GET /api/guide/progress` `GET /api/guide/todos` | 流程进度与角色待办 |
| `GET/POST /api/enterprise/applications[/:id/decide]` `POST /enterprise/demo/run-flow` | 接单申请确认 · 一键演示 |
| `POST /api/public/calc/labor|wage|enterprise|opc` `POST /api/public/risk` | 公共测算器（PLG 入口） |

## 数据架构（Cloudflare D1）

`users(含 worker 角色与 onboarded) / sessions / task_applications / enterprises / employees / payroll_batches / payroll_items / workers / tasks / task_orders / settlements / tax_filings / collection_agreements / collection_records / opcs / opc_incomes / opc_expenses / opc_payrolls / risk_assessments / audit_logs / policies / platform_settings`

迁移文件：`migrations/0001_initial_schema.sql`、`0002_worker_role.sql`、`0003_ai_center.sql`；AI 种子：`seed_ai.sql`；演示数据：`seed.sql`

## 规则引擎（`src/lib/tax.ts` / `src/lib/risk.ts`）

- 综合所得七级预扣率表、经营所得五级税率表、传统劳务报酬预扣表
- 工资薪金累计预扣、劳务报酬累计预扣（×80%−5000/月）、增值税代办（10万起征/1%/附加6%）、五险一金、经营所得（200万内减半）、小微企业所得税 5%、股息红利 20%、年度综合所得汇算
- OPC 三阶对比（与全案 8.3 口径一致：60万 → 12.18% / 5.62% / 2.92% / 13.78%）
- 企业成本三方案对比（全案 3.4）
- 劳动关系风险评分卡（全案 4.1：六维加权、一票否决、组合升红）
- 用工结构三层体检（全案 5.2）

## 本地开发

```bash
npm install
npm run build
npm run db:migrate:local && npm run db:seed && npx wrangler d1 execute webapp-production --local --file=./seed_ai.sql
pm2 start ecosystem.config.cjs                 # 或 npm run dev:sandbox
curl http://localhost:3000/api/public/health
```

## 尚未实现 / 下一步建议

1. **真实外部对接**：持牌支付机构受托分账 API、电子签/司法存证、公安三要素+人脸活体、电子税务局申报接口（当前为流程模拟）
2. **算力网关真实接入**：填入上游 API Key 即可；后续补流式 SSE 输出、视频异步任务轮询、Embedding/RAG 法规库、MCP 工具调用
3. 社保公积金地区参数库、专项附加扣除明细申报、年度汇算提醒
4. 渠道合伙人分级与分佣结算、企业合规 SaaS 订阅计费
5. 等保三级、数据分级分类、人脸特征值加密存储、PIPL 单独同意流程
6. 生产部署：`npx wrangler d1 create webapp-production` 后回填 `database_id`，`npm run db:migrate:prod`，再部署

## 部署状态

- **平台**：Cloudflare Pages（沙盒 PM2 + wrangler pages dev 运行中）
- **状态**：✅ 开发环境运行中；生产未部署
- **最后更新**：2026-10-11

## 免责声明

本平台所有测算为示意性模型，不构成法律、税务或投资意见。各地税务机关执行口径可能存在差异，涉及结构设计、凭证认定与具体税额的事项，请以主管税务机关意见及执业律师、注册税务师的书面意见为准。
