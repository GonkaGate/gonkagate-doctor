import { describe, expect, it } from 'vitest';

import { normalizeBaseUrl } from '../src/lib/url.js';

describe('normalizeBaseUrl', () => {
  it('defaults when empty', () => {
    const res = normalizeBaseUrl(undefined);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.baseUrl).toBe('https://api.gonkagate.com/v1');
  });

  it('accepts /v1 with trailing slash', () => {
    const res = normalizeBaseUrl('https://api.gonkagate.com/v1/');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.baseUrl).toBe('https://api.gonkagate.com/v1');
  });

  it('suggests appending /v1 when missing', () => {
    const res = normalizeBaseUrl('https://api.gonkagate.com');
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.suggestedBaseUrl).toBe('https://api.gonkagate.com/v1');
  });
});
