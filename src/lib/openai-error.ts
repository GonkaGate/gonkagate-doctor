export type OpenAiError = {
  message?: string;
  type?: string;
  code?: string;
  param?: string | null;
  metadata?: Record<string, unknown>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

export function parseOpenAiError(body: unknown): OpenAiError | undefined {
  if (!isRecord(body)) return undefined;
  const err = body.error;
  if (!isRecord(err)) return undefined;

  const metadata = isRecord(err.metadata) ? err.metadata : undefined;

  const parsed: OpenAiError = {
    message: asString(err.message),
    type: asString(err.type),
    code: asString(err.code),
    param: typeof err.param === 'string' ? err.param : err.param === null ? null : undefined,
    metadata,
  };

  if (!parsed.message && !parsed.type && !parsed.code && !parsed.param && !parsed.metadata)
    return undefined;
  return parsed;
}

export function formatOpenAiError(err: OpenAiError | undefined): string | undefined {
  if (!err) return undefined;
  const parts: string[] = [];
  if (err.type) parts.push(err.type);
  if (err.code) parts.push(err.code);
  const prefix = parts.length > 0 ? `${parts.join('/')}: ` : '';
  const msg = err.message ?? 'request failed';
  return prefix + msg;
}

export function isInsufficientQuotaError(status: number | undefined, body: unknown): boolean {
  if (status !== 429) return false;
  const err = parseOpenAiError(body);
  return err?.type === 'insufficient_quota' || err?.code === 'insufficient_quota';
}
