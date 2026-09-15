# AGENTS.md

## 部署方式（重要）

**推送 GitHub 即自动部署**，无需也不要在本地执行 `wrangler deploy`（本地环境无 Cloudflare 凭据，会失败）。

```bash
git push origin master
```

推送后线上自动更新（studystudy.ikber.cc 等域名由 CI/CD 托管）。

## 本地命令

```bash
npm run dev        # 启动开发服务器 http://localhost:3000
npm run build      # 生产构建（nuxt build，含 nitro server 编译）
npx vitest run     # 运行测试（test/ 目录）
npx tsc --noEmit -p .nuxt/tsconfig.server.json   # 服务端类型检查
```

## 已知既有问题

- `server/Math/Config.ts` 存在重复的 `columns` 字段（TS2300 Duplicate identifier），为历史遗留，非本次改动引入，构建不受影响。

## 测试

- `vitest.config.ts` 配置了 `~` 别名（指向 `app/`）和 `test/**/*.test.ts`。
- `test/multistep-paren.test.ts`：脱式计算（含括号）题生成逻辑测试。
- `test/pdf-render.test.ts`：脱式计算 PDF 端到端渲染测试。