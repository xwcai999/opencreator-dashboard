# OpenCreator Dashboard

OpenCreator Dashboard is a small, provider-neutral interface for observing creative production pipelines. It is intentionally **mock-first**: the repository ships only synthetic fixture data, a read-only TypeScript contract, and a React presentation layer.

The project is designed to be a safe starting point for an open content-production ecosystem. A local or hosted adapter can implement `DashboardDataSource` later without coupling the UI to a particular generator, publisher, filesystem, or browser session.

## What is included

- A responsive React + Vite dashboard for run status, quality signals, pipeline stages, and recent works.
- `src/contracts.ts`: the small read-only data contract used by the view.
- `src/mock-data.ts`: clearly labelled synthetic data; it contains no real works, paths, accounts, or media.
- A read-only publishing snapshot for four platforms (Fanqie, Qishui, Netease, and Tencent), including candidate, claim, preparation, confirmation, submission, verification, archive, and blocker signals.
- A Wawa statistics panel for redacted aggregate snapshots: books, chapters, words, total/daily revenue, followers, follow delta, freshness, and trends. Missing metrics stay unknown instead of being displayed as zero.
- Unit tests for rendering, filtering, accessibility, and adapter substitution.
- GitHub Actions verification with `npm ci` and `npm run check`.

## What is deliberately not included

This repository does not read or write machine-specific paths, external services, production queues, publisher accounts, browser profiles, credentials, model registries, local databases, generated media, or private creative records. It also does not include novel workflows, publishing controls (only read-only publishing status is shown), tenant management, logs, caches, or design assets whose license is unclear.

The default app performs no network request. Treat any future adapter as a separate trust boundary and keep secrets outside Git.

The Wawa panel consumes only the `WawaStatsSnapshot` read-only contract. The bundled fixture is synthetic, and the UI has no collector, login, synchronization, upload, or submission control. Produce compatible JSON offline with OpenCreator Novel's independently installable `$wawa-source` Skill.

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
}
```

Pass an implementation to `<DashboardApp source={yourSource} />`. Keep the implementation outside the mock fixture and document its authentication, retention, and data-redaction behavior. Do not put provider SDKs, tokens, uploaded media, or machine paths into this repository unless the project explicitly adopts and audits them.

## Four-platform publishing status

DashboardSnapshot.publishing follows the provider-neutral contract shared with the publishers workspace (contractVersion 1.0.0). The fixture covers fanqie, qishui, netease, and tencent and renders each platform stage, candidate/claim/preparation counts, manual-confirmation hints, and structured blocker codes as read-only data.

Stages are discovered, eligible, claimed, preparing, awaiting_confirmation, submitted, verified, archived, blocked, failed, and cancelled. The snapshot contains no accounts, cookies, browser profiles, real media paths, work IDs, or submit controls.

## Wawa aggregate statistics

`DashboardSnapshot.wawaStats` is optional, so older music-only adapters remain compatible. Contract `1.0.0` supports `success`, `partial`, `stale`, and `unavailable` states, nullable totals, a dated trend series, freshness metadata, and an explicit `availableMetrics` list. The view never requires work titles or remote identifiers.

Use only redacted aggregate output from `$wawa-source`; do not connect this repository directly to authenticated Wawa pages or browser profiles.

## Project layout

```text
src/
  App.tsx          # presentation and interactions
  contracts.ts     # provider-neutral read-only types (publishing + Wawa aggregates)
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
