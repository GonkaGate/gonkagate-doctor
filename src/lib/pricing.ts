export type EstimatedCostPer1M = {
  currency: 'USD';
  model: string;
  network: number;
  platformFee: number;
  total: number;

  // Required-by-PRD aliases (keep both naming styles for robustness).
  networkUsdPer1M: number;
  platformUsdPer1M: number;
  totalUsdPer1M: number;

  usageFeeRate: number;
  updatedAt?: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

type ModelPricing = {
  model: string;
  networkUsdPer1M: number;
  platformUsdPer1M?: number;
  totalUsdPer1M?: number;
  usageFeeRate?: number;
  updatedAt?: string;
};

function pickUpdatedAt(obj: UnknownRecord): string | undefined {
  return (
    asString(obj.updatedAt) ??
    asString(obj.updated_at) ??
    asString(obj.timestamp) ??
    asString(obj.pricingUpdatedAt)
  );
}

function normalizeModelPricing(
  modelId: string,
  obj: UnknownRecord,
  parent: UnknownRecord,
): ModelPricing | undefined {
  const usdPer1MTokens = isRecord(obj.usdPer1MTokens) ? obj.usdPer1MTokens : undefined;
  const networkNested = usdPer1MTokens ? asNumber(usdPer1MTokens.network) : undefined;
  const platformNested = usdPer1MTokens ? asNumber(usdPer1MTokens.platformFee) : undefined;
  const totalNested = usdPer1MTokens ? asNumber(usdPer1MTokens.total) : undefined;

  const network =
    networkNested ??
    asNumber(obj.networkUsdPer1M) ??
    asNumber(obj.network_usd_per_1m) ??
    asNumber(obj.network) ??
    asNumber(obj.networkUsdPerMillion) ??
    asNumber(obj.usdPer1M);
  if (network === undefined) return undefined;

  const fees = isRecord(parent.fees) ? parent.fees : undefined;

  return {
    model: asString(obj.model) ?? asString(obj.id) ?? asString(obj.modelId) ?? modelId,
    networkUsdPer1M: network,
    platformUsdPer1M:
      platformNested ??
      asNumber(obj.platformUsdPer1M) ??
      asNumber(obj.platform_usd_per_1m) ??
      asNumber(obj.platformFee),
    totalUsdPer1M:
      totalNested ??
      asNumber(obj.totalUsdPer1M) ??
      asNumber(obj.total_usd_per_1m) ??
      asNumber(obj.total),
    usageFeeRate:
      asNumber(obj.usageFeeRate) ??
      asNumber(parent.usageFeeRate) ??
      asNumber(parent.usage_fee_rate) ??
      asNumber(fees?.platformFeeRate) ??
      asNumber(fees?.platform_fee_rate),
    updatedAt: pickUpdatedAt(obj) ?? pickUpdatedAt(parent),
  };
}

function findModelPricing(body: UnknownRecord, model: string): ModelPricing | undefined {
  // Shape A: { models: { [modelId]: {...} }, usageFeeRate, updatedAt }
  if (isRecord(body.models)) {
    const entry = body.models[model];
    if (isRecord(entry)) return normalizeModelPricing(model, entry, body);
  }

  // Shape B: { data: [ { model, ... } ] } or { pricing: [ ... ] }
  const list =
    (Array.isArray(body.data) ? body.data : undefined) ??
    (Array.isArray(body.pricing) ? body.pricing : undefined) ??
    (Array.isArray(body.models) ? body.models : undefined);

  if (Array.isArray(list)) {
    for (const item of list) {
      if (!isRecord(item)) continue;
      const id = asString(item.model) ?? asString(item.id) ?? asString(item.modelId);
      if (id !== model) continue;
      const normalized = normalizeModelPricing(model, item, body);
      if (normalized) return normalized;
    }
  }

  // Shape C: direct model keyed map at root (rare)
  const direct = body[model];
  if (isRecord(direct)) {
    const normalized = normalizeModelPricing(model, direct, body);
    if (normalized) return normalized;
  }

  return undefined;
}

export type PricingParseResult =
  | { ok: true; estimated: EstimatedCostPer1M }
  | { ok: false; error: string };

export type PricingIndex = {
  updatedAt?: string;
  usageFeeRate: number;
  models: Record<string, EstimatedCostPer1M>;
};

export type PricingIndexParseResult =
  | { ok: true; index: PricingIndex }
  | { ok: false; error: string };

function extractModelPricingEntries(root: UnknownRecord): ModelPricing[] {
  const out: ModelPricing[] = [];

  // Shape A: { models: { [modelId]: {...} }, usageFeeRate, updatedAt }
  if (isRecord(root.models)) {
    for (const [modelId, entry] of Object.entries(root.models)) {
      if (!isRecord(entry)) continue;
      const normalized = normalizeModelPricing(modelId, entry, root);
      if (normalized) out.push(normalized);
    }
    return out;
  }

  // Shape B: { data: [ { model, ... } ] } or { pricing: [ ... ] } or { models: [ ... ] }
  const list =
    (Array.isArray(root.data) ? root.data : undefined) ??
    (Array.isArray(root.pricing) ? root.pricing : undefined) ??
    (Array.isArray(root.models) ? root.models : undefined);

  if (Array.isArray(list)) {
    for (const item of list) {
      if (!isRecord(item)) continue;
      const id = asString(item.model) ?? asString(item.id) ?? asString(item.modelId);
      if (!id) continue;
      const normalized = normalizeModelPricing(id, item, root);
      if (normalized) out.push(normalized);
    }
  }

  return out;
}

export function parsePricingForModel(
  body: unknown,
  model: string,
  defaultUsageFeeRate = 0.1,
): PricingParseResult {
  if (!isRecord(body)) return { ok: false, error: 'pricing response is not an object' };

  // Some backends wrap the pricing payload: { success: true, data: { ... } }.
  const root = isRecord(body.data) && !Array.isArray(body.data) ? body.data : body;

  const pricing = findModelPricing(root, model);
  if (!pricing) return { ok: false, error: `no pricing found for model ${model}` };

  const usageFeeRate = pricing.usageFeeRate ?? defaultUsageFeeRate;
  const network = pricing.networkUsdPer1M;
  const platformFee = pricing.platformUsdPer1M ?? network * usageFeeRate;
  const total = pricing.totalUsdPer1M ?? network * (1 + usageFeeRate);

  const estimated: EstimatedCostPer1M = {
    currency: 'USD',
    model,
    network,
    platformFee,
    total,
    networkUsdPer1M: network,
    platformUsdPer1M: platformFee,
    totalUsdPer1M: total,
    usageFeeRate,
    updatedAt: pricing.updatedAt,
  };

  return { ok: true, estimated };
}

export function parsePricingIndex(
  body: unknown,
  defaultUsageFeeRate = 0.1,
): PricingIndexParseResult {
  if (!isRecord(body)) return { ok: false, error: 'pricing response is not an object' };

  // Some backends wrap the pricing payload: { success: true, data: { ... } }.
  const root = isRecord(body.data) && !Array.isArray(body.data) ? body.data : body;

  const entries = extractModelPricingEntries(root);
  if (entries.length === 0) return { ok: false, error: 'pricing response contains no models' };

  const fallbackUsageFeeRate = asNumber(root.usageFeeRate) ?? defaultUsageFeeRate;
  const updatedAt = pickUpdatedAt(root);

  const models: Record<string, EstimatedCostPer1M> = {};
  for (const p of entries) {
    const usageFeeRate = p.usageFeeRate ?? fallbackUsageFeeRate;
    const network = p.networkUsdPer1M;
    const platformFee = p.platformUsdPer1M ?? network * usageFeeRate;
    const total = p.totalUsdPer1M ?? network * (1 + usageFeeRate);

    models[p.model] = {
      currency: 'USD',
      model: p.model,
      network,
      platformFee,
      total,
      networkUsdPer1M: network,
      platformUsdPer1M: platformFee,
      totalUsdPer1M: total,
      usageFeeRate,
      updatedAt: p.updatedAt ?? updatedAt,
    };
  }

  // A single top-level usageFeeRate is still useful for UIs.
  const usageFeeRate =
    asNumber(root.usageFeeRate) ??
    asNumber(root.usage_fee_rate) ??
    asNumber((isRecord(root.fees) ? root.fees : undefined)?.platformFeeRate) ??
    asNumber((isRecord(root.fees) ? root.fees : undefined)?.platform_fee_rate) ??
    defaultUsageFeeRate;

  return { ok: true, index: { updatedAt, usageFeeRate, models } };
}
