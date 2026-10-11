INSERT OR IGNORE INTO ai_providers (id,key,name,base_url,api_key,protocol,pool,priority,status,features,remark,env_var,default_model,docs_url) VALUES
 (3,'deepseek','DeepSeek 官方','https://api.deepseek.com/v1',NULL,'openai','domestic',2,'mock','{"chat":1}','DeepSeek 官方 API（境内）· deepseek-chat / deepseek-reasoner · OpenAI 兼容','DEEPSEEK_API_KEY','deepseek-chat','https://platform.deepseek.com/api_keys'),
 (4,'platform_llm','平台内置算力（托管）','https://www.genspark.ai/api/llm_proxy/v1',NULL,'openai','overseas',5,'mock','{"chat":1}','平台托管的大模型通道（GPT-5 系列），开箱即用；敏感业务默认不走此池','PLATFORM_LLM_API_KEY','gpt-5-mini','');
UPDATE ai_providers SET env_var='SUANLI_API_KEY', default_model='deepseek-v4-flash', docs_url='https://www.suanli.com' WHERE key='suanli';
UPDATE ai_providers SET env_var='OPENAI_API_KEY_BYOK', default_model='gpt-4o' WHERE key='byok_openai';

INSERT OR IGNORE INTO ai_models (model_id,display_name,provider_key,vendor,type,pool,context_k,price_in,price_out,quality,latency,cost,tags,sort) VALUES
 ('deepseek-chat','DeepSeek V3.2 Chat（官方）','deepseek','DeepSeek','chat','domestic',128,0.2,0.3,4,4,4,'官方直连,通用,代码,文案',5),
 ('deepseek-reasoner','DeepSeek R1 Reasoner（官方）','deepseek','DeepSeek','reasoning','domestic',128,0.4,1.6,5,2,3,'官方直连,深度推理',6),
 ('gpt-5-mini','GPT-5 mini（平台托管）','platform_llm','OpenAI','chat','overseas',400,0.25,2,4,4,4,'托管,均衡,开箱即用',58),
 ('gpt-5','GPT-5（平台托管）','platform_llm','OpenAI','chat','overseas',400,1.25,10,5,3,2,'托管,旗舰',57),
 ('gpt-5-nano','GPT-5 nano（平台托管）','platform_llm','OpenAI','chat','overseas',400,0.05,0.4,3,5,5,'托管,极速,低成本',59);
-- 原 suanli 上的 deepseek-reasoner 与官方重名：改名区分
UPDATE ai_models SET model_id='deepseek-reasoner', provider_key='deepseek' WHERE model_id='deepseek-reasoner';
