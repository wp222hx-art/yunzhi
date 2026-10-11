-- 云工智合佳 · 演示种子数据
INSERT OR IGNORE INTO enterprises (id,name,credit_code,taxpayer_type,industry,region,contact_name,contact_phone,service_rate,social_config) VALUES
 (1,'星河直播文化传媒有限公司','91440300MA5F8K2X1A','general','直播电商/MCN','深圳','李经理','13800000001',0.05,
  '{"pension":{"p":0.08,"e":0.16},"medical":{"p":0.02,"e":0.08},"unemployment":{"p":0.005,"e":0.005},"injury":{"p":0,"e":0.002},"maternity":{"p":0,"e":0.0045},"housing":{"p":0.07,"e":0.07},"base_min":2520,"base_max":30000}'),
 (2,'智数标注科技（杭州）有限公司','91330100MA2H9L3Y2B','small','AI数据标注','杭州','王总','13800000002',0.05,
  '{"pension":{"p":0.08,"e":0.14},"medical":{"p":0.02,"e":0.095},"unemployment":{"p":0.005,"e":0.005},"injury":{"p":0,"e":0.002},"maternity":{"p":0,"e":0},"housing":{"p":0.12,"e":0.12},"base_min":4462,"base_max":24930}');

INSERT OR IGNORE INTO users (id,username,password_hash,salt,role,display_name,enterprise_id,opc_id) VALUES
 (1,'admin','7d2172814719957c5876fc15f5001c48fb56238d5f8f2f1f5e77d379b0650182','s_admin','admin','平台合规管理员',NULL,NULL),
 (2,'hr_demo','4b33d5b1d7346c0c7c1f599fbbb4d2800670ea68aabe8cc31bf288bd24788ff0','s_hr_demo','enterprise','星河传媒·HR总监',1,NULL),
 (3,'opc_demo','c5dcaa1a980f53edeae0f1d29c971b484d06c69da36cac449389558c6b6f8c9e','s_opc_demo','opc','林深·超级个体',NULL,1);

INSERT OR IGNORE INTO workers (id,name,id_no,phone,bank_account,verified,verified_at,authorized_filing,region,skills,opc_id) VALUES
 (1,'林深','440305199001011234','13900000001','6222********1001',1,'2026-09-01 10:00:00',1,'深圳','短视频剪辑,直播运营',1),
 (2,'周小雨','330106199505052345','13900000002','6222********1002',1,'2026-09-02 10:00:00',1,'杭州','数据标注,质检',NULL),
 (3,'陈默','110101199208083456','13900000003','6222********1003',1,'2026-09-03 10:00:00',1,'北京','全栈开发,AI应用',NULL),
 (4,'赵子涵','440106199811114567','13900000004','6222********1004',1,'2026-09-05 10:00:00',1,'广州','平面设计,UI',NULL),
 (5,'吴倩','320102199703035678','13900000005','6222********1005',0,NULL,0,'南京','文案策划',NULL);

-- 企业1 三层用工结构
INSERT OR IGNORE INTO employees (id,enterprise_id,name,id_no,phone,layer,employment_type,position,department,base_salary,hourly_rate,social_base,housing_base,special_deduction,start_date,worker_id) VALUES
 (1,1,'张伟','440301198801011111','13700000001','core','fulltime','运营总监','运营中心',25000,0,25000,25000,3000,'2023-03-01',NULL),
 (2,1,'李娜','440302199002022222','13700000002','core','fulltime','财务经理','财务部',18000,0,18000,18000,2000,'2022-06-15',NULL),
 (3,1,'王强','440303199303033333','13700000003','core','fulltime','技术主管','技术部',22000,0,22000,22000,1000,'2024-01-10',NULL),
 (4,1,'刘洋','440304199604044444','13700000004','core','fulltime','内容编导','内容部',12000,0,12000,12000,0,'2024-08-01',NULL),
 (5,1,'孙丽','440305199905055555','13700000005','flex','parttime','场控助理','直播部',0,45,0,0,0,'2025-11-01',NULL),
 (6,1,'周杰','440306199706066666','13700000006','flex','parttime','仓储理货','供应链',0,38,0,0,0,'2026-01-15',NULL),
 (7,1,'外包-深圳美术工作室','','','flex','outsource','视觉包装外包','内容部',30000,0,0,0,0,'2026-03-01',NULL),
 (8,1,'林深','440305199001011234','13900000001','task','platform','兼职主播','直播部',0,0,0,0,0,'2026-09-01',1),
 (9,1,'赵子涵','440106199811114567','13900000004','task','platform','海报设计','内容部',0,0,0,0,0,'2026-09-05',4),
 (10,1,'陈默','110101199208083456','13900000003','task','platform','小程序开发','技术部',0,0,0,0,0,'2026-09-03',3);

-- 企业2
INSERT OR IGNORE INTO employees (id,enterprise_id,name,id_no,phone,layer,employment_type,position,department,base_salary,hourly_rate,social_base,housing_base,special_deduction,start_date,worker_id) VALUES
 (11,2,'郑一鸣','330101199001010001','13600000001','core','fulltime','项目经理','交付部',16000,0,16000,16000,1500,'2024-02-01',NULL),
 (12,2,'钱多多','330102199505050002','13600000002','core','fulltime','质检主管','质量部',13000,0,13000,13000,0,'2024-05-01',NULL),
 (13,2,'周小雨','330106199505052345','13900000002','task','platform','数据标注员','标注中心',0,0,0,0,0,'2026-09-02',2);

-- 任务
INSERT OR IGNORE INTO tasks (id,enterprise_id,title,category,description,pricing_mode,unit_price,quantity,budget,deliverable_spec,acceptance_std,risk_score,risk_level,status,deadline) VALUES
 (1,1,'双11预热直播·专场主播（10场）','直播电商','按场次计价，每场2小时，提供直播回放与GMV报表','piece',1500,10,15000,'直播回放链接、场次GMV截图','每场完整播出且GMV≥5000元',18,'green','published','2026-11-10'),
 (2,1,'品牌视觉海报设计（20张）','设计创意','按稿件计价，含3轮修改','piece',600,20,12000,'源文件PSD/AI + 导出JPG','符合品牌VI规范并通过验收',12,'green','published','2026-10-31'),
 (3,1,'会员小程序V2开发（里程碑3个）','软件众包','按里程碑交付：原型→开发→上线','milestone',20000,3,60000,'代码仓库提交记录 + 测试报告','功能验收通过、无P0缺陷',22,'green','published','2026-12-15'),
 (4,2,'对话数据标注包（5万条）','AI数据标注','按合格条数计价，质检抽样10%','piece',0.6,50000,30000,'标注平台导出JSONL','质检合格率≥95%',10,'green','published','2026-10-25'),
 (5,1,'直播部坐班客服（固定月薪）','客服','要求每日9:00-18:00在岗打卡，月薪6000元','time',6000,1,6000,'','',86,'red','blocked','2026-12-31');

INSERT OR IGNORE INTO task_orders (id,task_id,worker_id,contract_no,contract_hash,status,quantity_done,amount,deliverable_desc,deliverable_hash,delivered_at,accepted_at,accepted_by) VALUES
 (1,1,1,'CT20261001-0001','a3f1c9e2d4b57f6081a2c3d4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f801','accepted',6,9000,'6场直播回放及GMV报表','9b1e...f8a2','2026-10-06 22:10:00','2026-10-07 10:30:00','李经理'),
 (2,2,4,'CT20261002-0002','b4e2d0f3e5c68a7192b3d4e5f6071829a3b4c5d6e7f8901a2b3c4d5e6f7a8912','accepted',12,7200,'12张海报源文件','7c2d...a1b9','2026-10-05 18:00:00','2026-10-06 09:20:00','李经理'),
 (3,3,3,'CT20261003-0003','c5f3e1a4f6d79b82a3c4d5e6f708192ab4c5d6e7f8901a2b3c4d5e6f7a8b9023','delivered',1,20000,'里程碑1：原型与技术方案','5d3e...c0a7','2026-10-09 15:00:00',NULL,NULL),
 (4,4,2,'CT20261004-0004','d6a4f2b5a7e80c93b4d5e6f7081920abc5d6e7f8901a2b3c4d5e6f7a8b9c0134','accepted',21000,12600,'21000条合格标注','2e4f...b8c6','2026-10-08 20:00:00','2026-10-09 11:00:00','王总');

-- 结算记录（9月历史，用于累计预扣演示）
INSERT OR IGNORE INTO settlements (id,settlement_no,enterprise_id,worker_id,task_order_id,period,amount,service_fee,vat,surcharge,iit,net,cum_income,cum_tax,status,paid_at) VALUES
 (1,'ST202609-0001',1,1,NULL,'2026-09',12000,600,0,0,0,12000,12000,0,'filed','2026-09-28 10:00:00'),
 (2,'ST202609-0002',1,4,NULL,'2026-09',4800,240,0,0,0,4800,4800,0,'filed','2026-09-28 10:00:00'),
 (3,'ST202609-0003',2,2,NULL,'2026-09',6600,330,0,0,0,6600,6600,0,'filed','2026-09-28 10:00:00');

-- 委托代征协议
INSERT OR IGNORE INTO collection_agreements (id,agreement_no,tax_authority,region,tax_types,scope,start_date,end_date,status,remark) VALUES
 (1,'WTDZ-SZ-2025-0168','国家税务总局深圳市南山区税务局','深圳','vat,surcharge','平台内自然人从业人员提供劳务取得收入的增值税及附加（代办申报口径）','2025-10-01','2028-09-30','active','依据税务总局2025年第16号公告代办申报'),
 (2,'WTDZ-HZ-2025-0092','国家税务总局杭州市余杭区税务局','杭州','vat,surcharge','平台内自然人从业人员','2025-10-01','2028-09-30','active','');

-- OPC
INSERT OR IGNORE INTO opcs (id,name,entity_type,credit_code,owner_name,owner_id_no,owner_worker_id,registered_capital,paid_capital,region,industry,owner_salary,owner_social_base,owner_special_deduction,bookkeeping_fee,stage) VALUES
 (1,'深圳林深数字创意有限公司','company','91440300MA5GX9Q7XK','林深','440305199001011234',1,100000,100000,'深圳','数字内容/直播运营',6000,6000,1000,5000,'L3'),
 (2,'周小雨（个体工商户）','sole_proprietor','92330100MA2KXXXX','周小雨','330106199505052345',2,0,0,'杭州','数据服务',0,0,0,2400,'L2');

INSERT OR IGNORE INTO opc_incomes (id,opc_id,period,client_name,enterprise_id,amount,invoice_type,invoice_no,project,income_date) VALUES
 (1,1,'2026-09','星河直播文化传媒有限公司',1,38000,'special','04420260900001','9月直播运营服务','2026-09-25'),
 (2,1,'2026-09','某美妆品牌','',22000,'normal','04420260900002','短视频内容包','2026-09-28'),
 (3,1,'2026-10','星河直播文化传媒有限公司',1,42000,'special','04420261000003','10月直播运营服务','2026-10-08'),
 (4,1,'2026-10','某教育机构',NULL,15000,'normal','04420261000004','课程视频剪辑','2026-10-09'),
 (5,2,'2026-09','智数标注科技（杭州）有限公司',2,18000,'normal','03320260900011','标注项目分包','2026-09-26'),
 (6,2,'2026-10','某AI初创公司',NULL,9000,'normal','03320261000012','评测数据集','2026-10-07');

INSERT OR IGNORE INTO opc_expenses (id,opc_id,period,category,amount,has_voucher,remark,expense_date) VALUES
 (1,1,'2026-09','设备与软件',6800,1,'剪辑工作站+Adobe订阅','2026-09-03'),
 (2,1,'2026-09','办公场地',3000,1,'共享工位','2026-09-05'),
 (3,1,'2026-09','外协费用',9000,1,'摄影师分包','2026-09-20'),
 (4,1,'2026-10','算力与AI工具',2600,1,'AI视频生成额度','2026-10-02'),
 (5,1,'2026-10','办公场地',3000,1,'共享工位','2026-10-05'),
 (6,1,'2026-10','差旅',1850,1,'客户拍摄差旅','2026-10-08'),
 (7,2,'2026-09','软件订阅',600,1,'标注工具','2026-09-10'),
 (8,2,'2026-10','软件订阅',600,1,'标注工具','2026-10-10');

-- 政策库
INSERT OR IGNORE INTO policies (id,title,doc_no,effective_date,category,summary,impact) VALUES
 (1,'互联网平台企业涉税信息报送规定','国务院令第810号','2025-06','涉税报送','平台须报送平台内经营者与从业人员身份及收入信息','数据透明化是常态，任何拆分/隐匿收入都会被系统比对识别'),
 (2,'关于互联网平台企业报送涉税信息有关事项的公告','税务总局公告2025年第15号','2025-07','涉税报送','明确涉税信息报送口径与流程','报送《平台基本信息报送表》是适用16号公告的前提'),
 (3,'关于互联网平台企业为平台内从业人员办理扣缴申报、代办申报若干事项的公告','税务总局公告2025年第16号','2025-10-01','个税/增值税','劳务报酬按累计预扣法；增值税代办申报，月10万元以下免征、3%减按1%；凭扣缴/代办完税凭证据实税前扣除','平台核心合法性依据；业务真实性材料缺失=凭证不得扣除'),
 (4,'中华人民共和国增值税法及实施条例','国务院令第826号','2026-01-01','增值税','自然人发生应税交易，支付价款的境内单位为扣缴义务人','需厘清用工企业付款与平台代办的责任边界'),
 (5,'增值税法施行后增值税优惠政策衔接事项的公告','财政部 税务总局公告2026年第10号','2026-01-30','增值税','小规模月销售额10万元起征点延续至2027年底；自然人按次起征点提至1000元','OPC/个人税负测算基准；禁止拆单'),
 (6,'最高法劳动争议司法解释（二）','法释〔2025〕','2025-09-01','劳动关系','关联公司混同用工承担连带责任；约定不缴社保无效','全职转灵工、多主体交替发薪风险显著上升'),
 (7,'小型微利企业和个体工商户所得税优惠政策','财政部 税务总局公告2023年第12号','2023-01-01','所得税','小微企业年应纳税所得额300万元以内实际税负5%；个体户200万元以内减半','OPC成长路径的政策底座，执行至2027-12-31'),
 (8,'企业所得税税前扣除凭证管理办法','税务总局公告2018年第28号','2018-07-01','企业所得税','税前扣除凭证的种类、取得时间与要求','凭证包设计依据'),
 (9,'个人所得税扣缴申报管理办法（试行）','税务总局公告2018年第61号','2019-01-01','个税','工资薪金累计预扣法、劳务报酬预扣预缴规则','工资薪金与劳务报酬计算引擎依据');

INSERT OR IGNORE INTO platform_settings (key,value,description) VALUES
 ('iit_basic_deduction','5000','个税每月基本减除费用'),
 ('labor_expense_ratio','0.2','劳务报酬费用扣除比例（16号公告累计预扣）'),
 ('vat_small_threshold_month','100000','小规模月销售额免征起征点'),
 ('vat_small_rate','0.01','小规模3%减按1%'),
 ('vat_per_time_threshold','1000','自然人按次起征点'),
 ('surcharge_rate','0.06','附加税费合计（城建7%+教育3%+地方2%，减半后约6%）'),
 ('platform_service_rate','0.05','平台技术服务费默认费率'),
 ('cit_small_rate','0.05','小型微利企业实际税负'),
 ('dividend_tax_rate','0.20','股息红利个税'),
 ('register_guide_threshold','5000000','连续12个月累计超500万元须引导登记市场主体'),
 ('client_concentration_alert','0.7','OPC单一客户收入占比预警线');

INSERT OR IGNORE INTO audit_logs (user_name,role,action,target,detail) VALUES
 ('系统','system','INIT','platform','平台初始化完成，加载演示数据');
