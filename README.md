# GonkaGate CLI (`gonkagate`)

![CI](https://github.com/GonkaGate/gonkagate-doctor/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/GonkaGate/gonkagate-doctor/actions/workflows/codeql.yml/badge.svg)

Core command: `gonkagate doctor` (activation/diagnostics for an OpenAI-compatible API).

## Documentation

These docs cover **Gonka AI API access via the GonkaGate gateway** (GonkaGate is an independent gateway and is not affiliated with Gonka Network):

- [Gonka AI API Docs (via GonkaGate)](https://gonkagate.com/en/docs?utm_source=github&utm_medium=referral&utm_campaign=gonkagate_doctor&utm_content=readme_docs_list)
- [Gonka AI API Reference (via GonkaGate)](https://gonkagate.com/en/docs/api?utm_source=github&utm_medium=referral&utm_campaign=gonkagate_doctor&utm_content=readme_docs_list)

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

The template names no model: model ids, display names and context windows are not fixed in this CLI,
they come from the live catalog. Run `gonkagate models` for the current catalog with pricing; the
first model it lists is the default.

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
- `GONKAGATE_MODEL` (optional; run `gonkagate models` for the available ids)

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

List models and attach pricing (joined by model id). `GET /v1/models` is the source of truth for the
catalog: ids, display names, descriptions and context windows are read from the response, never from
a list baked into this CLI.

```bash
gonkagate models --api-key gp-REDACTED
```

The first model in the response is the default; it is printed as `Default model: <id>` and exposed as
`defaultModel` in `--json`. There is no client-side ranking.

Gateways that do not publish the enriched fields yet are supported: a missing or `null` context window
prints `n/a` and is omitted from `--json`, a missing display name leaves the model listed by its id,
and a missing description is omitted.

Options:

- `--api-key <key>`
- `--timeout <ms>` (default: `10000`)
- `--json`
- `--verbose` also print each model's display name and description when the gateway provides them

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

`init` runs before an API key exists, so it cannot read the catalog and does not guess: it leaves
`GONKAGATE_MODEL` commented and unset and points at `gonkagate models`.

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
