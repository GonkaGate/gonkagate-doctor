import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { models } from '../src/commands/models.js';

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

async function runModelsJson(args: { baseUrl: string; apiKey?: string }): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  json: unknown;
}> {
  let stdout = '';
  let stderr = '';

  const stdoutSpy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stdout += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      return true;
    });
  const stderrSpy = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stderr += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      return true;
    });

  try {
    const code = await models({
      baseUrl: args.baseUrl,
      apiKey: args.apiKey,
      timeoutMs: 2000,
      json: true,
      verbose: false,
    });
    const parsed = stdout.trim() ? jsonParseUnknown(stdout) : undefined;
    return { code, stdout, stderr, json: parsed };
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
}

describe('models (integration)', () => {
  it('returns 0 and joins models with pricing', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1', name: 'Model 1' }, { id: 'm2' }] }));
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            data: {
              updatedAt: '2026-02-06T12:00:00.000Z',
              models: [
                { id: 'm1', usdPer1MTokens: { network: 1, platformFee: 0.1, total: 1.1 } },
                { id: 'm2', usdPer1MTokens: { network: 2, platformFee: 0.2, total: 2.2 } },
              ],
            },
          }),
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runModelsJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(0);
      const json = r.json as { ok?: unknown; models?: unknown };
      expect(json.ok).toBe(true);
      expect(Array.isArray(json.models)).toBe(true);
    } finally {
      await server.close();
    }
  });

  it('returns 13 when pricing is missing for a model, but still returns models list', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }, { id: 'm2' }] }));
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ model: 'm1', networkUsdPer1M: 1 }] }));
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runModelsJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(13);
      const json = r.json as { ok?: unknown; models?: unknown; error?: { code?: unknown } };
      expect(json.ok).toBe(false);
      expect(Array.isArray(json.models)).toBe(true);
      expect(json.error?.code).toBe('PRICING_ERROR');
    } finally {
      await server.close();
    }
  });
});
