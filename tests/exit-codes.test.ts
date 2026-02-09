import { describe, expect, it } from 'vitest';

import { determineExitCode } from '../src/lib/exit-codes.js';

describe('determineExitCode', () => {
  it('returns 0 when no errors', () => {
    expect(determineExitCode({})).toBe(0);
  });

  it('prefers invalid args (2)', () => {
    expect(
      determineExitCode({
        invalidArgs: true,
        baseUrlUnreachable: true,
        authError: true,
        modelNotFound: true,
      }),
    ).toBe(2);
  });

  it('prefers baseUrl unreachable (10) over auth/model/pricing', () => {
    expect(
      determineExitCode({
        baseUrlUnreachable: true,
        authError: true,
        modelNotFound: true,
        pricingError: true,
      }),
    ).toBe(10);
  });

  it('prefers auth error (11) over model/pricing', () => {
    expect(determineExitCode({ authError: true, modelNotFound: true, pricingError: true })).toBe(
      11,
    );
  });

  it('prefers model not found (12) over pricing', () => {
    expect(determineExitCode({ modelNotFound: true, pricingError: true })).toBe(12);
  });

  it('returns pricing error (13) when only pricing failed', () => {
    expect(determineExitCode({ pricingError: true })).toBe(13);
  });
});
