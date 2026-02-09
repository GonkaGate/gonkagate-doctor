import { headerAuth } from '../lib/auth.js';
import { fetchJson } from '../lib/http.js';
import { parsePricingIndex } from '../lib/pricing.js';
import { normalizeBaseUrl } from '../lib/url.js';

type ModelInfo = {
  id: string;
  name?: string;
  description?: string;
  contextLength?: number;
};

type ModelsListParseResult = { ok: true; models: ModelInfo[] } | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function parseModelsList(body: unknown): ModelsListParseResult {
  if (!isRecord(body)) return { ok: false, error: 'models response is not an object' };
  const data = body.data;
  if (!Array.isArray(data)) return { ok: false, error: 'models response missing data[]' };

  const models: ModelInfo[] = [];
  for (const item of data) {
    if (!isRecord(item)) continue;
    const id = asString(item.id);
    if (!id) continue;

    const name = asString(item.name);
    const description = asString(item.description);
    const contextLength = asNumber(item.context_length) ?? asNumber(item.contextLength);

    models.push({
      id,
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
      ...(contextLength ? { contextLength } : {}),
    });
  }

  if (models.length === 0) return { ok: false, error: 'models list is empty or has no ids' };
  return { ok: true, models };
}

function padRight(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function formatMoney6(n: number): string {
  return `$${n.toFixed(6)}`;
}

function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max <= 8) return s.slice(0, max);
  const head = Math.floor((max - 3) / 2);
  const tail = max - 3 - head;
  return s.slice(0, head) + '...' + s.slice(s.length - tail);
}

function writeJsonValue(v: unknown): void {
  process.stdout.write(JSON.stringify(v, null, 2) + '\n');
}

export type ModelsArgs = {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs: number;
  json: boolean;
  verbose: boolean;
};

export async function models(args: ModelsArgs): Promise<number> {
  const normalized = normalizeBaseUrl(args.baseUrl);
  if (!normalized.ok) {
    if (args.json) {
      writeJsonValue({ ok: false, error: { code: 'INVALID_BASE_URL', message: normalized.error } });
    } else {
      process.stderr.write(`Invalid base URL: ${normalized.error}\n`);
      if (normalized.suggestedBaseUrl)
        process.stderr.write(`Did you mean: ${normalized.suggestedBaseUrl}\n`);
    }
    return 2;
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: 'INVALID_TIMEOUT', message: 'timeoutMs must be a positive number' },
      });
    } else {
      process.stderr.write('Invalid --timeout: must be a positive number of milliseconds.\n');
    }
    return 2;
  }

  const apiKey = (args.apiKey ?? '').trim();
  if (!apiKey) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required; set GONKAGATE_API_KEY or pass --api-key',
        },
      });
    } else {
      process.stderr.write('API key is required. Set GONKAGATE_API_KEY or pass --api-key.\n');
    }
    return 2;
  }

  const baseUrl = normalized.baseUrl;
  const origin = normalized.origin;

  const commonHeaders: RequestInit['headers'] = {
    ...(headerAuth(apiKey) ?? {}),
  };

  const [modelsRes, pricingRes] = await Promise.all([
    fetchJson(`${baseUrl}/models`, { timeoutMs: args.timeoutMs, headers: commonHeaders }),
    fetchJson(`${origin}/api/v1/public/pricing`, { timeoutMs: args.timeoutMs }),
  ]);

  // Models are required for this command.
  if (!modelsRes.ok) {
    const msg = modelsRes.error
      ? `${modelsRes.error.type}: ${modelsRes.error.message}`
      : 'request failed';
    if (args.json) {
      writeJsonValue({ ok: false, baseUrl, error: { code: 'MODELS_UNREACHABLE', message: msg } });
    } else {
      process.stderr.write(`Models request failed: ${msg}\n`);
    }
    return 10;
  }

  if (modelsRes.status === 401) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl,
        error: { code: 'AUTH_ERROR', message: 'unauthorized (check API key)' },
      });
    } else {
      process.stderr.write('Unauthorized. Check your API key.\n');
    }
    return 11;
  }

  if (modelsRes.status === 403) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl,
        error: { code: 'AUTH_ERROR', message: 'forbidden (account may be suspended)' },
      });
    } else {
      process.stderr.write('Forbidden. Account may be suspended.\n');
    }
    return 11;
  }

  if (modelsRes.status !== 200) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl,
        error: { code: 'MODELS_ERROR', message: `unexpected status ${modelsRes.status}` },
      });
    } else {
      process.stderr.write(`Models endpoint returned unexpected status ${modelsRes.status}\n`);
    }
    return 10;
  }

  const parsedModels = parseModelsList(modelsRes.json);
  if (!parsedModels.ok) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl,
        error: { code: 'MODELS_ERROR', message: parsedModels.error },
      });
    } else {
      process.stderr.write(parsedModels.error + '\n');
    }
    return 10;
  }

  const parsedPricing =
    pricingRes.ok && pricingRes.status === 200
      ? parsePricingIndex(pricingRes.json, 0.1)
      : undefined;
  const pricingIndex = parsedPricing && parsedPricing.ok ? parsedPricing.index : undefined;

  const missingPricing: string[] = [];
  const outModels = parsedModels.models.map((m) => {
    const pricing = pricingIndex?.models[m.id];
    if (!pricing) missingPricing.push(m.id);
    return { ...m, pricing };
  });

  const pricingOk =
    pricingRes.ok &&
    pricingRes.status === 200 &&
    parsedPricing !== undefined &&
    parsedPricing.ok &&
    missingPricing.length === 0;

  const ok = pricingOk;
  const exitCode = ok ? 0 : 13;

  if (args.json) {
    writeJsonValue({
      ok,
      baseUrl,
      warnings: normalized.warnings,
      pricingUpdatedAt: pricingIndex?.updatedAt,
      models: outModels,
      ...(ok
        ? {}
        : {
            error: {
              code: 'PRICING_ERROR',
              message: !pricingRes.ok
                ? `pricing request failed: ${pricingRes.error ? `${pricingRes.error.type}: ${pricingRes.error.message}` : 'request failed'}`
                : pricingRes.status !== 200
                  ? `pricing returned unexpected status ${pricingRes.status}`
                  : parsedPricing && !parsedPricing.ok
                    ? parsedPricing.error
                    : `pricing missing for ${missingPricing.length} model(s)`,
            },
          }),
    });
  } else {
    process.stdout.write('GonkaGate Models\n');
    process.stdout.write(`Base URL: ${baseUrl}\n`);
    if (normalized.warnings.length > 0) {
      process.stdout.write('\nWarnings:\n');
      for (const w of normalized.warnings) process.stdout.write(`  - ${w}\n`);
    }
    process.stdout.write('\n');

    if (pricingIndex?.updatedAt)
      process.stdout.write(`Pricing updatedAt: ${pricingIndex.updatedAt}\n\n`);

    const idWidth = Math.min(60, Math.max(24, ...outModels.map((m) => m.id.length)));
    process.stdout.write(
      `${padRight('model', idWidth)}  ${padRight('network/1M', 12)}  ${padRight('fee/1M', 12)}  ${padRight('total/1M', 12)}\n`,
    );

    for (const m of outModels) {
      const p = m.pricing;
      const row = [
        padRight(truncateMiddle(m.id, idWidth), idWidth),
        padRight(p ? formatMoney6(p.networkUsdPer1M) : 'n/a', 12),
        padRight(p ? formatMoney6(p.platformUsdPer1M) : 'n/a', 12),
        padRight(p ? formatMoney6(p.totalUsdPer1M) : 'n/a', 12),
      ].join('  ');
      process.stdout.write(row.trimEnd() + '\n');
      if (args.verbose && m.name) process.stdout.write(`  name: ${m.name}\n`);
    }

    if (!pricingOk) {
      process.stdout.write('\nPricing:\n');
      if (!pricingRes.ok) {
        const msg = pricingRes.error
          ? `${pricingRes.error.type}: ${pricingRes.error.message}`
          : 'request failed';
        process.stdout.write(`  - unreachable: ${msg}\n`);
      } else if (pricingRes.status !== 200) {
        process.stdout.write(`  - unexpected status: ${pricingRes.status}\n`);
      } else if (parsedPricing && !parsedPricing.ok) {
        process.stdout.write(`  - invalid response: ${parsedPricing.error}\n`);
      } else if (missingPricing.length > 0) {
        process.stdout.write(`  - missing entries: ${missingPricing.length} model(s)\n`);
      }
    }

    if (pricingIndex) process.stdout.write('\nNote: pricing is estimated and subject to change.\n');
  }

  return exitCode;
}
