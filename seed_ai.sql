-- ===== AI 赋能中心 种子数据 =====

-- 算力供应商（默认 mock 模式；在平台后台填入 API Key 后切换为 active 即可真实调用）
INSERT OR IGNORE INTO ai_providers (id,key,name,base_url,api_key,protocol,pool,priority,status,features,remark) VALUES
 (1,'suanli','算力网 · 统一算力网关','https://api.suanli.com/v1',NULL,'openai','domestic',1,'mock','{"chat":1,"image":1,"video":1,"embedding":1,"rerank":1,"tts":1,"stt":1}','OpenAI 兼容接口 · 一把 Key 接入 60+ 大模型 · 境内备案池 + 海外可控池 · Token 统一结算'),
 (2,'byok_openai','企业自带 Key（OpenAI 兼容）','https://api.openai.com/v1',NULL,'openai','overseas',20,'disabled','{"chat":1,"image":1,"embedding":1}','BYOK：企业自带密钥，流量不经平台计费');

INSERT OR IGNORE INTO ai_models (model_id,display_name,provider_key,vendor,type,pool,context_k,price_in,price_out,quality,latency,cost,tags,sort) VALUES
 ('deepseek-v4-flash','DeepSeek V4 Flash','suanli','DeepSeek','chat','domestic',128,0.05,0.2,3,5,5,'高性价比,日常对话,文案',10),
 ('deepseek-v4-pro','DeepSeek V4 Pro','suanli','DeepSeek','chat','domestic',128,0.2,0.8,5,3,3,'复杂推理,长文',11),
 ('deepseek-reasoner','DeepSeek Reasoner','suanli','DeepSeek','reasoning','domestic',128,0.4,1.6,5,2,2,'深度推理,数学,代码',12),
 ('qwen3.6-flash','通义千问 3.6 Flash','suanli','阿里云','chat','domestic',128,0.03,0.12,3,5,5,'极速,低成本',20),
 ('qwen-max','通义千问 Max','suanli','阿里云','chat','domestic',32,0.24,0.96,5,3,2,'旗舰,中文强',21),
 ('qwen-plus','通义千问 Plus','suanli','阿里云','chat','domestic',128,0.08,0.2,4,4,4,'均衡',22),
 ('qwen2.5-coder-32b-instruct','通义千问 Coder 32B','suanli','阿里云','chat','domestic',32,0.1,0.3,4,4,4,'代码',23),
 ('glm-5.1','智谱 GLM-5.1','suanli','智谱AI','chat','domestic',128,0.1,0.3,4,4,4,'均衡,工具调用',30),
 ('glm-4-flash','智谱 GLM-4 Flash','suanli','智谱AI','chat','domestic',128,0.01,0.01,3,5,5,'免费档,极速',31),
 ('kimi-k2.6','Kimi K2.6','suanli','月之暗面','chat','domestic',256,0.2,0.8,5,3,3,'超长上下文,Agent',40),
 ('doubao-pro-32k','豆包 Pro 32K','suanli','字节跳动','chat','domestic',32,0.08,0.2,4,4,4,'电商文案,营销',50),
 ('doubao-lite-32k','豆包 Lite 32K','suanli','字节跳动','chat','domestic',32,0.03,0.06,3,5,5,'极速,客服',51),
 ('gpt-5.5','GPT-5.5','suanli','OpenAI','chat','overseas',256,1.5,6,5,3,1,'海外,旗舰',60),
 ('gpt-4o','GPT-4o','suanli','OpenAI','chat','overseas',128,0.5,1.5,4,4,2,'海外,多模态',61),
 ('claude-3-7-sonnet-20250219','Claude 3.7 Sonnet','suanli','Anthropic','chat','overseas',200,0.6,3,5,3,2,'海外,写作,代码',62),
 ('gemini-2.5-pro','Gemini 2.5 Pro','suanli','Google','chat','overseas',1000,0.25,1.5,5,3,3,'海外,超长上下文',63),
 ('gemini-3.1-flash-lite','Gemini 3.1 Flash Lite','suanli','Google','chat','overseas',1000,0.02,0.08,3,5,5,'海外,极速',64),
 ('doubao-seedream-4-0-250828','豆包 Seedream 4.0','suanli','字节跳动','image','domestic',0,0,25,5,3,3,'文生图,电商主图',70),
 ('wan2.7-image','通义万相 2.7 图像','suanli','阿里云','image','domestic',0,0,20,4,4,4,'文生图,海报',71),
 ('gpt-image-1','GPT Image 1','suanli','OpenAI','image','overseas',0,0,60,5,3,2,'海外,文字渲染',72),
 ('doubao-seedance-2.0','豆包 Seedance 2.0','suanli','字节跳动','video','domestic',0,0,400,5,2,3,'文生视频,带声音',80),
 ('wan2.7-t2v-2026-04-25','通义万相 2.7 视频','suanli','阿里云','video','domestic',0,0,300,4,3,4,'文生视频',81),
 ('doubao-embedding','豆包 Embedding','suanli','字节跳动','embedding','domestic',0,0.005,0,4,5,5,'向量化,RAG',90),
 ('gemini-embedding-001','Gemini Embedding','suanli','Google','embedding','overseas',0,0.01,0,4,5,5,'海外,向量化',91),
 ('qwen3-rerank','通义 Rerank','suanli','阿里云','rerank','domestic',0,0.005,0,4,5,5,'重排序,RAG',92),
 ('doubao-tts','豆包 TTS','suanli','字节跳动','tts','domestic',0,0,2,4,5,4,'语音合成,数字人',95);

-- DLP 八大模块规则
INSERT OR IGNORE INTO dlp_rules (key,name,module,pattern,action,level,enabled,description) VALUES
 ('pii_idcard','身份证号','identify','[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]','desensitize','standard',1,'国家级 PII 识别：居民身份证号'),
 ('pii_phone','手机号','identify','(?<!\d)1[3-9]\d{9}(?!\d)','desensitize','standard',1,'国家级 PII 识别：手机号'),
 ('pii_bankcard','银行卡号','identify','(?<!\d)(62|4|5)\d{14,18}(?!\d)','desensitize','standard',1,'国家级 PII 识别：银行卡号'),
 ('pii_email','邮箱','identify','[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}','desensitize','strict',1,'邮箱地址（严格模式脱敏）'),
 ('pii_credit_code','统一社会信用代码','identify','[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}','desensitize','strict',1,'企业统一社会信用代码'),
 ('secret_key','密钥泄露','identify','(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,})','block','standard',1,'API Key / 云凭证外泄阻断'),
 ('inj_jailbreak','越狱指令','injection','(忽略.{0,6}(指令|规则|提示|设定)|无视.{0,6}(指令|规则)|ignore (all )?(previous|above) instructions|你现在是.*没有限制|DAN模式|jailbreak)','block','standard',1,'提示词注入 / 越狱检测'),
 ('inj_exfil','系统提示词窃取','injection','(输出|打印|重复|repeat|print).{0,10}(系统提示|system prompt|初始指令)','block','standard',1,'防止系统提示词外泄'),
 ('route_sensitive','敏感业务境内路由','routing','(财务报表|薪酬|工资|社保|税务申报|身份证|员工名单|客户名单|合同)','divert','standard',1,'命中敏感业务关键词 → 强制路由境内备案池'),
 ('stream_check','流式实时检测','stream',NULL,'pass','standard',1,'SSE 边流边检，300ms 分级处置'),
 ('parse_full','全报文解析','parse',NULL,'pass','standard',1,'system / user / assistant / tool 四角色完整解析'),
 ('audit_chain','全链路存证','audit',NULL,'pass','standard',1,'请求摘要 / 模型 / 处置 / 时间 七要素哈希存证');

-- 数字员工 / AI Agent 目录（面向企业的 AI 赋能工具）
INSERT OR IGNORE INTO ai_agents (key,name,category,icon,tagline,description,system_prompt,input_schema,preferred_policy,deterministic,roles,sort) VALUES
 ('compliance_doctor','用工合规诊断官','合规','fa-stethoscope','30分钟出具《用工结构合规体检报告》','输入组织架构、岗位与薪酬结构，生成三层优化方案（核心/弹性/任务层），指出劳动关系穿透风险与税前扣除凭证缺口。','你是企业用工合规顾问，依据《劳动合同法》、最高法劳动争议解释（二）、税务总局2025年第16号公告、企业所得税税前扣除凭证管理办法。输出结构：1）现状诊断 2）风险清单（高/中/低）3）三层优化方案 4）需补齐的证据链 5）免责声明。只引用文件名与文号，不引用领导人讲话；不承诺零风险。','[{"key":"org","label":"组织与岗位描述","type":"textarea","placeholder":"例如：直播部 20 名主播按月固定底薪+提成，坐班打卡…"},{"key":"headcount","label":"总人数","type":"number"},{"key":"industry","label":"行业","type":"text"}]','quality',0,'enterprise',1),
 ('task_pricer','任务拆解与定价师','合规','fa-sitemap','把项目需求拆成可验收任务包并给出市场价格带','输入项目需求，输出按成果计价的任务包（交付物、验收标准、单价区间），避免按时间计价触发劳动关系风险。','你是灵活用工任务设计专家。把需求拆解为 3-8 个可独立验收的任务包，每个包含：任务名、交付物、验收标准、计价方式（按件/项目/里程碑，禁止按时间）、市场单价区间（人民币）、预估工期。最后给出劳动关系风险提示。 输出格式要求（必须遵守）：先用一个 Markdown 表格列出全部任务包，表头固定为：| 任务 | 交付物 | 验收标准 | 计价方式 | 单价（元） | 数量 | 工期 |，单价只写一个数字（不写区间，可在表格外另行说明区间），数量写整数；表格之后再写补充说明与劳动关系风险提示。','[{"key":"need","label":"项目需求","type":"textarea","placeholder":"例如：为新品做 30 条短视频 + 10 场直播"},{"key":"budget","label":"总预算（元）","type":"number"}]','balanced',0,'enterprise',2),
 ('contract_agent','智能合同助手','合规','fa-file-contract','生成服务合作协议与验收条款','基于任务包自动生成《服务合作协议》要点：主体、成果、验收、报酬结算（平台受托分账）、知识产权、保密与非劳动关系声明。','你是合同起草助手。生成《服务合作协议》条款要点（非法律意见），必须包含：非劳动关系声明、按成果计价、验收标准、平台受托结算与扣缴代办、知识产权归属、个人信息保护、争议解决。标注"AI辅助生成，须经律师复核"。','[{"key":"task","label":"任务描述","type":"textarea"},{"key":"amount","label":"报酬（元）","type":"number"}]','balanced',0,'enterprise',3),
 ('tax_explainer','税负测算解读官','财税','fa-calculator','用人话解释规则引擎算出的税','税额由确定性规则引擎计算，本 Agent 只负责解释口径、提示年度汇算与身份升级建议，严禁自行算税。','你是税务解释助手。你会收到规则引擎的计算结果（JSON），请用通俗语言解释：怎么算的、为什么是这个数、年度汇算要注意什么、是否建议升级身份。不要重新计算任何数字，不要给出与 JSON 不同的金额。附政策文号。','[{"key":"monthly","label":"月收入（元）","type":"number","placeholder":"8000"},{"key":"question","label":"你的问题","type":"textarea","placeholder":"为什么我这个月预扣这么少？"}]','cost',1,'enterprise,opc,worker',4),
 ('opc_coach','OPC 成长教练','财税','fa-rocket','什么时候注册个体户 / 一人公司最划算','基于收入、客户结构与再投入计划，给出身份升级时点、主体形态与真实经营前置条件。','你是超级个体成长顾问。依据年收入、客户数、再投入计划，建议 L1 从业人员 / L2 个体户 / L3 一人公司路径。必须强调真实经营前提（多客户、自有工具、独立风险、按成果收费），警示转换收入性质风险。引用财税2023年第12号、新公司法第23条。','[{"key":"income","label":"年收入（元）","type":"number"},{"key":"clients","label":"客户数","type":"number"},{"key":"plan","label":"未来一年计划","type":"textarea"}]','balanced',1,'opc,worker',5),
 ('sales_copilot','AI 销售宝','销售','fa-bullseye','线索挖掘 · 话术生成 · 跟进提醒','输入客户画像与产品卖点，生成开场白、异议处理话术、跟进节奏与成交方案。','你是 B2B/B2C 销售教练。输出：1）客户画像洞察 2）三版开场白（电话/微信/邮件）3）五个常见异议与应对 4）7天跟进节奏 5）成交方案。语气专业、不夸大、不承诺不可兑现的效果。','[{"key":"product","label":"产品/服务","type":"textarea"},{"key":"customer","label":"目标客户","type":"text"},{"key":"scene","label":"场景","type":"text","placeholder":"首次触达 / 报价后跟进 / 挽回流失"}]','balanced',0,'enterprise,opc',10),
 ('ecom_copywriter','电商文案官','电商','fa-pen-nib','商品详情 · 主图文案 · 直播脚本 · 短视频脚本','一键生成多平台（抖音/小红书/淘宝/视频号）风格文案与脚本，自动规避广告法绝对化用语。','你是电商内容专家。按平台风格生成文案，严格规避《广告法》绝对化用语（最、第一、国家级、顶级、彻底、零风险等）。输出：标题 ×5、卖点三段式、直播口播 60 秒、短视频分镜 8 个镜头。标注"AI生成，发布前人工复核"。','[{"key":"product","label":"商品信息","type":"textarea"},{"key":"platform","label":"平台","type":"text","placeholder":"抖音 / 小红书 / 淘宝"},{"key":"tone","label":"语气","type":"text","placeholder":"专业 / 亲切 / 种草"}]','cost',0,'enterprise,opc',11),
 ('aigc_studio','AIGC 素材工坊','内容','fa-wand-magic-sparkles','商品主图 · 海报 · 短视频素材生成','调用文生图 / 文生视频模型批量生成电商素材，AI 生成内容自动加标识（2025年9月1日起施行的标识办法）。','你是 AIGC 提示词工程师。将用户的商品/场景描述改写为高质量英文图像生成提示词（含风格、光线、构图、分辨率），并给出 3 个变体与负面提示词。','[{"key":"desc","label":"画面描述","type":"textarea","placeholder":"白色陶瓷马克杯，北欧风木桌，晨光"},{"key":"ratio","label":"比例","type":"text","placeholder":"1:1 / 3:4 / 16:9"}]','balanced',0,'enterprise,opc',12),
 ('service_bot','智能客服数字员工','运营','fa-headset','7×24 售前售后应答 · 自动转人工','基于企业知识库回答客户问题，命中退款/投诉/法律风险自动转人工，人工客服占比目标 ≤30%。','你是企业客服数字员工。只依据提供的知识库回答；不确定时说"我帮您转人工"；涉及退款、投诉、法律纠纷、个人信息变更一律转人工。语气礼貌简洁。','[{"key":"kb","label":"知识库（粘贴 FAQ）","type":"textarea"},{"key":"question","label":"客户问题","type":"text"}]','cost',0,'enterprise,opc',13),
 ('ops_analyst','经营数据分析师','运营','fa-chart-line','把报表变成决策建议','粘贴销售/流量/成本数据，输出趋势解读、异常定位与三条可执行动作。','你是经营分析顾问。对数据做：1）关键指标摘要 2）趋势与异常 3）归因假设 4）三条可执行动作（含预期效果与风险）。不编造数据。','[{"key":"data","label":"数据（表格/CSV 文本）","type":"textarea"},{"key":"goal","label":"分析目标","type":"text"}]','quality',0,'enterprise,opc',14),
 ('hr_assistant','AI 人事助理','人事','fa-user-tie','岗位 JD · 面试题库 · 入离职清单 · 制度问答','生成 JD、结构化面试题、入离职办理清单，并解答劳动法常见问题（附条款）。','你是人力资源助理。生成内容需符合《劳动合同法》《劳动法》《最高法劳动争议解释（二）》。涉及辞退、经济补偿、社保等问题附法条，并提示"具体以当地人社部门口径与律师意见为准"。','[{"key":"task","label":"需求","type":"textarea","placeholder":"写一份直播运营岗 JD / 员工试用期不合格如何处理"}]','balanced',0,'enterprise',15),
 ('finance_assistant','AI 财务助理','财税','fa-file-invoice-dollar','发票合规检查 · 费用报销规则 · 凭证包解读','检查发票四流一致、判断费用能否税前扣除、解读五流合一凭证包。','你是企业财务合规助理。依据《企业所得税税前扣除凭证管理办法》（2018年第28号）、《增值税法》判断凭证合规性与可扣除性。输出：结论、依据、风险、建议动作。不替代注册税务师意见。','[{"key":"case","label":"业务描述","type":"textarea","placeholder":"向平台支付 15 万元灵活用工报酬，取得 5% 服务费专票 + 凭证包…"}]','quality',0,'enterprise,opc',16),
 ('site_builder','轻站搭建助手','运营','fa-globe','5 分钟生成企业官网 / 落地页结构与文案','输入企业信息，输出官网信息架构、各板块文案、SEO 关键词与 CTA 设计。','你是网站策划师。输出：站点地图、首页六屏结构（Hero/痛点/方案/案例/信任/CTA）、每屏文案、SEO 标题与描述、表单字段建议。规避广告法绝对化用语。','[{"key":"company","label":"企业与业务","type":"textarea"},{"key":"goal","label":"网站目标","type":"text","placeholder":"获客 / 品牌 / 招商"}]','balanced',0,'enterprise,opc',17),
 ('policy_matcher','政策补贴匹配官','政务','fa-landmark','匹配可申报的产业政策与补贴','基于地区、行业、规模、OPC/小微身份，列出可申报政策、条件、材料与时间窗口。','你是产业政策顾问。基于地区与企业画像列出可能适用的政策类型（高企、专精特新、小微普惠、OPC扶持、算力补贴、灵活就业补贴等），说明条件、材料、申报窗口与注意事项。明确"以官方最新发布为准，需逐项核实"。不承诺获批。','[{"key":"region","label":"地区","type":"text"},{"key":"profile","label":"企业/个人画像","type":"textarea"}]','balanced',0,'enterprise,opc',18),
 ('pitch_coach','路演 BP 教练','融资','fa-presentation-screen','SCQA 结构 BP 大纲与投资人问答','按情境-冲突-问题-答案重构商业计划书大纲，并模拟投资人十问。','你是融资顾问。输出：16 页 BP 大纲（SCQA）、每页核心信息、投资人十个尖锐问题与建议回答、需补充的数据。不得编造财务数据。','[{"key":"biz","label":"业务简介","type":"textarea"},{"key":"stage","label":"融资阶段","type":"text"}]','quality',0,'enterprise,opc',19);

-- AI 服务集市目录
INSERT OR IGNORE INTO ai_catalog (section,title,subtitle,description,tags,price_text,price_credits,provider,delivery_days,rating,sold,sort) VALUES
 -- 项目超市：标准化 AI 项目模板
 ('project','AI 智能客服落地包','知识库搭建 + 数字员工上线 + 转人工策略','含 FAQ 清洗、向量化、对话流设计、7 天试运行与效果报告','客服,RAG,降本','¥9,800 起',980000,'平台交付团队',14,4.9,126,1),
 ('project','电商 AIGC 素材流水线','主图 / 详情 / 短视频批量生成 SOP','建立品牌风格提示词库，日产 200+ 素材，含 AI 标识合规','电商,AIGC,内容','¥6,800 起',680000,'平台交付团队',10,4.8,203,2),
 ('project','企业私有知识库 + 问答助手','内部制度 / 合同 / 产品手册可问答','数据不出域，境内备案模型，支持权限分级','知识库,RAG,私有化','¥19,800 起',1980000,'平台交付团队',21,4.9,58,3),
 ('project','AI 销售线索挖掘系统','公开信息抓取 + 画像 + 话术 + CRM 回写','合法合规数据源，日均 500 条线索评分','销售,增长','¥12,800 起',1280000,'认证服务商·增长工场',14,4.7,74,4),
 ('project','灵活用工合规体检（人工 + AI）','税务师 + 律师 + 诊断 Agent 联合出具','用工结构三层优化方案 + 扣除凭证合规意见书','合规,体检','¥29,800',2980000,'合规委员会',7,5.0,41,5),
 -- 服务集市：服务商 / 开发者 / 工具商
 ('service','MCP 工具：电商平台数据连接器','抖店 / 淘宝 / 拼多多订单与评价数据 MCP','一次接入，Agent 可直接调用；数据可用不可见','MCP,电商,数据','¥299/月',29900,'认证开发者·DataBridge',1,4.8,312,10),
 ('service','MCP 工具：企业工商 / 司法 / 税务信用查询','企业入驻尽调自动化','对接公开数据源，输出风险画像','MCP,尽调,风控','¥199/月 + ¥0.5/次',19900,'认证开发者·信源科技',1,4.9,540,11),
 ('service','Skill：广告法合规审校','文案自动检出绝对化用语并改写','内置 2026 版禁用词库','Skill,合规,内容','¥99/月',9900,'认证开发者·合规实验室',1,4.9,890,12),
 ('service','Skill：发票 OCR + 四流一致校验','发票识别、验真、与合同/付款匹配','输出可扣除性结论','Skill,财务,OCR','¥0.3/张',30,'认证开发者·票据云',1,4.8,1200,13),
 ('service','Agent：直播间实时话术助手','根据弹幕与库存实时生成口播','低延迟模型，边播边提示','Agent,直播','¥599/月',59900,'认证开发者·播客AI',1,4.7,167,14),
 ('service','Agent Studio 低代码封装上架','30 分钟把你的工作流封装为可售 Agent','分销网络帮你卖，法币 + Token 双轨分佣','开发者,上架,分佣','免费上架 · 成交抽佣 15%',0,'平台',0,4.8,96,15),
 -- AI 人才
 ('talent','AI 应用工程师（RAG / Agent）','3-5 年 · 可按项目外包','深圳 / 远程 · 擅长 LangGraph、向量库、工具调用','人才,工程师','¥800-1,500/人天',120000,'平台人才库',0,4.9,32,20),
 ('talent','AI 电商运营专家','直播 + 短视频 + AIGC 内容','杭州 · 曾操盘年 GMV 2 亿店铺','人才,运营','¥600-1,000/人天',80000,'平台人才库',0,4.8,45,21),
 ('talent','提示词工程师 / AI 训练师','Prompt 体系 + 评测集建设','远程 · 可兼职按任务结算（走平台合规结算）','人才,Prompt','¥300-600/人天',45000,'平台人才库',0,4.7,88,22),
 ('talent','AI 数据标注团队（50 人）','对话 / 图像 / 视频标注，质检合格率 ≥95%','按合格条数结算，平台累计预扣','人才,标注','¥0.3-2/条',0,'平台任务工厂',0,4.9,210,23),
 -- 特色专区：行业场景化方案
 ('vertical','直播电商 / MCN 行业包','主播灵活用工合规 + AI 话术 + 素材生成 + 场控数字员工','含主播非劳动关系论证模板与分成核对','直播,MCN','方案咨询',0,'行业方案组',0,4.9,67,30),
 ('vertical','AI 数据标注"任务工厂"','标注任务发布 → 质检 Agent 抽检 → 按合格条数结算 → 累计预扣','企业综合成本较劳动合同用工降低约 20%（以形态适配为前提）','标注,任务工厂','方案咨询',0,'行业方案组',0,5.0,39,31),
 ('vertical','教育培训 / AI 陪练','兼职讲师合规结算 + AI 口语陪练 + 课程 AIGC','机构在职教师排除规则','教育','方案咨询',0,'行业方案组',0,4.8,28,32),
 ('vertical','软件众包 / AI 应用开发','里程碑计价 + 代码仓库交付证据 + AI Code Review','OPC 开票路径','软件,众包','方案咨询',0,'行业方案组',0,4.8,51,33),
 ('vertical','设计文创 / 广告创意','按稿计价 + 交付查重 + 版权约定 + AIGC 辅助','版权归属条款模板','设计','方案咨询',0,'行业方案组',0,4.7,44,34),
 -- 政策政府：产业政策 / 补贴 / 资质
 ('policy','OPC / 超级个体专项扶持匹配','深圳 / 上海 / 杭州 / 北京 / 苏州 / 海南','免租工位、算力补贴、创业资助，匹配后协助申报','OPC,补贴','免费匹配 · 申报服务另计',0,'政企合作部',0,4.8,154,40),
 ('policy','算力券 / AI 算力补贴申报','地方算力券抵扣平台算力消费','按地区政策最高抵扣 30%-50%','算力,补贴','免费匹配',0,'政企合作部',0,4.9,98,41),
 ('policy','小微企业 / 个体户税收优惠落地核查','财税 2023 年第 12 号等','核查是否应享未享，附整改清单','税收优惠','¥999',99900,'合规委员会',3,4.9,220,42),
 ('policy','区域 AI 服务中心共建（政府 / 产业园）','算力调度 + 企业上云 + 政策对接 + 招商抓手','本地化部署、联合运营、按效果与规模收费','政府,园区','合作洽谈',0,'政企合作部',0,5.0,6,43),
 ('policy','校企 AI 人才实训基地','课程工具箱 + 实训任务 + 产学研撮合','学生通过平台合规接单积累经验与收入','校企,实训','合作洽谈',0,'政企合作部',0,4.9,12,44),
 -- 投融路演
 ('roadshow','AI 项目路演季（季度）','项目展示 + 投资人闭门对接','SCQA 叙事辅导、BP 复核、数据室搭建','路演,融资','入围免费',0,'资本生态部',0,4.8,18,50),
 ('roadshow','OPC 创业者加速营','6 周：定位 → 产品 → 获客 → 合规 → 融资','导师制，结营路演','加速营,OPC','¥4,980',498000,'资本生态部',42,4.9,63,51),
 -- 轻站：建站 · 运营 · 数据 · 集成
 ('site','轻站 · 企业官网 / 落地页','AI 生成结构与文案，一键发布','含 SEO、表单线索、数据看板','建站','¥99/月起',9900,'平台',1,4.8,780,60),
 ('site','轻站 · 电商小程序 / 商城','商品、订单、会员、营销工具','对接主流支付与物流','商城','¥999/月起',99900,'平台',3,4.7,230,61),
 ('site','轻站 · 数据看板与集成','打通 ERP / CRM / 电商后台','统一数据口径，Agent 可读','集成,数据','¥199/月起',19900,'平台',2,4.8,310,62),
 -- 托盘赋能：ToC / OPC 创业者
 ('tray','合规货盘 + 选品指导','源头供应链、一件代发、品控','含资质文件与售后 SOP','货盘,选品','0 库存起步',0,'供应链合作伙伴',0,4.7,420,70),
 ('tray','店铺起号实操任务包','店铺注册 · 账号搭建 · 短视频拍摄 · 直播出镜 · 客户咨询','合伙人执行，平台托底，按任务合规结算','起号,实操','按任务计价',0,'运营导师团',0,4.8,350,71),
 ('tray','运营导师统一培训','标准化 SOP + 周复盘','结业后进入平台任务大厅优先派单','培训,SOP','¥1,980',198000,'运营导师团',14,4.9,260,72),
 -- 算力中心：算力产品
 ('compute','Token 充值包 · 入门','¥99 = 9,900 Credits + 990 返 Token','适合试用与小团队','算力,充值','¥99',9900,'算力网关',0,4.9,2100,80),
 ('compute','Token 充值包 · 专业','¥999 = 99,900 Credits + 14,985 返 Token（15%）','企业日常 AI 办公','算力,充值','¥999',99900,'算力网关',0,4.9,860,81),
 ('compute','企业订阅 · Pro','¥1,999/月：50 万 Credits + 专属速率 + 境内池优先 + DLP 严格模式','含用量报表与合规报告','算力,订阅','¥1,999/月',199900,'算力网关',0,4.8,140,82),
 ('compute','企业订阅 · Enterprise','私有网关 / BYOK / 数据不出域 / 专属客户成功','按年签约','算力,私有化','¥9,999/月起',999900,'算力网关',0,5.0,22,83),
 ('compute','GPU 算力租用（NVIDIA / 昇腾 / 寒武纪）','按卡时计费，境内 IDC 统一调度','微调 / 推理 / 训练','GPU,算力','¥6-28/卡时',0,'算力网关',0,4.8,64,84);

-- 演示钱包
INSERT OR IGNORE INTO ai_wallets (id,owner_type,owner_id,credits,bonus_tokens,plan,routing_policy,pool_policy,dlp_level,api_key,total_recharged,total_spent) VALUES
 (1,'enterprise',1,86500,12000,'pro','balanced','domestic_first','strict','cw-ent1-' || lower(hex(randomblob(12))),120000,33500),
 (2,'enterprise',2,9900,990,'free','cost','domestic_only','standard','cw-ent2-' || lower(hex(randomblob(12))),9900,0),
 (3,'opc',1,4200,600,'basic','balanced','domestic_first','standard','cw-opc1-' || lower(hex(randomblob(12))),9900,5700),
 (4,'opc',2,990,99,'free','cost','domestic_only','standard','cw-opc2-' || lower(hex(randomblob(12))),0,0);

INSERT OR IGNORE INTO ai_wallet_txns (wallet_id,type,amount,cny,remark) VALUES
 (1,'recharge',99900,999,'Token 充值包 · 专业'),(1,'bonus',14985,0,'消费返 Token 15%'),(1,'plan',-19990,0,'企业订阅 Pro 首月'),(1,'spend',-13510,0,'10 月模型调用'),
 (3,'recharge',9900,99,'Token 充值包 · 入门'),(3,'bonus',990,0,'消费返 Token'),(3,'spend',-5700,0,'文案与素材生成');

INSERT OR IGNORE INTO ai_usage (wallet_id,owner_type,owner_id,user_name,agent_key,model_id,provider_key,pool,route_reason,tokens_in,tokens_out,credits,latency_ms,dlp_action,status,created_at) VALUES
 (1,'enterprise',1,'星河传媒·HR总监','compliance_doctor','deepseek-v4-pro','suanli','domestic','敏感业务（薪酬）→ 境内池 · 质量优先',1820,2410,2.29,4200,'desensitize','ok','2026-10-08 10:12:00'),
 (1,'enterprise',1,'星河传媒·HR总监','ecom_copywriter','doubao-pro-32k','suanli','domestic','成本优先 · 电商文案标签匹配',640,1180,0.29,1800,'pass','ok','2026-10-08 14:30:00'),
 (1,'enterprise',1,'星河传媒·HR总监','aigc_studio','doubao-seedream-4-0-250828','suanli','domestic','图像任务 · 境内池',120,0,25,6100,'pass','ok','2026-10-09 09:05:00'),
 (1,'enterprise',1,'星河传媒·HR总监','service_bot','doubao-lite-32k','suanli','domestic','成本优先 · 客服',380,210,0.02,620,'pass','ok','2026-10-09 16:40:00'),
 (1,'enterprise',1,'星河传媒·HR总监',NULL,'gpt-4o','suanli','overseas','用户指定海外模型 · 无敏感命中',900,700,1.5,2300,'pass','ok','2026-10-10 11:20:00'),
 (1,'enterprise',1,'星河传媒·HR总监','sales_copilot','qwen-plus','suanli','domestic','提示词注入命中 → 阻断',210,0,0,90,'block','blocked','2026-10-10 15:02:00'),
 (3,'opc',1,'林深·超级个体','ecom_copywriter','qwen3.6-flash','suanli','domestic','成本优先',520,980,0.13,1100,'pass','ok','2026-10-09 20:10:00'),
 (3,'opc',1,'林深·超级个体','opc_coach','deepseek-v4-flash','suanli','domestic','均衡',760,1320,0.3,2600,'pass','ok','2026-10-10 09:30:00');
