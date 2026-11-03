# Domain mail for the workbench

[中文](README.md)

This MIT fork of dreamhunter2333/cloudflare_temp_email provides destination mailboxes and verification mail for email changes in [gpt-free-service](https://github.com/wangjundsg/gpt-free-service). The local directory is `cloudflare_temp_email_edit`.

## Current role

The main workbench owns account identity checks, email-change tasks and results. This service owns domain addresses and mail. Registration inventory remains with the separate iCloud mail workbench.

The adopted components are the Worker API, D1 storage, Email Routing, mail parser and administrative frontend. Upstream demos and optional product features are not a list of enabled workbench capabilities.

## Configuration and checks

Create private Worker configuration from `worker/wrangler.toml.template`, using your own D1/domain bindings. Use `frontend/.env.pages.example` for local Pages configuration. VITE variables are public browser assets; never put administrator secrets there. Configure the main workbench with the matching API, authentication and verified destination domains.

Admin authentication, address JWTs and the optional global password have separate roles. The repository's `vitepress-docs/docs/en/` contains technical reference material; availability upstream does not mean adoption by this workbench.

```powershell
npm --prefix worker run lint
npm --prefix frontend run build:release
```

Regular Worker builds require local Wrangler configuration. See [STATUS](STATUS.md) for the explicit-entry dry-run used without production configuration. Bundling is not deployment or validation of DNS, migrations or real mail delivery.

## Maintenance

Keep the MIT license, upstream provenance and existing fork relationship. Do not commit mail, addresses, administrator credentials, Worker secrets or live Pages settings. See [STATUS](STATUS.md), [BRANCHES](BRANCHES.md), [DATA-BOUNDARY](DATA-BOUNDARY.md) and [VENDOR](VENDOR.md).

The former upstream front pages are preserved in the private [archive repository](https://github.com/wangjundsg/gpt-workbench-archive/tree/main/snapshots/cloudflare_temp_email_edit).
