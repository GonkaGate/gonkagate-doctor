import { describe, expect, it } from 'vitest';

import { parsePricingForModel } from '../src/lib/pricing.js';

describe('parsePricingForModel', () => {
  it('parses models map shape and computes fee/total', () => {
    const body = {
      usageFeeRate: 0.1,
      updatedAt: '2026-02-08T00:00:00Z',
      models: {
        'llama-3.1-70b-instruct': {
          networkUsdPer1M: 0.004,
        },
      },
    };

    const res = parsePricingForModel(body, 'llama-3.1-70b-instruct', 0.1);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.estimated.networkUsdPer1M).toBeCloseTo(0.004, 10);
    expect(res.estimated.platformUsdPer1M).toBeCloseTo(0.0004, 10);
    expect(res.estimated.totalUsdPer1M).toBeCloseTo(0.0044, 10);
    expect(res.estimated.updatedAt).toBe('2026-02-08T00:00:00Z');
  });

  it('parses data[] shape', () => {
    const body = {
      data: [{ model: 'm1', networkUsdPer1M: 1.5, platformUsdPer1M: 0.15, totalUsdPer1M: 1.65 }],
      updatedAt: '2026-02-08T00:00:00Z',
    };

    const res = parsePricingForModel(body, 'm1', 0.1);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.estimated.network).toBeCloseTo(1.5, 10);
    expect(res.estimated.platformFee).toBeCloseTo(0.15, 10);
    expect(res.estimated.total).toBeCloseTo(1.65, 10);
  });

  it('uses default usageFeeRate when missing', () => {
    const body = { data: [{ model: 'm1', networkUsdPer1M: 10 }] };
    const res = parsePricingForModel(body, 'm1', 0.2);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.estimated.usageFeeRate).toBeCloseTo(0.2, 10);
    expect(res.estimated.platformFee).toBeCloseTo(2, 10);
    expect(res.estimated.total).toBeCloseTo(12, 10);
  });

  it('parses wrapped success/data shape with usdPer1MTokens breakdown', () => {
    const body = {
      success: true,
      data: {
        updatedAt: '2026-02-08T15:03:13.251Z',
        fees: {
          platformFeeRate: 0.1,
        },
        models: [
          {
            id: 'qwen/qwen3-235b-a22b-instruct-2507-fp8',
            usdPer1MTokens: {
              network: 0.0013,
              platformFee: 0.00013,
              total: 0.00143,
            },
          },
        ],
      },
    };

    const res = parsePricingForModel(body, 'qwen/qwen3-235b-a22b-instruct-2507-fp8', 0.1);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.estimated.updatedAt).toBe('2026-02-08T15:03:13.251Z');
    expect(res.estimated.usageFeeRate).toBeCloseTo(0.1, 10);
    expect(res.estimated.networkUsdPer1M).toBeCloseTo(0.0013, 10);
    expect(res.estimated.platformUsdPer1M).toBeCloseTo(0.00013, 10);
    expect(res.estimated.totalUsdPer1M).toBeCloseTo(0.00143, 10);
  });

  it('fails when pricing is missing for the model', () => {
    const body = { data: [{ model: 'other', networkUsdPer1M: 1 }] };
    const res = parsePricingForModel(body, 'm1', 0.1);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toMatch('no pricing found');
  });

  it('fails when response is not an object', () => {
    const res = parsePricingForModel('nope', 'm1', 0.1);
    expect(res.ok).toBe(false);
  });
});
