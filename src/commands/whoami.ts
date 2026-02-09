import { headerAuth } from '../lib/auth.js';
import { fetchJson } from '../lib/http.js';
import { normalizeBaseUrl } from '../lib/url.js';

function writeJsonValue(v: unknown): void {
  process.stdout.write(JSON.stringify(v, null, 2) + '\n');
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

function asBoolean(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

export type WhoamiArgs = {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs: number;
  json: boolean;
  verbose: boolean;
};

type ApiWhoamiData = {
  user: { emailMasked: string; emailVerified: boolean };
  apiKey: {
    name?: string;
    maskedKey: string;
    status: 'active' | 'disabled' | 'expired';
    expiresAt: string | null;
    lastUsed: string | null;
  };
  balance: { usd: string; status: 'active' | 'low' | 'suspended' };
};

function parseWhoamiData(body: unknown): ApiWhoamiData | undefined {
  if (!isRecord(body)) return undefined;
  if (body.success !== true) return undefined;

  const data = body.data;
  if (!isRecord(data)) return undefined;

  const user = data.user;
  const apiKey = data.apiKey;
  const balance = data.balance;
  if (!isRecord(user) || !isRecord(apiKey) || !isRecord(balance)) return undefined;

  const emailMasked = asString(user.emailMasked);
  const emailVerified = asBoolean(user.emailVerified);
  if (!emailMasked || emailVerified === undefined) return undefined;

  const maskedKey = asString(apiKey.maskedKey);
  const status = asString(apiKey.status);
  if (!maskedKey || (status !== 'active' && status !== 'disabled' && status !== 'expired'))
    return undefined;

  const expiresAtRaw = apiKey.expiresAt;
  const expiresAt =
    expiresAtRaw === null ? null : typeof expiresAtRaw === 'string' ? expiresAtRaw : undefined;
  if (expiresAt === undefined) return undefined;

  const lastUsedRaw = apiKey.lastUsed;
  const lastUsed =
    lastUsedRaw === null ? null : typeof lastUsedRaw === 'string' ? lastUsedRaw : undefined;
  if (lastUsed === undefined) return undefined;

  const usd = asString(balance.usd);
  const balanceStatus = asString(balance.status);
  if (
    !usd ||
    (balanceStatus !== 'active' && balanceStatus !== 'low' && balanceStatus !== 'suspended')
  )
    return undefined;

  const name = asString(apiKey.name);

  return {
    user: { emailMasked, emailVerified },
    apiKey: { name, maskedKey, status, expiresAt, lastUsed },
    balance: { usd, status: balanceStatus },
  };
}

type ApiWhoamiError = {
  message: string;
  statusCode: number;
  requestId?: string;
  timestamp?: string;
};

function parseWhoamiError(body: unknown): ApiWhoamiError | undefined {
  if (!isRecord(body)) return undefined;
  if (body.success !== false) return undefined;
  const err = body.error;
  if (!isRecord(err)) return undefined;

  const message = asString(err.message);
  const statusCode =
    typeof err.statusCode === 'number' && Number.isFinite(err.statusCode)
      ? err.statusCode
      : undefined;
  if (!message || statusCode === undefined) return undefined;

  return {
    message,
    statusCode,
    requestId: asString(err.requestId),
    timestamp: asString(err.timestamp),
  };
}

export async function whoami(args: WhoamiArgs): Promise<number> {
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

  const origin = normalized.origin;
  const url = `${origin}/api/v1/whoami`;
  const res = await fetchJson(url, {
    timeoutMs: args.timeoutMs,
    headers: { ...(headerAuth(apiKey) ?? {}) },
  });

  if (!res.ok) {
    const msg = res.error ? `${res.error.type}: ${res.error.message}` : 'request failed';
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: 'WHOAMI_UNREACHABLE', message: msg },
      });
    } else {
      process.stderr.write(`whoami request failed: ${msg}\n`);
    }
    return res.error?.type === 'invalid_json' ? 13 : 10;
  }

  if (res.status === 404) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'whoami endpoint not implemented on the backend',
        },
      });
    } else {
      process.stderr.write('whoami endpoint is not implemented on this backend.\n');
      process.stderr.write('Expected: GET /api/v1/whoami\n');
    }
    return 13;
  }

  if (res.status === 401) {
    const apiErr = parseWhoamiError(res.json);
    const msg = apiErr?.message ?? 'Unauthorized';
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: 'AUTH_ERROR', message: msg },
        requestId: apiErr?.requestId ?? res.requestId,
        timestamp: apiErr?.timestamp,
      });
    } else {
      process.stderr.write(`${msg}. Check your API key.\n`);
      if (args.verbose && (apiErr?.requestId ?? res.requestId))
        process.stderr.write(`requestId: ${apiErr?.requestId ?? res.requestId}\n`);
    }
    return 11;
  }

  if (res.status !== 200) {
    const apiErr = parseWhoamiError(res.json);
    const msg = apiErr?.message ?? `unexpected status ${res.status}`;
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: 'WHOAMI_ERROR', message: msg },
        requestId: apiErr?.requestId ?? res.requestId,
        timestamp: apiErr?.timestamp,
      });
    } else {
      process.stderr.write(`whoami failed: ${msg}\n`);
      if (args.verbose && (apiErr?.requestId ?? res.requestId))
        process.stderr.write(`requestId: ${apiErr?.requestId ?? res.requestId}\n`);
    }
    return 13;
  }

  const data = parseWhoamiData(res.json);
  if (!data) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        baseUrl: normalized.baseUrl,
        error: { code: 'WHOAMI_ERROR', message: 'invalid whoami response' },
      });
    } else {
      process.stderr.write('Invalid whoami response.\n');
    }
    return 13;
  }

  if (args.json) {
    writeJsonValue({
      ok: true,
      baseUrl: normalized.baseUrl,
      warnings: normalized.warnings,
      ...data,
    });
  } else {
    process.stdout.write('GonkaGate WhoAmI\n');
    process.stdout.write(`Base URL: ${normalized.baseUrl}\n\n`);
    process.stdout.write(
      `User: ${data.user.emailMasked}${data.user.emailVerified ? ' (verified)' : ''}\n`,
    );
    process.stdout.write('\n');
    process.stdout.write(`API key: ${data.apiKey.name ?? '(unnamed)'}\n`);
    process.stdout.write(`  key:     ${data.apiKey.maskedKey}\n`);
    process.stdout.write(`  status:  ${data.apiKey.status}\n`);
    process.stdout.write(`  expires: ${data.apiKey.expiresAt ?? 'never'}\n`);
    process.stdout.write(
      `  lastUsed:${data.apiKey.lastUsed ? ` ${data.apiKey.lastUsed}` : ' never'}\n`,
    );
    process.stdout.write('\n');
    process.stdout.write(`Balance: $${data.balance.usd} (${data.balance.status})\n`);
    if (args.verbose && res.requestId) process.stdout.write(`requestId: ${res.requestId}\n`);
  }

  return 0;
}
