import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { pricing } from '../src/commands/pricing.js';

type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void;

async function startServer(
  handler: RouteHandler,
): Promise<{ origin: string; baseUrl: string; close: () => Promise<void> }> {
  const server = createServer(handler);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('unexpected server address');

  const origin = `http://127.0.0.1:${addr.port}`;
  const baseUrl = `${origin}/v1`;

  return {
    origin,
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}

function jsonParseUnknown(text: string): unknown {
  return JSON.parse(text) as unknown;
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function runPricingJson(args: {
  baseUrl: string;
  model: string;
}): Promise<{ code: number; stdout: string; json: unknown }> {
  let stdout = '';
  const stdoutSpy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stdout += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      return true;
    });

  try {
    const code = await pricing({
      baseUrl: args.baseUrl,
      model: args.model,
      timeoutMs: 2000,
      json: true,
    });
    const parsed = stdout.trim() ? jsonParseUnknown(stdout) : undefined;
    return { code, stdout, json: parsed };
  } finally {
    stdoutSpy.mockRestore();
  }
}

describe('pricing (integration)', () => {
  it('returns 0 and prints pricing for the model', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            data: {
              updatedAt: '2026-02-06T12:00:00.000Z',
              models: [{ id: 'm1', usdPer1MTokens: { network: 1, platformFee: 0.1, total: 1.1 } }],
            },
          }),
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runPricingJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(0);
      const json = r.json as { ok?: unknown; pricing?: { totalUsdPer1M?: unknown } };
      expect(json.ok).toBe(true);
      expect(json.pricing?.totalUsdPer1M).toBeCloseTo(1.1, 10);
    } finally {
      await server.close();
    }
  });

  it('returns 12 when model is missing in pricing', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ model: 'other', networkUsdPer1M: 1 }] }));
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runPricingJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(12);
    } finally {
      await server.close();
    }
  });
});
