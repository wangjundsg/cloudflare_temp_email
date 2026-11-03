# 当前状态 / Status

2026-11-03：maintenance，主工作台的域名邮箱/换绑基础设施。Maintained domain-mail infrastructure for gpt-free-service.

本轮仅整理说明和私有环境边界；Worker与前端业务源码无新增功能改动。Worker ESLint、前端example模式构建均通过；Worker在显式指定入口和兼容标记的dry-run打包中通过。No new application features; ESLint, example frontend build and explicit-entry Worker dry-run bundling passed.

原`npm --prefix worker run build`在缺本地wrangler.toml时触发Hono自动配置失败；直接把`.toml.template`传给Wrangler也没有被当作正式配置解析。本轮不修改生产配置，改用下面的纯打包命令验证源码（在worker目录执行）：

```powershell
node_modules/.bin/wrangler.cmd deploy src/worker.ts --dry-run --compatibility-date 2025-04-01 --compatibility-flags nodejs_compat --name cleanup-build-check --outdir <local-output-directory> --minify
```

The default build requires a local Wrangler config. The explicit dry-run above checks bundling without creating production configuration or deploying.

- Worker: `npm --prefix worker run lint`; `npm --prefix worker run build` performs Wrangler dry-run bundling, not production deployment.
- Frontend: `npm --prefix frontend run build:release` uses the example build mode. Development: `npm --prefix frontend run dev`.
- Integration tests under e2e require local Docker fixtures. They were not used to operate a real mailbox.
- 未执行deploy、D1迁移、DNS改动或真实邮件发送。No deployment, D1 migration, DNS changes or real mail sending.
- 常见故障：缺Worker binding、环境模板未填、前端API地址不匹配；先核对模板与本地配置，勿把秘密写入VITE变量。
- Common issues: missing bindings or mismatched frontend API URL. Check local templates/configuration without embedding credentials in VITE variables.
