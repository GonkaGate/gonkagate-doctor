export type HttpErrorType = 'timeout' | 'network' | 'invalid_json' | 'unknown';

export type HttpError = {
  type: HttpErrorType;
  message: string;
};

export type FetchStatusResult = {
  ok: boolean;
  url: string;
  status?: number;
  ms: number;
  requestId?: string;
  error?: HttpError;
};

export type FetchJsonResult = FetchStatusResult & {
  json?: unknown;
};

type FetchWithTimeoutArgs = Omit<RequestInit, 'signal'> & {
  timeoutMs: number;
};

function getHeaderCaseInsensitive(headers: Headers, name: string): string | undefined {
  // Headers#get is already case-insensitive, but we keep this helper to make intent explicit.
  const value = headers.get(name);
  return value === null ? undefined : value;
}

export function extractRequestId(headers: Headers): string | undefined {
  return (
    getHeaderCaseInsensitive(headers, 'x-request-id') ??
    getHeaderCaseInsensitive(headers, 'x-requestid') ??
    getHeaderCaseInsensitive(headers, 'x-amzn-requestid') ??
    getHeaderCaseInsensitive(headers, 'cf-ray')
  );
}

function asErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function asErrorType(err: unknown): HttpErrorType {
  if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError')
    return 'timeout';
  if (err instanceof TypeError) return 'network';
  return 'unknown';
}

async function fetchRaw(
  url: string,
  init: FetchWithTimeoutArgs,
): Promise<FetchStatusResult & { response?: Response }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs);
  const start = Date.now();

  try {
    const { timeoutMs: _timeoutMs, ...requestInit } = init;
    const response = await fetch(url, { ...requestInit, signal: controller.signal });
    const ms = Date.now() - start;
    return {
      ok: true,
      url,
      status: response.status,
      ms,
      requestId: extractRequestId(response.headers),
      response,
    };
  } catch (err: unknown) {
    const ms = Date.now() - start;
    return {
      ok: false,
      url,
      ms,
      error: { type: asErrorType(err), message: asErrorMessage(err) },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchStatus(
  url: string,
  init: FetchWithTimeoutArgs,
): Promise<FetchStatusResult> {
  const res = await fetchRaw(url, init);
  if (res.ok && res.response?.body) {
    try {
      void res.response.body.cancel();
    } catch {
      // Ignore.
    }
  }
  // Drop the response object to avoid leaking it through the API surface.
  const { response: _response, ...rest } = res;
  return rest;
}

export async function fetchJson(url: string, init: FetchWithTimeoutArgs): Promise<FetchJsonResult> {
  const res = await fetchRaw(url, init);
  if (!res.ok || !res.response) {
    const { response: _response, ...rest } = res;
    return rest;
  }

  let json: unknown;
  try {
    // Some backends return JSON without content-type; text() + JSON.parse is more tolerant.
    const text = await res.response.text();
    json = text === '' ? undefined : (JSON.parse(text) as unknown);
  } catch (err: unknown) {
    const { response: _response, ...rest } = res;
    return {
      ...rest,
      ok: false,
      error: { type: 'invalid_json', message: asErrorMessage(err) },
    };
  }

  const { response: _response, ...rest } = res;
  return { ...rest, json };
}
