export type NormalizeBaseUrlResult =
  | { ok: true; baseUrl: string; origin: string; warnings: string[] }
  | { ok: false; error: string; suggestedBaseUrl?: string };

/**
 * Normalizes user-provided base URL to an OpenAI-compatible `/v1` base URL.
 * The CLI spec treats `/v1` as part of the base URL.
 */
export function normalizeBaseUrl(input: string | undefined): NormalizeBaseUrlResult {
  const raw = (input ?? '').trim();
  if (!raw) {
    return {
      ok: true,
      baseUrl: 'https://api.gonkagate.com/v1',
      origin: 'https://api.gonkagate.com',
      warnings: ['baseUrl not provided; using default https://api.gonkagate.com/v1'],
    };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    const trimmed = raw.replace(/\/+$/, '');
    return {
      ok: false,
      error: 'not a valid URL',
      suggestedBaseUrl: trimmed ? `${trimmed}/v1` : undefined,
    };
  }

  const warnings: string[] = [];
  if (url.protocol !== 'https:') {
    warnings.push(`unexpected protocol ${url.protocol}; https:// is recommended`);
  }

  const origin = url.origin;
  const pathname = url.pathname.replace(/\/+$/, '');

  if (pathname === '/v1') {
    return { ok: true, baseUrl: `${origin}/v1`, origin, warnings };
  }

  // If the user already included a deeper path ending in /v1 (e.g. /proxy/v1), keep it.
  if (pathname.endsWith('/v1')) {
    return { ok: true, baseUrl: `${origin}${pathname}`, origin, warnings };
  }

  const suggestedBaseUrl = `${origin}${pathname === '' ? '' : pathname}/v1`;
  return {
    ok: false,
    error: 'baseUrl must end with /v1',
    suggestedBaseUrl,
  };
}
