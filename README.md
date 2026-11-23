# 爱学习 · 数学练习纸

Nuxt 数学练习站，复用原有出题规则，生成可直接打印的 A4 PDF。

## 功能入口

| 页面 | 路由 | 配置 |
| --- | --- | --- |
| 口算练习 | `/quickArithmetic` | 37 个预设题型与打印页数 |
| 自定义口算 | `/practice` | 比例、范围、进借位、因数、整十整百、填空与打印页数 |
| 自定义口算兼容入口 | `/mentalArithmetic` | 与 `/practice` 相同 |
| 脱式计算 | `/multiStepCalc` | 题型与打印页数 |
| 竖式计算 | `/verticalArithmetic` | 题型与打印页数 |

口算每页固定 **20 行**，按算式宽度自动减少列数，不缩小字号。脱式和竖式按真实过程安排书写区。选择几页就生成几张题目纸，不增加零散页或默认答案页。

打印预览由 PDF.js 按需加载，直接显示生成的真实 PDF，支持翻页、缩放、下载和新窗口打印。预览与下载复用同一份题目；修改参数后旧预览失效。

## 开发与验证

```bash
npm ci
npm run dev
npm run build
npx vitest run
npx tsc --noEmit -p .nuxt/tsconfig.server.json
```

开发服务默认在 `http://localhost:3000`。正式构建使用 Cloudflare Workers，开发工具面板关闭。不保留独立预览部署、固定示例实验页或广告示意占位。

## 自动部署

推送 GitHub 的 `master` 分支即触发现有自动部署：

```bash
git push origin master
```

**不要在本地执行 `wrangler deploy`**，本地没有部署凭据。Cloudflare 生产部署沿用现有 CI/CD 配置。

## 广告

`app/utils/siteAds.ts` 保留原 Google AdSense 账户与广告位 ID。首页使用少量分区横幅，练习页使用摘要下方的侧栏广告，移动端改为紧凑横幅。顶部不堆广告，不在下载或预览按钮组内放广告。

脚本按需加载一次，广告有有效宽度才提交，每个元素只提交一次。空广告在离开视野后收起，避免页面跳动；网页打印和 PDF 均不含广告。自动化测试须拦截 Google 请求。

广告内容和填充率由 Google 决定。若 AdSense 后台启用了自动广告或尺寸优化，应限制额外插入位置/尺寸，避免破坏手工广告的排版。
