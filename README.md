# GonkaGate CLI (`gonkagate`)

![CI](https://github.com/GonkaGate/gonkagate-doctor/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/GonkaGate/gonkagate-doctor/actions/workflows/codeql.yml/badge.svg)

Core command: `gonkagate doctor` (activation/diagnostics for an OpenAI-compatible API).

## Usage

Once published to npm:

```bash
npx gonkagate@latest doctor --model <id>
```

Or install globally:

```bash
npm i -g gonkagate
gonkagate doctor --model <id>
```

## Quickstart

Create a local `.env` template:

```bash
gonkagate init
```

Then set `GONKAGATE_API_KEY` (and optionally `GONKAGATE_MODEL`) in `.env` and run:

```bash
gonkagate doctor --model <id>
```

## Development

Requirements: Node.js 20+.

```bash
npm install

# Run from source
npm run dev -- doctor --model <id>

# Lint / format / tests
npm run lint
npm run format
npm test
```

## Build

```bash
npm run build
npm start -- doctor --model <id>
```

## Env Vars

- `GONKAGATE_API_KEY`
- `GONKAGATE_MODEL`

The CLI base URL is fixed to `https://api.gonkagate.com/v1`.

The CLI also loads a local `.env` file (if present) without overriding existing environment variables.

## Commands

### `doctor`

Connectivity/model/pricing diagnostics for a GonkaGate OpenAI-compatible API.

```bash
gonkagate doctor \
  --api-key gp-REDACTED \
  --model <id>
```

Options:

- `--api-key <key>` (or `GONKAGATE_API_KEY`)
- `--model <id>` (or `GONKAGATE_MODEL`)
- `--timeout <ms>` (default: `10000`)
- `--smoke` send a minimal real request (`max_tokens=1`) to `/v1/chat/completions`
  - if backend returns `429` with `error.type=insufficient_quota`, it is treated as `SKIP` (insufficient balance), not a failure
- `--json` machine-readable output
- `--verbose` include request IDs when available

### `models`

List models and attach pricing (joined by model id).

```bash
gonkagate models --api-key gp-REDACTED
```

Options:

- `--api-key <key>`
- `--timeout <ms>` (default: `10000`)
- `--json`
- `--verbose`

### `pricing`

Print pricing breakdown for a model (USD per 1M tokens).

```bash
gonkagate pricing --model <id>
```

Options:

- `--model <id>` (required)
- `--timeout <ms>` (default: `10000`)
- `--json`

### `whoami`

Validate API key and show masked account info (and balance if provided by backend).

```bash
gonkagate whoami --api-key gp-REDACTED
```

Requires backend support for `GET /api/v1/whoami`.

Options:

- `--api-key <key>`
- `--timeout <ms>` (default: `10000`)
- `--json`
- `--verbose`

### `init`

Create a local `.env` template with usage hints:

```bash
gonkagate init
```

Options:

- `--force` overwrite existing `.env`

### `completion`

Print shell completion script:

```bash
# bash (current shell session)
source <(gonkagate completion --shell bash)
```

```bash
# zsh (current shell session)
source <(gonkagate completion --shell zsh)
```

```bash
# fish (current shell session)
gonkagate completion --shell fish | source
```

## Contributing

See `CONTRIBUTING.md`.

## Support

See `SUPPORT.md` (GitHub Discussions for questions).

## Security

See `SECURITY.md`.
