# 数据边界 / Data boundary

保留Worker/Vue源码、D1 schema、模板和文档。Worker secrets、D1邮件/账号数据、JWT/Admin秘密、真实wrangler.toml、.dev.vars、.env运行配置、日志与备份不提交。

Keep source, schema, templates and documentation in Git. Keep Worker secrets, D1 mail/account data, credentials, live wrangler.toml, .dev.vars, environment files, logs and backups local or in the authorized service secret store.

`frontend/.env.pages`只从Git索引移除，原文件保留本地；使用`.env.pages.example`创建自己的配置。所有VITE变量都可能进入前端包，因此不得放秘密。`VITE_API_BASE`是公开服务地址，分析token也不应当作服务端认证密钥。

The existing pages environment file is retained locally and untracked. Copy `.env.pages.example` for a new deployment. VITE values are public build inputs; never place server credentials there.

恢复在新目录从bundle恢复源码；D1生产备份/恢复另行授权，本轮未调用部署、DNS、数据库迁移或邮件发送。
Restore source in a new directory from the verified bundle. Production D1 backup/restore requires a separate operational window; this cleanup does not deploy, change DNS, migrate D1 or send mail.
