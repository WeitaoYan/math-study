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

- 原有 `columns` 重复字段与继承方法缺少 `override` 的类型问题已在共享布局迁移中清理。

## 题目与布局

- `shared/utils/worksheetLayout.ts`：口算、脱式、竖式和真实 PDF 打印预览共用的尺寸、留白及分页模型。
- `shared/utils/verticalWork.ts`：竖式数位、乘法部分积及长除法过程（确定性逻辑，不随机出题）。
- `server/renderer/PdfRenderer.ts`：唯一真实 PDF 页面入口；各题型在 `QuestionRenderers.ts` 中只绘制分配到的区域。
- `per_page_count` 为兼容保留的每组生成题数，实际页数由布局决定；新请求也可使用 `problem_count`。
- `generateProblems` 元组第四项保留操作数元数据；原题目类 `generate()` 的返回值仍兼容。
- 预设生成页只选择 `question_type` 和 `page_count`；`/practice`、`/mentalArithmetic` 为自定义口算，保留数学配置但版式仍自动。`PageWorksheetGenerator.ts` 按真实尺寸填满所选页数；不要把页数当组数。
- `shared/utils/worksheetTypes.ts` 是预设题型目录；`CustomOralWorksheet.ts` 白名单接收自定义数学参数。两者均不暴露旧组数/每页题数/字号/留白控件。
- 口算（预设、自定义）固定每页 **20** 排，不是10排。列数按算式宽度自动缩减以避免换行/缩字；脱式和竖式继续使用40/55mm最小过程区与4mm题行间距。

## 测试

- `vitest.config.ts` 配置了 `~` 别名（指向 `app/`）和 `test/**/*.test.ts`。
- `test/multistep-paren.test.ts`：脱式计算（含括号）题生成逻辑测试。
- `test/pdf-render.test.ts`：脱式计算 PDF 端到端渲染测试。
- `test/fixtures/worksheetProblems.ts`：确定性的布局测试数据，仅供测试，不进入应用。
- 正式版本不保留独立预览路由、构建模式或广告占位。`PrintPreview.vue` 和 PDF.js 页面展示属于正式打印功能，不是调试页面。

## 广告

- `app/utils/siteAds.ts` 集中保留原正式站 AdSense 账户及广告位 ID；首页保留两个分区横幅，练习页用右侧广告，全站页尾保留一个横幅。顶部不堆广告，不在生成/下载/预览按钮之间插广告。
- `AdUnit.vue` 靠近视野且有有效宽度后加载一次 Google 脚本，同一广告元素只提交一次；Google 的 push 不指定元素，创建/提交必须串行以避免广告位错配。路由离开须清理观察器。自动化测试须拦截 Google 请求，不产生真实广告展示或点击。
- 广告不能固定/悬浮，不裁剪或覆盖 Google 内容；移动端改为100px高的内容区。空广告在视野内保留高度，移出视野后收起，避免表单突然跳动。网页打印和真实 PDF 均不得出现广告。
