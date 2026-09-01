# OpenCreator Dashboard

OpenCreator Dashboard is a small, provider-neutral interface for observing creative production pipelines. It is intentionally **mock-first**: the repository ships only synthetic fixture data, a read-only TypeScript contract, and a React presentation layer.

The project is designed to be a safe starting point for an open content-production ecosystem. A local or hosted adapter can implement `DashboardDataSource` later without coupling the UI to a particular generator, publisher, filesystem, or browser session.

## What is included

- A responsive React + Vite dashboard for run status, quality signals, pipeline stages, and recent works.
- `src/contracts.ts`: the small read-only data contract used by the view.
- `src/mock-data.ts`: clearly labelled synthetic data; it contains no real works, paths, accounts, or media.
- A read-only publishing snapshot for four platforms (Fanqie, Qishui, Netease, and Tencent), including candidate, claim, preparation, confirmation, submission, verification, archive, and blocker signals.
- Dedicated Wawa statistics and submission views with synthetic book-level fixtures, range/filter controls, metric visibility, 10-item pagination, preflight details, and the latest 10 runs.
- An opt-in HTTP adapter for a separately running local OpenCreator service. Real sync or submission actions remain disabled unless explicitly enabled.
- Unit tests for rendering, filtering, accessibility, and adapter substitution.
- GitHub Actions verification with `npm ci` and `npm run check`.

## What is deliberately not included

This repository does not contain machine-specific paths, publisher accounts, browser profiles, credentials, local databases, generated media, private creative records, logs, caches, or unlicensed design assets.

The default app performs no network request. Treat any future adapter as a separate trust boundary and keep secrets outside Git.

The bundled fixture is synthetic. The optional local adapter can read detailed statistics and submission packages; synchronization, login, prefill and status-changing actions require a separate explicit capability flag. Prefill stops before final submission, which remains a human action on Wawa.

## Quick start

Requirements: Node.js 20 or newer and npm 10 or newer.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. The page is usable without an account or API key.

```bash
npm test       # Vitest unit tests
npm run build  # TypeScript check + Vite production build
npm run check  # test + build
```

## Adapter boundary

The UI depends on one interface:

```ts
interface DashboardDataSource {
  getSnapshot(): Promise<DashboardSnapshot>;
  getWawaMetrics?(days: "all" | 1 | 3 | 7 | 30 | 90): Promise<WawaMetricsView>;
  getWawaSubmission?(page: number, pageSize: number): Promise<WawaSubmissionView>;
}
```

Pass an implementation to `<DashboardApp source={yourSource} />`. To use the bundled local adapter, copy `.env.example`, set `VITE_OPENCREATOR_API_BASE=/local-api`, and point `OPENCREATOR_LOCAL_API_TARGET` at the separately running service. Keep `VITE_OPENCREATOR_ENABLE_WAWA_ACTIONS=false` unless the local operator deliberately enables actions.

## Four-platform publishing status

DashboardSnapshot.publishing follows the provider-neutral contract shared with the publishers workspace (contractVersion 1.0.0). The fixture covers fanqie, qishui, netease, and tencent and renders each platform stage, candidate/claim/preparation counts, manual-confirmation hints, and structured blocker codes as read-only data.

Stages are discovered, eligible, claimed, preparing, awaiting_confirmation, submitted, verified, archived, blocked, failed, and cancelled. The snapshot contains no accounts, cookies, browser profiles, real media paths, work IDs, or submit controls.

## Wawa operations views

`DashboardSnapshot.wawaStats` remains optional for the compact overview. The dedicated statistics view defaults to cumulative totals and adds 1/3/7/30/90-day ranges, work/channel/completion filters, selectable trend metrics, and per-work details. The submission view displays ten packages per page and only the latest ten runs.

The adapter talks only to the configured local HTTP service; it never reads a browser profile or credentials itself. Action methods are absent by default and final submission is intentionally not implemented.

## Project layout

```text
src/
  App.tsx          # presentation and interactions
  contracts.ts     # provider-neutral read-only types (publishing + Wawa aggregates)
  http-data-source.ts # opt-in local HTTP adapter
  WawaStatsPage.tsx
  WawaSubmissionPage.tsx
  mock-data.ts     # synthetic fixture and default source
  styles.css       # original responsive visual system
tests/             # direct UI contract tests
```

## OpenCreator ecosystem

This project is part of [OpenCreator](https://github.com/xwcai999/opencreator), alongside [OpenCreator Novel](https://github.com/xwcai999/opencreator-novel), [OpenCreator Music](https://github.com/xwcai999/opencreator-music), and [OpenCreator Family Video](https://github.com/xwcai999/opencreator-family-video), and [OpenCreator Publishers](https://github.com/xwcai999/opencreator-publishers). Each repository remains independently installable and versioned.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a change. New adapters should be proposed separately from the mock-first core and must include a data-flow and privacy review.

## License

Copyright 2026 OpenCreator contributors.

Released under the [Apache License 2.0](LICENSE). There are no bundled third-party visual assets; the interface uses system fonts and original CSS/SVG marks.
