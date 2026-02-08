# GonkaGate CLI (`gonkagate`)

![CI](https://github.com/GonkaGate/gonkagate-doctor/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/GonkaGate/gonkagate-doctor/actions/workflows/codeql.yml/badge.svg)

MVP command: `gonkagate doctor`.

Behavioral spec: `docs/prd.md` (source of truth).

## Usage

Once published to npm:

```bash
npx gonkagate@latest doctor --base-url https://api.gonkagate.com/v1 --model <id>
```

Or install globally:

```bash
npm i -g gonkagate
gonkagate doctor --base-url https://api.gonkagate.com/v1 --model <id>
```

## Development

Requirements: Node.js 20+.

```bash
npm install

# Run from source
npm run dev -- doctor --base-url https://api.gonkagate.com/v1 --model <id>

# Lint / format / tests
npm run lint
npm run format
npm test
```

## Build

```bash
npm run build
npm start -- doctor --base-url https://api.gonkagate.com/v1 --model <id>
```

## Env Vars

- `GONKAGATE_BASE_URL` (default: `https://api.gonkagate.com/v1`)
- `GONKAGATE_API_KEY`
- `GONKAGATE_MODEL`

## Contributing

See `CONTRIBUTING.md`.

## Support

See `SUPPORT.md` (GitHub Discussions for questions).

## Security

See `SECURITY.md`.
