# 工作台域名邮箱

[English](README_EN.md)

这是 [Free 权益工作台](https://github.com/wangjundsg/gpt-free-service) 使用的域名邮箱服务，基于 dreamhunter2333/cloudflare_temp_email 的 MIT fork。本地目录为 `cloudflare_temp_email_edit`，GitHub 仓库为 `wangjundsg/cloudflare_temp_email`。

## 当前用途

为账号邮箱换绑提供目标地址、收件和验证码。主工作台处理换绑任务、账号身份核对和结果落账；此服务管理域名地址和邮件。iCloud 邮箱工作台继续承担当前注册来源，两者不混作一个库存。

采用的核心组成是 Worker API、D1 邮件数据、Email Routing 收件、邮件解析和管理前端。上游的公共演示、推广链接和其他可选产品能力不作为本工作台功能列表。

## 配置关系

| 部分 | 本机/部署配置 | 用途 |
| --- | --- | --- |
| Worker | 从 `worker/wrangler.toml.template` 建立私有配置，核对 D1 和域名绑定 | 邮件 API 与收件处理 |
| 前端 | 从 `frontend/.env.pages.example` 建立本地 `.env.pages` | 指向自己的 Worker API；VITE 变量进入浏览器，不得放管理员秘密 |
| 主工作台 | 配置 Cloudflare 管理入口、鉴权和已验证目标域名 | 请求地址与收取换绑验证码 |

管理接口、地址 JWT 和可选全局密码各自有鉴权语义，按现有部署配置使用。具体 API 和部署字段仍可查阅仓库内 `vitepress-docs/docs/zh/` 技术参考；该上游参考不代表每项能力在主工作台启用。

## 验证

```powershell
npm --prefix worker run lint
npm --prefix frontend run build:release
```

Worker 常规 build 需要自己的 Wrangler 配置。无生产配置时的显式入口 dry-run 见 [STATUS](STATUS.md)；它只验证打包，不部署服务。DNS、D1 迁移和真实收件需在部署时单独核对。

## 维护边界

保留上游来源与 MIT LICENSE；现有 fork 关系不变。地址、邮件、管理员凭据、Worker secrets、真实 Pages 配置不提交。状态、分支与边界见 [STATUS](STATUS.md)、[BRANCHES](BRANCHES.md)、[DATA-BOUNDARY](DATA-BOUNDARY.md)、[VENDOR](VENDOR.md)。

旧上游首页与宣传说明移入[归档仓库](https://github.com/wangjundsg/gpt-workbench-archive/tree/main/snapshots/cloudflare_temp_email_edit)。本 README 只维护与当前工作台相关的用途。
