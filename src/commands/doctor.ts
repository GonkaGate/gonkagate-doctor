import { determineExitCode } from '../lib/exit-codes.js';
import { headerAuth } from '../lib/auth.js';
import { fetchJson, fetchStatus } from '../lib/http.js';
import {
  formatOpenAiError,
  isInsufficientQuotaError,
  parseOpenAiError,
} from '../lib/openai-error.js';
import { writeHuman, writeJson, type DoctorCheck, type DoctorJsonOutput } from '../lib/output.js';
import { parsePricingForModel, type EstimatedCostPer1M } from '../lib/pricing.js';
import { suggestModels } from '../lib/suggest.js';
import { normalizeBaseUrl } from '../lib/url.js';

export type DoctorArgs = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
  json: boolean;
  verbose: boolean;
  smoke: boolean;
};

type ModelsListParseResult = { ok: true; models: string[] } | { ok: false; error: string };

function parseModelsList(body: unknown): ModelsListParseResult {
  if (!body || typeof body !== 'object')
    return { ok: false, error: 'models response is not an object' };
  const record = body as Record<string, unknown>;
  const data = record.data;
  if (!Array.isArray(data)) return { ok: false, error: 'models response missing data[]' };

  const models: string[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const id = (item as Record<string, unknown>).id;
    if (typeof id === 'string' && id.trim() !== '') models.push(id);
  }

  if (models.length === 0) return { ok: false, error: 'models list is empty or has no ids' };
  return { ok: true, models };
}

export async function doctor(args: DoctorArgs): Promise<number> {
  const normalized = normalizeBaseUrl(args.baseUrl);
  if (!normalized.ok) {
    if (args.json) {
      writeJson({
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
    const out: DoctorJsonOutput = {
      ok: false,
      baseUrl: normalized.baseUrl,
      error: {
        code: 'MISSING_MODEL',
        message: 'model is required; set --model or GONKAGATE_MODEL',
      },
      warnings: normalized.warnings,
      checks: [],
    };
    if (args.json) {
      writeJson(out);
    } else {
      process.stderr.write('Model is required. Provide --model <id> or set GONKAGATE_MODEL.\n');
    }
    return 2;
  }

  const baseUrl = normalized.baseUrl;
  const origin = normalized.origin;
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    const out: DoctorJsonOutput = {
      ok: false,
      baseUrl,
      error: { code: 'INVALID_TIMEOUT', message: 'timeoutMs must be a positive number' },
      warnings: normalized.warnings,
      checks: [],
    };
    if (args.json) {
      writeJson(out);
    } else {
      process.stderr.write('Invalid --timeout: must be a positive number of milliseconds.\n');
    }
    return 2;
  }

  const timeoutMs = args.timeoutMs;
  const apiKeyProvided = (args.apiKey ?? '').trim() !== '';

  const commonHeaders: RequestInit['headers'] = {
    ...(headerAuth(args.apiKey) ?? {}),
  };

  const healthPromise = fetchStatus(`${origin}/health`, { timeoutMs });
  const modelsPromise = fetchJson(`${baseUrl}/models`, { timeoutMs, headers: commonHeaders });
  const chatPromise = args.smoke
    ? fetchJson(`${baseUrl}/chat/completions`, {
        timeoutMs,
        method: 'POST',
        headers: { 'content-type': 'application/json', ...commonHeaders },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      })
    : fetchStatus(`${baseUrl}/chat/completions`, {
        timeoutMs,
        method: 'POST',
        headers: { 'content-type': 'application/json', ...commonHeaders },
        body: '{}',
      });

  const pricingPromise = (async () => {
    const publicUrl = `${origin}/api/v1/public/pricing`;
    const authUrl = `${origin}/api/v1/pricing`;

    const publicRes = await fetchJson(publicUrl, { timeoutMs });
    if (publicRes.ok && publicRes.status === 200)
      return { ...publicRes, endpoint: 'public' as const };

    const authRes = await fetchJson(authUrl, { timeoutMs, headers: commonHeaders });
    return { ...authRes, endpoint: 'auth' as const };
  })();

  const [healthRes, modelsRes, chatRes, pricingRes] = await Promise.all([
    healthPromise,
    modelsPromise,
    chatPromise,
    pricingPromise,
  ]);

  const checks: DoctorCheck[] = [];

  // health
  {
    const check: DoctorCheck = {
      name: 'health',
      ok: false,
      status: healthRes.status,
      ms: healthRes.ms,
      requestId: healthRes.requestId,
    };
    if (!healthRes.ok) {
      check.hint = healthRes.error
        ? `${healthRes.error.type}: ${healthRes.error.message}`
        : 'request failed';
    } else if (healthRes.status === 404) {
      check.ok = true;
      check.skipped = true;
      check.hint = 'not implemented (404)';
    } else if (healthRes.status === 200 || healthRes.status === 204) {
      check.ok = true;
    } else {
      check.hint = `unexpected status ${healthRes.status}`;
    }
    checks.push(check);
  }

  // models
  const modelsCheck: DoctorCheck = {
    name: 'models',
    ok: false,
    status: modelsRes.status,
    ms: modelsRes.ms,
    requestId: modelsRes.requestId,
  };
  let modelsList: string[] | undefined;
  let modelsAuthError = false;
  if (!modelsRes.ok) {
    modelsCheck.hint = modelsRes.error
      ? `${modelsRes.error.type}: ${modelsRes.error.message}`
      : 'request failed';
  } else if (modelsRes.status === 200) {
    const parsed = parseModelsList(modelsRes.json);
    if (!parsed.ok) {
      modelsCheck.hint = parsed.error;
    } else {
      modelsList = parsed.models;
      modelsCheck.ok = true;
    }
  } else if (modelsRes.status === 401) {
    modelsAuthError = true;
    modelsCheck.hint = 'unauthorized (check API key)';
  } else if (modelsRes.status === 403) {
    modelsAuthError = true;
    modelsCheck.hint = 'forbidden (account may be suspended)';
  } else if (modelsRes.status === 404) {
    modelsCheck.hint = 'not found (baseUrl likely incorrect; must end with /v1)';
  } else {
    modelsCheck.hint = `unexpected status ${modelsRes.status}`;
  }
  checks.push(modelsCheck);

  // chatCompletions route-level reachability
  const chatCheck: DoctorCheck = {
    name: 'chatCompletions',
    ok: false,
    status: chatRes.status,
    ms: chatRes.ms,
    requestId: chatRes.requestId,
  };
  const chatBody: unknown = args.smoke ? (chatRes as { json?: unknown }).json : undefined;
  let chatAuthError = false;
  let smokeSkippedInsufficientQuota = false;
  let smokeFailed = false;
  let smokeInvalidModel = false;
  if (!chatRes.ok) {
    chatCheck.hint = chatRes.error
      ? `${chatRes.error.type}: ${chatRes.error.message}`
      : 'request failed';
    if (args.smoke) smokeFailed = true;
  } else if (chatRes.status === 404) {
    chatCheck.hint = 'not found (route missing)';
    if (args.smoke) smokeFailed = true;
  } else if (chatRes.status !== undefined && chatRes.status >= 500) {
    chatCheck.hint = `server error (${chatRes.status})`;
    if (args.smoke) smokeFailed = true;
  } else if (args.smoke) {
    if (chatRes.status === 200) {
      chatCheck.ok = true;
      chatCheck.hint = 'smoke ok (max_tokens=1)';
    } else if (isInsufficientQuotaError(chatRes.status, chatBody)) {
      smokeSkippedInsufficientQuota = true;
      chatCheck.ok = true;
      chatCheck.skipped = true;
      const err = parseOpenAiError(chatBody);
      const balance = err?.metadata?.balance_usd;
      chatCheck.hint =
        typeof balance === 'string'
          ? `insufficient balance (balance_usd=${balance})`
          : 'insufficient balance (insufficient_quota)';
    } else {
      smokeFailed = true;
      const err = formatOpenAiError(parseOpenAiError(chatBody));
      if (chatRes.status === 401) {
        chatAuthError = true;
        chatCheck.hint = 'unauthorized (check API key)';
      } else if (chatRes.status === 403) {
        chatAuthError = true;
        chatCheck.hint = err ? `forbidden - ${err}` : 'forbidden (account may be suspended)';
      } else if (chatRes.status === 400) {
        const parsedErr = parseOpenAiError(chatBody);
        if (parsedErr?.code === 'invalid_model') smokeInvalidModel = true;
        chatCheck.hint = err ?? 'bad request (unexpected for smoke)';
      } else {
        chatCheck.hint = err
          ? `unexpected status ${chatRes.status} - ${err}`
          : `unexpected status ${chatRes.status}`;
      }
    }
  } else {
    // Route-level reachability: any non-404, non-5xx response means the route exists.
    if (chatRes.status === 401 || chatRes.status === 403) chatAuthError = true;
    chatCheck.ok = true;
    if (chatRes.status === 401) chatCheck.hint = 'unauthorized (check API key)';
    else if (chatRes.status === 403) chatCheck.hint = 'forbidden (account may be suspended)';
  }
  checks.push(chatCheck);

  // modelExists
  const modelExistsCheck: DoctorCheck = { name: 'modelExists', ok: false, model };
  let modelNotFound = false;
  if (!modelsList) {
    modelExistsCheck.skipped = true;
    modelExistsCheck.ok = true;
    modelExistsCheck.hint = 'skipped (models list unavailable)';
  } else if (modelsList.includes(model)) {
    modelExistsCheck.ok = true;
  } else {
    modelNotFound = true;
    modelExistsCheck.hint = 'model not found';
    modelExistsCheck.suggestions = suggestModels(model, modelsList);
  }
  checks.push(modelExistsCheck);

  // pricing
  const pricingCheck: DoctorCheck = {
    name: 'pricing',
    ok: false,
    status: pricingRes.status,
    ms: pricingRes.ms,
    requestId: pricingRes.requestId,
  };
  let estimated: EstimatedCostPer1M | undefined;
  let pricingError = false;
  let pricingAuthError = false;
  if (!pricingRes.ok) {
    pricingError = true;
    pricingCheck.hint = pricingRes.error
      ? `${pricingRes.error.type}: ${pricingRes.error.message}`
      : 'request failed';
  } else if (pricingRes.status === 200) {
    const parsed = parsePricingForModel(pricingRes.json, model, 0.1);
    if (!parsed.ok) {
      pricingError = true;
      pricingCheck.hint = parsed.error;
    } else {
      estimated = parsed.estimated;
      pricingCheck.ok = true;
    }
  } else if (pricingRes.status === 401) {
    pricingAuthError = true;
    pricingCheck.hint = 'unauthorized (check API key)';
  } else if (pricingRes.status === 404) {
    pricingError = true;
    pricingCheck.hint = 'not found';
  } else {
    pricingError = true;
    pricingCheck.hint = `unexpected status ${pricingRes.status}`;
  }
  checks.push(pricingCheck);

  const modelsOkForMvp =
    modelsRes.ok && modelsRes.status === 200 && Array.isArray(modelsList) && modelsList.length > 0;
  const modelsUnreachableOrInvalid =
    !modelsRes.ok ||
    modelsRes.status === undefined ||
    modelsRes.status === 404 ||
    (modelsRes.status !== 200 && modelsRes.status !== 401 && modelsRes.status !== 403) ||
    (modelsRes.status === 200 && !modelsOkForMvp);

  const chatUnreachableOrInvalid =
    !chatRes.ok ||
    chatRes.status === undefined ||
    chatRes.status === 404 ||
    (chatRes.status !== undefined && chatRes.status >= 500) ||
    (args.smoke &&
      smokeFailed &&
      !smokeSkippedInsufficientQuota &&
      !chatAuthError &&
      !smokeInvalidModel);

  const baseUrlUnreachable = modelsUnreachableOrInvalid || chatUnreachableOrInvalid;

  const authError = modelsAuthError || chatAuthError || pricingAuthError;
  if (args.smoke && smokeInvalidModel) modelNotFound = true;

  const exitCode = determineExitCode({
    invalidArgs: false,
    baseUrlUnreachable,
    authError,
    modelNotFound,
    pricingError,
  });

  const ok = exitCode === 0;

  const nextHints: string[] = [];
  nextHints.push(`Use base_url="${baseUrl}"`);
  if (authError) {
    if (!apiKeyProvided) {
      nextHints.push('Set GONKAGATE_API_KEY or pass --api-key');
    } else if (
      args.smoke &&
      chatRes.ok &&
      chatRes.status === 403 &&
      modelsRes.ok &&
      modelsRes.status === 200
    ) {
      nextHints.push(
        'Chat completions was denied (403 permission_denied). Try another model or retry later.',
      );
    } else {
      nextHints.push('Check API key and account permissions');
    }
  }
  if (args.smoke && smokeFailed && !smokeSkippedInsufficientQuota && !chatAuthError) {
    const err = !chatRes.ok ? chatRes.error : undefined;
    if (err?.type === 'timeout') {
      nextHints.push('Smoke request timed out. Try --timeout 30000 (or higher) or retry later.');
    } else if (err?.type === 'network') {
      nextHints.push('Smoke request failed due to a network error. Retry later.');
    } else {
      nextHints.push('Smoke request failed. Try another model or retry later.');
    }
  }
  if (modelNotFound)
    nextHints.push(
      'Pick a valid model id (see suggestions above or run doctor with a known model)',
    );

  if (args.json) {
    const out: DoctorJsonOutput = {
      ok,
      baseUrl,
      warnings: normalized.warnings,
      checks,
      estimatedCostPer1M: estimated,
    };
    if (!ok) {
      out.error = {
        code:
          exitCode === 10
            ? 'BASE_URL_UNREACHABLE'
            : exitCode === 11
              ? 'AUTH_ERROR'
              : exitCode === 12
                ? 'MODEL_NOT_FOUND'
                : exitCode === 13
                  ? 'PRICING_ERROR'
                  : 'UNKNOWN',
        message: 'doctor checks failed',
      };
    }
    writeJson(out);
  } else {
    writeHuman({
      baseUrl,
      warnings: normalized.warnings,
      checks,
      estimated,
      nextHints,
      verbose: args.verbose,
    });
  }

  return exitCode;
}
