# Contributing to OpenCreator Dashboard

感谢参与。请把这个仓库当作一个可复用的、低风险的可视化核心。

## 开始前

1. 使用 Node.js 20+ 与 npm 10+。
2. 运行 `npm ci`，再运行 `npm run check`。
3. 保持默认应用 mock-first；不要为了本地调试提交真实数据。

## 改动边界

- UI 改动应保持键盘可用、语义 HTML 和移动端布局。
- 契约改动必须同步更新 `src/mock-data.ts` 与测试。
- 外部适配器必须单独提案，说明数据来源、权限、留存、脱敏和失败行为；不得把供应商凭据或机器路径写进核心。
- 不提交音频、封面、歌词、日志、缓存、数据库、浏览器 profile、构建产物或截图。
- 新依赖必须说明用途、许可证和包体积影响，并在 CI 中可通过 `npm ci` 安装。

## 提交检查

```bash
npm run check
```

提交信息建议使用清晰的动词开头，例如 `Improve pipeline empty state`。Pull request 应说明用户可见变化、测试证据和残余风险。
