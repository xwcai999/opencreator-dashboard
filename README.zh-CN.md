# OpenCreator Dashboard（内容生产可视化台）

OpenCreator Dashboard 是一个轻量、供应商无关的内容生产流水线观察台。仓库坚持 **mock 优先**：只提供合成演示数据、只读 TypeScript 契约和 React 可视化层，不绑定任何具体生成器、发行平台、文件系统或浏览器会话。

它是内容生产开源阵营的一个安全起点。未来可以通过实现 `DashboardDataSource` 接入本地或云端系统，而不必把数据源、密钥和生产环境细节写进界面代码。

## 仓库包含什么

- React + Vite 响应式仪表盘：运行状态、质量信号、流水线阶段和最近作品。
- `src/contracts.ts`：视图使用的最小只读数据契约。
- `src/mock-data.ts`：明确标记的合成数据，不含真实作品、路径、账号或媒体。
- 覆盖渲染、筛选、可访问性和数据源替换的单元测试。
- GitHub Actions 验证流程：`npm ci` 与 `npm run check`。

## 明确不包含什么

本仓库不会读取或写入机器专属路径、外部服务、生产队列、平台账号、浏览器 profile、凭据、模型注册表、本地数据库、生成媒体或私有创作记录；也不包含小说工作流、发布控制、租户管理、日志、缓存以及许可证不明确的设计资产。

默认应用不会发起网络请求。未来接入适配器时，应将它视为独立的信任边界，并把密钥放在 Git 仓库之外。

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

## 目录结构

```text
src/
  App.tsx          # 可视化和交互
  contracts.ts     # 供应商无关的只读类型
  mock-data.ts     # 合成 fixture 与默认数据源
  styles.css       # 原创响应式视觉系统
tests/             # 直接验证界面契约
```

## 参与贡献

提交改动前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、[SECURITY.md](SECURITY.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。新增适配器应与 mock-first 核心分开提案，并附带数据流与隐私评审。

## 许可证

版权所有 2026 OpenCreator contributors。

本项目采用 [Apache License 2.0](LICENSE)。仓库不包含第三方视觉素材；界面使用系统字体和原创 CSS/SVG 标记。
