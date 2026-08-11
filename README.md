# OpenCreator Dashboard

OpenCreator Dashboard is a small, provider-neutral interface for observing creative production pipelines. It is intentionally **mock-first**: the repository ships only synthetic fixture data, a read-only TypeScript contract, and a React presentation layer.

The project is designed to be a safe starting point for an open content-production ecosystem. A local or hosted adapter can implement `DashboardDataSource` later without coupling the UI to a particular generator, publisher, filesystem, or browser session.

## What is included

- A responsive React + Vite dashboard for run status, quality signals, pipeline stages, and recent works.
- `src/contracts.ts`: the small read-only data contract used by the view.
- `src/mock-data.ts`: clearly labelled synthetic data; it contains no real works, paths, accounts, or media.
- Unit tests for rendering, filtering, accessibility, and adapter substitution.
- GitHub Actions verification with `npm ci` and `npm run check`.

## What is deliberately not included

This repository does not read or write machine-specific paths, external services, production queues, publisher accounts, browser profiles, credentials, model registries, local databases, generated media, or private creative records. It also does not include novel workflows, publishing controls, tenant management, logs, caches, or design assets whose license is unclear.

The default app performs no network request. Treat any future adapter as a separate trust boundary and keep secrets outside Git.

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

## Project layout

```text
src/
  App.tsx          # presentation and interactions
  contracts.ts     # provider-neutral read-only types
  mock-data.ts     # synthetic fixture and default source
  styles.css       # original responsive visual system
tests/             # direct UI contract tests
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a change. New adapters should be proposed separately from the mock-first core and must include a data-flow and privacy review.

## License

Copyright 2026 OpenCreator contributors.

Released under the [Apache License 2.0](LICENSE). There are no bundled third-party visual assets; the interface uses system fonts and original CSS/SVG marks.
