import { fetchJson } from '../lib/http.js';
import { parsePricingForModel } from '../lib/pricing.js';
import { normalizeBaseUrl } from '../lib/url.js';

function formatMoney6(n: number): string {
  return `$${n.toFixed(6)}`;
}

function writeJsonValue(v: unknown): void {
  process.stdout.write(JSON.stringify(v, null, 2) + '\n');
}

export type PricingArgs = {
  baseUrl?: string;
  model?: string;
  timeoutMs: number;
  json: boolean;
};

export async function pricing(args: PricingArgs): Promise<number> {
  const normalized = normalizeBaseUrl(args.baseUrl);
  if (!normalized.ok) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        error: { code: 'INVALID_BASE_URL', message: normalized.error },
      });
    } else {
      process.stderr.write(`Invalid base URL: ${normalized.error}\n`);
      if (normalized.suggestedBaseUrl) {
        process.stderr.write(`Did you mean: ${normalized.suggestedBaseUrl}\n`);
      }
    }
    return 2;
  }

  const model = (args.model ?? '').trim();
  if (!model) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: 'MISSING_MODEL', message: 'model is required; pass --model' },
      });
    } else {
      process.stderr.write('Model is required. Provide --model <id>.\n');
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

  const origin = normalized.origin;
  const pricingRes = await fetchJson(`${origin}/api/v1/public/pricing`, {
    timeoutMs: args.timeoutMs,
  });

  if (!pricingRes.ok) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: {
          code: 'PRICING_UNREACHABLE',
          message: pricingRes.error
            ? `${pricingRes.error.type}: ${pricingRes.error.message}`
            : 'request failed',
        },
      });
    } else {
      process.stderr.write(
        `Pricing request failed: ${
          pricingRes.error
            ? `${pricingRes.error.type}: ${pricingRes.error.message}`
            : 'request failed'
        }\n`,
      );
    }
    return 13;
  }

  if (pricingRes.status !== 200) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: 'PRICING_ERROR', message: `unexpected status ${pricingRes.status}` },
      });
    } else {
      process.stderr.write(`Pricing endpoint returned unexpected status ${pricingRes.status}\n`);
    }
    return 13;
  }

  const parsed = parsePricingForModel(pricingRes.json, model, 0.1);
  if (!parsed.ok) {
    const code = parsed.error.includes('no pricing found for model') ? 12 : 13;
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: code === 12 ? 'MODEL_NOT_FOUND' : 'PRICING_ERROR', message: parsed.error },
      });
    } else {
      process.stderr.write(parsed.error + '\n');
    }
    return code;
  }

  if (args.json) {
    writeJsonValue({
      ok: true,
      baseUrl: normalized.baseUrl,
      model,
      pricing: parsed.estimated,
      warnings: normalized.warnings,
    });
  } else {
    const p = parsed.estimated;
    const feePct = Math.round(p.usageFeeRate * 100);
    process.stdout.write('GonkaGate Pricing\n');
    process.stdout.write(`Base URL: ${normalized.baseUrl}\n\n`);
    process.stdout.write(`Model: ${model}\n`);
    process.stdout.write(`  network:     ${formatMoney6(p.networkUsdPer1M)} per 1M tokens\n`);
    process.stdout.write(
      `  fee (${feePct}%):   ${formatMoney6(p.platformUsdPer1M)} per 1M tokens\n`,
    );
    process.stdout.write(`  total:       ${formatMoney6(p.totalUsdPer1M)} per 1M tokens\n`);
    if (p.updatedAt) process.stdout.write(`  updatedAt:   ${p.updatedAt}\n`);
    process.stdout.write('  note: pricing is estimated and subject to change\n');
  }

  return 0;
}
