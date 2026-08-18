# OpenCreator Dashboard（内容生产可视化台）

OpenCreator Dashboard 是一个轻量、供应商无关的内容生产流水线观察台。仓库坚持 **mock 优先**：只提供合成演示数据、只读 TypeScript 契约和 React 可视化层，不绑定任何具体生成器、发行平台、文件系统或浏览器会话。

它是内容生产开源阵营的一个安全起点。未来可以通过实现 `DashboardDataSource` 接入本地或云端系统，而不必把数据源、密钥和生产环境细节写进界面代码。

## 仓库包含什么

- React + Vite 响应式仪表盘：运行状态、质量信号、流水线阶段和最近作品。
- `src/contracts.ts`：视图使用的最小只读数据契约。
- `src/mock-data.ts`：明确标记的合成数据，不含真实作品、路径、账号或媒体。
- 四个平台（番茄、汽水、网易云、腾讯）的只读发布快照：候选、认领、准备、人工确认、提交、验证、归档与阻断码。
- 蛙蛙脱敏聚合统计面板：作品数、章节数、字数、总/单日收益、关注者、关注变化、快照时效和趋势。缺失指标保持未知，不会显示成 0。
- 覆盖渲染、筛选、可访问性和数据源替换的单元测试。
- GitHub Actions 验证流程：`npm ci` 与 `npm run check`。

## 明确不包含什么

本仓库不会读取或写入机器专属路径、外部服务、生产队列、平台账号、浏览器 profile、凭据、模型注册表、本地数据库、生成媒体或私有创作记录；也不包含小说工作流、发布控制（仅展示只读发布状态）、租户管理、日志、缓存以及许可证不明确的设计资产。

默认应用不会发起网络请求。未来接入适配器时，应将它视为独立的信任边界，并把密钥放在 Git 仓库之外。

蛙蛙面板只消费只读 `WawaStatsSnapshot` 契约。内置 fixture 全部是合成数据，界面没有采集、登录、同步、上传或提交按钮。兼容 JSON 可由 OpenCreator Novel 中可独立安装的 `$wawa-source` 在本地生成。

## 快速开始

环境要求：Node.js 20 或更高版本，npm 10 或更高版本。

```bash
npm ci
npm run dev
```

打开 Vite 输出的本地地址即可使用，无需账号或 API Key。

```bash
npm test       # Vitest 单元测试
npm run build  # TypeScript 检查 + Vite 生产构建
npm run check  # 测试 + 构建
```

## 适配器边界

界面只依赖一个接口：

```ts
interface DashboardDataSource {
  getSnapshot(): Promise<DashboardSnapshot>;
}
```

将实现传给 `<DashboardApp source={yourSource} />` 即可。适配器应独立于 mock fixture，并记录认证、留存和数据脱敏行为。除非项目完成明确的安全审计，否则不要把供应商 SDK、令牌、上传媒体或机器路径放入本仓库。

## 四平台发布状态

DashboardSnapshot.publishing 使用与发布器仓库共享的供应商无关契约（contractVersion 1.0.0），当前 fixture 覆盖 fanqie、qishui、netease 和 tencent。界面只读展示每个平台的阶段、候选/认领/准备计数、人工确认提示和结构化阻断错误码。

阶段值为：discovered、eligible、claimed、preparing、awaiting_confirmation、submitted、verified、archived、blocked、failed、cancelled。快照不包含账号、Cookie、浏览器 Profile、真实媒体路径、作品 ID 或提交按钮。

## 蛙蛙聚合统计

`DashboardSnapshot.wawaStats` 是可选字段，因此旧的纯音乐适配器仍然兼容。`1.0.0` 契约支持 `success`、`partial`、`stale`、`unavailable` 四种状态、可空汇总值、按日期趋势、时效元数据及明确的 `availableMetrics` 列表。界面不需要作品名或远端标识。

只应使用 `$wawa-source` 输出的脱敏聚合数据；不要把本仓直接连接到已登录的蛙蛙页面或浏览器 Profile。

## 目录结构

```text
src/
  App.tsx          # 可视化和交互
  contracts.ts     # 供应商无关的只读类型（四平台发布 + 蛙蛙聚合）
  mock-data.ts     # 合成 fixture 与默认数据源
  styles.css       # 原创响应式视觉系统
tests/             # 直接验证界面契约
```

## OpenCreator 生态

本项目属于 [OpenCreator](https://github.com/xwcai999/opencreator) 生态，兄弟项目包括 [OpenCreator Novel](https://github.com/xwcai999/opencreator-novel)、[OpenCreator Music](https://github.com/xwcai999/opencreator-music) 和 [OpenCreator Family Video](https://github.com/xwcai999/opencreator-family-video)、[OpenCreator Publishers](https://github.com/xwcai999/opencreator-publishers)。各仓库保持独立安装与独立版本。

## 参与贡献

提交改动前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、[SECURITY.md](SECURITY.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。新增适配器应与 mock-first 核心分开提案，并附带数据流与隐私评审。

## 许可证

版权所有 2026 OpenCreator contributors。

本项目采用 [Apache License 2.0](LICENSE)。仓库不包含第三方视觉素材；界面使用系统字体和原创 CSS/SVG 标记。
