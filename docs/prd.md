Below is the PRD for the **GonkaGate CLI** with the core command **`gonkagate doctor`** (a fast activation tool for developers), plus the decision on stack and distribution.

---

# PRD: GonkaGate CLI - `gonkagate` (MVP: `doctor`)

**Date:** 2026-02-08  
**Status:** Draft  
**Owner:** Danii  
**Product context:** GonkaGate is an OpenAI-compatible API to the Gonka Network with USD billing and transparent cost breakdown (network + platform fee).

## 1) Problem and why this matters

### Problem

For developers, the most common "first failure" when onboarding is not code, but configuration:

- wrong `base_url` (missing `/v1`, extra `/v1`, wrong domain),
- selecting a model that does not exist -> `invalid_model`,
- pricing/rate endpoint unavailable or not configured -> impossible to estimate cost / compare,
- unclear whether "the service is down" or "it's my setup".

This causes extra iterations, support load, and slower **activation** (the first successful API call is the key signal). The backend product is built around drop-in OpenAI compatibility via `/v1/*` and minimizing time to first request.

### Solution

A CLI called **`gonkagate`** with a **`gonkagate doctor`** command that quickly and deterministically checks:

1. the official GonkaGate `base_url` responds (connectivity),
2. the model exists (and suggests close matches),
3. the pricing/rate endpoint is reachable,
4. prints an **estimated cost per 1M tokens** (ideally split into network/platform/total).

All in one command to speed up activation and reduce support.

---

## 2) Goals and success metrics

### Product goals (MVP)

- Reduce developer time-to-first-successful-request via fast self-diagnostics.
- Reduce misconfiguration errors (wrong URL / model / missing pricing).
- Give users an understandable USD price per 1M tokens with network/platform breakdown (transparency principle).

### Success metrics

- **Activation lift:** the share of users whose first successful request happens within 24h increases.
- **Support deflection:** fewer tickets/messages with causes:
  - "model not found"
  - "wrong base url"
  - "pricing not available"

- **CLI adoption:** % of new users who ran `gonkagate doctor` within the first 24h.

---

## 3) Target users and use cases

**Primary:** production AI builders (agencies, SaaS teams) who care about USD billing and drop-in OpenAI compatibility.  
**Secondary:** developers already "looking for Gonka" who want to quickly validate model availability and cost.

### User stories

- As a dev, I want to run `gonkagate doctor` and within 10-20 seconds understand what is wrong: URL, key, model, service, pricing.
- As a team lead/CTO, I want to run `doctor` in CI/staging as a smoke check before shipping.
- As a user, I want to see **per-1M-token prices** for the chosen model and understand the breakdown (network + platform fee).

---

## 4) Scope

### MVP (required)

1. **`gonkagate doctor`**
   - check official `base_url` connectivity
   - check `/health` reachability (if present)
   - check OpenAI-compatible endpoints: `/v1/models`, `/v1/chat/completions` (at least route-level reachability)
   - check that the model exists
   - check pricing/rate endpoint reachability
   - output estimated cost per 1M tokens (prefer: network / platform fee / total)

2. **Good UX**
   - readable human output
   - `--json` mode (for CI/scripts)
   - clear "how to fix" hints (e.g. "use base_url=https://api.gonkagate.com/v1 in your OpenAI SDK")

3. **Security**
   - never print API keys (mask only)
   - never log sensitive data

### Out of scope (MVP)

- account/deposit management via CLI
- heavy interactivity (TUI)
- auto-fixes like "edit my code/files" (maybe later)

### Post-MVP / backlog (ideas)

These commands would make the CLI a real "activation kit", but they should not block MVP:

- `gonkagate models` - list models + pricing (helps pick a model; also needed for a public models page).
- `gonkagate pricing --model ...` - print pricing breakdown.
- `gonkagate whoami` - validate API key, show masked account + current balance (if an endpoint exists).
- `gonkagate init` - create `.env`/config with hints.
- `gonkagate doctor --smoke` - minimal real request `max_tokens=1` (end-to-end), if there is balance.
- `gonkagate completion` - shell completions.

---

## 5) UX: how users run it

### MVP distribution: **npm + npx (zero-install)**

**Why:** the shortest path for an activation tool is one cross-platform command with no install step.

- Run without install:
  - `npx gonkagate@latest doctor --api-key ... --model ...`

- Optional global install:
  - `npm i -g gonkagate` -> `gonkagate doctor ...`

This fits the product's "drop-in" philosophy (set `base_url` in your OpenAI SDK and it works).

### Why not a Go/Rust binary (yet)

Binaries are better UX, but cost more time: builds for 3 OSes, signing, Homebrew/Scoop distribution, update flow. Keep it for V1.1 once the CLI proves value.

### Fixed base_url

Product examples use:
`https://api.gonkagate.com/v1`

Doctor should:

- always use this base URL (CLI does not support overriding it),
- print the recommended base_url for SDK usage (`.../v1` is important for OpenAI SDK compatibility).

---

## 6) Configuration

### Config source priority

1. CLI flags
2. env vars
3. config file (post-MVP or "nice-to-have" for MVP)

### Env vars (MVP)

- `GONKAGATE_API_KEY`
- `GONKAGATE_MODEL` (optional default model)

### `doctor` options (MVP)

- `--api-key <key>` (or env)
- `--model <model_id>`
- `--timeout <ms>` (default 10_000)
- `--smoke` (optional) send a minimal real request (`max_tokens=1`)
- `--json` (output result as JSON)
- `--verbose` (print diagnostic details: timings, status codes, requestId)

---

## 7) `gonkagate doctor`: behavior and checks

### 7.1 base_url

The CLI always uses the official base URL:

- `base_url = https://api.gonkagate.com/v1`

Doctor should still print the base_url so users can copy it into their OpenAI SDK config, and it must verify that the service responds on `/v1/models` (200/401) rather than 404/ENOTFOUND.

### 7.2 Health check

The backend may expose a `/health` endpoint for monitoring. Doctor should:

- `GET <origin>/health`
- expect 200/204
- if 404, mark as "SKIP (not implemented)" and do not fail the whole doctor run (to keep compatibility across environments)

> `origin` = base_url without the `/v1` suffix.

### 7.3 Models and "model exists" check

- `GET ${base_url}/models` (OpenAI-compatible)
- if 401 -> "API key missing/invalid" (useful signal)
- if 200 -> parse the list and validate `--model`:
  - found -> OK
  - not found -> FAIL + suggestions (fuzzy match)

The product is expected to handle `invalid_model` as a 400 invalid_request_error. Doctor can use that as a fallback check (if the models list is not available).

### 7.4 Pricing/rate endpoint reachability

Doctor must verify pricing is reachable because:

- network price and platform fee are part of positioning (transparency),
- the business model is base cost + usage fee.

**Requirement (backend contract):**
Expose a public or auth-only endpoint that returns per-model pricing **in USD**, without internal "credits" units (rule: do not show internal units).

Recommended stable endpoint:

- `GET /api/v1/public/pricing` (public)
  or
- `GET /api/v1/pricing` (auth)

**Why not `/api/v1/admin/rate`:** the admin endpoint is for manual rate setting and should not be part of developer activation UX.

### 7.5 "Estimated cost per 1M tokens" calculation

Per the business model:

- `platformFeeUsd = baseCostUsd * u`
- `totalCostUsd = baseCostUsd * (1+u)`, where `u = 0.10` (usage fee is 10% of base cost).

**Doctor output must include at least:**

- `networkUsdPer1M`
- `platformUsdPer1M`
- `totalUsdPer1M`
- pricing timestamp/version (if available)

**Tone/positioning:**
Do not promise a "fixed price forever". Use wording like "estimated" and "subject to change" (pricing is dynamic and may change).

---

## 8) Output format and exit codes

### Human output (example)

```text
GonkaGate Doctor
Base URL: https://api.gonkagate.com/v1

[OK]  Connectivity
[OK]  /health reachable (200)   84ms
[OK]  /v1/models reachable      112ms
[OK]  Model exists: llama-3.1-70b-instruct
[OK]  Pricing endpoint reachable

Estimated cost per 1M tokens (USD) - llama-3.1-70b-instruct
  network:   $0.004000
  fee (10%): $0.000400
  total:     $0.004400

Next:
  - Use base_url="https://api.gonkagate.com/v1"
  - Export GONKAGATE_API_KEY=...
```

### JSON output (for CI)

```json
{
  "ok": true,
  "baseUrl": "https://api.gonkagate.com/v1",
  "checks": [
    { "name": "health", "ok": true, "status": 200, "ms": 84 },
    { "name": "models", "ok": true, "status": 200, "ms": 112 },
    { "name": "modelExists", "ok": true, "model": "llama-3.1-70b-instruct" },
    { "name": "pricing", "ok": true, "status": 200, "ms": 90 }
  ],
  "estimatedCostPer1M": {
    "currency": "USD",
    "model": "llama-3.1-70b-instruct",
    "network": 0.004,
    "platformFee": 0.0004,
    "total": 0.0044
  }
}
```

### Exit codes

- `0` - all checks passed
- `2` - invalid args
- `10` - base_url unreachable (DNS/TLS/timeout)
- `11` - auth error (401)
- `12` - model not found
- `13` - pricing endpoint unavailable/invalid

---

## 9) Additional functionality worth adding (can be post-MVP)

These materially improve activation and reduce support:

1. **`doctor --smoke` (optional)**
   Send a tiny request to `/v1/chat/completions` with `max_tokens=1` (and a neutral prompt) to validate end-to-end: auth -> routing -> response -> usage field. The backend is expected to return `usage` (token counts) and `cost_usd` in the response.

- If the API returns 402 (empty balance), do not treat it as "broken"; print "SKIP: insufficient balance" (expected product case).
- If the API returns 429 in OpenAI error format with `type=insufficient_quota` / `code=insufficient_quota`, do not treat it as "broken"; print "SKIP: insufficient balance" (expected product case). If available, include `metadata.balance_usd`.

2. **"Diagnostic bundle" for support**
   A `--diagnostics` flag prints:

- CLI version
- normalized base_url
- check statuses/timings
- requestId from errors (if present)
- but no secrets

3. **`gonkagate models`**
   List models + pricing (optionally sorted by "recommended"). This directly supports the journey "first I look at models/pricing".

---

## 10) Tech stack and architecture

### Stack decision (MVP)

- **TypeScript**
- **Node.js 20+**
- CLI framework: `commander` (or `oclif`, but `commander` is simpler/lighter)
- HTTP: built-in `fetch` (Node 20) + timeouts via `AbortController`
- output formatting: minimal, no heavy deps

**Why TypeScript/Node:**

- fast time-to-ship
- easy npm distribution
- npx zero-install is ideal for activation tooling

### Distribution

- npm package `gonkagate`
- in README: two run modes:
  - `npx gonkagate@latest doctor ...`
  - `npm i -g gonkagate`

### V1.1 (when it makes sense)

- standalone binaries (pkg/nexe) or a Go binary + Homebrew/Scoop.

---

## 11) Backend API requirements (CLI dependencies)

For doctor to be reliable, the following should be stable (if not already):

1. `GET /health` -> 200/204.
2. `GET /v1/models` (OpenAI-compatible) -> list of models; **must not require a positive balance** (auth only).
3. A pricing endpoint (public or auth-only) returning per-model USD pricing:
   - `networkUsdPer1M`, `platformUsdPer1M`, `totalUsdPer1M`
   - `usageFeeRate` (expected 0.10)
   - `updatedAt`

Important rule: **all user-facing values are in USD, no internal units**.

---

## 12) Risks and mitigations

1. **No stable pricing endpoint** -> doctor cannot print cost.
   - Mitigation: add/standardize `GET /api/v1/public/pricing` (also useful for a public models page).

2. **Dynamic pricing** -> users may interpret the number as a promise.
   - Mitigation: print "estimated" + `updatedAt`, avoid marketing like "X times cheaper".

3. **Users forget `/v1` in base_url**
   - Mitigation: doctor always prints the correct `base_url=https://api.gonkagate.com/v1` and docs include copy-paste examples for OpenAI SDK configuration.

---

## 13) MVP implementation plan (realistic)

**v0.1**

- `doctor` (connectivity + models + model exists + pricing + cost/1M)
- human output + `--json`
- env vars + flags

**v0.2**

- `doctor --smoke`
- suggestions (fuzzy match)
- diagnostics bundle

**v0.3**

- `models` / `pricing` commands

---
