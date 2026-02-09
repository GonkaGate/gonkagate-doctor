# Contributing

Thanks for contributing to **GonkaGate CLI** (`gonkagate`).

This repo’s behavior is specified in `docs/prd.md` (source of truth). If your change affects UX/output/exit codes, update the PRD.

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
npm install
```

## Development

Run from source:

```bash
npm run dev -- doctor --model <id>
```

Run the built CLI:

```bash
npm run build
npm start -- doctor --model <id>
```

## Quality Checks

Run the full local CI suite (this is what GitHub Actions runs):

```bash
npm run ci
```

Or run pieces:

```bash
npm run lint
npm run format
npm run typecheck
npm test
```

## Testing Guidelines

- Add unit tests for pure logic (URL normalization, exit code mapping, JSON output shape).
- Prefer integration tests via a local stub HTTP server for request/timeout/retry behavior.
- Tests live in `tests/**/*.test.ts`.

## Pull Requests

Please follow these rules:

- PR title must follow **Conventional Commits** (required check).
  - Examples: `feat: add pricing check`, `fix: normalize base URL`, `docs: update prd`.
- `npm run ci` must pass.
- Don’t print or log secrets.
  - Never include real API keys in issues/PRs/logs.
  - If you paste `--json` output, redact sensitive values.
- If you change CLI behavior, include:
  - updated tests
  - updated `docs/prd.md` section(s)
  - a sample `doctor` output (human and/or `--json`)

## Release Process (Maintainers)

Releases are automated with **Release Please**:

- Conventional commits on `main` generate a Release PR (version bump + changelog).
- Merging the Release PR creates a GitHub Release + git tag.
- Publishing to npm is handled by CI on tags (trusted publishing / OIDC).

Do not manually edit version numbers unless you are intentionally overriding automation.

## Security

For vulnerability reports, please follow `SECURITY.md` and do **not** open public issues.
