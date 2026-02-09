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

  it('warns on non-https', () => {
    const res = normalizeBaseUrl('http://example.com/v1');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.warnings.join('\n')).toMatch('http:');
  });

  it('keeps deeper paths ending in /v1 and computes origin accordingly', () => {
    const res = normalizeBaseUrl('https://example.com/proxy/v1');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.baseUrl).toBe('https://example.com/proxy/v1');
    expect(res.origin).toBe('https://example.com/proxy');
  });

  it('fails on invalid URL input', () => {
    const res = normalizeBaseUrl('not a url');
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toBe('not a valid URL');
    expect(res.suggestedBaseUrl).toBe('not a url/v1');
  });

  it('suggests appending /v1 when missing', () => {
    const res = normalizeBaseUrl('https://api.gonkagate.com');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.baseUrl).toBe('https://api.gonkagate.com/v1');
    expect(res.warnings.join('\n')).toMatch('/v1');
  });
});
