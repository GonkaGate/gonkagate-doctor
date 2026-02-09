import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { doctor } from '../src/commands/doctor.js';
import type { DoctorJsonOutput } from '../src/lib/output.js';

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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function jsonParseUnknown(text: string): unknown {
  // JSON.parse returns `any`; cast once at the boundary.
  return JSON.parse(text) as unknown;
}

function assertDoctorJsonOutput(v: unknown): asserts v is DoctorJsonOutput {
  if (!isRecord(v) || typeof v.ok !== 'boolean') throw new Error('invalid JSON output');
  if ('checks' in v && v.checks !== undefined && !Array.isArray(v.checks))
    throw new Error('invalid checks');
}

async function runDoctorJson(args: {
  baseUrl: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  smoke?: boolean;
}): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  json: DoctorJsonOutput;
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
    const code = await doctor({
      baseUrl: args.baseUrl,
      apiKey: args.apiKey,
      model: args.model,
      timeoutMs: args.timeoutMs ?? 2000,
      json: true,
      verbose: false,
      smoke: Boolean(args.smoke),
    });

    const parsed = stdout.trim() ? jsonParseUnknown(stdout) : undefined;
    assertDoctorJsonOutput(parsed);
    return { code, stdout, stderr, json: parsed };
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('doctor (integration)', () => {
  it('returns 2 when model is missing', async () => {
    const r = await runDoctorJson({ baseUrl: 'https://api.gonkagate.com/v1', model: undefined });
    expect(r.code).toBe(2);
    expect(r.json.ok).toBe(false);
    expect(r.json.error?.code).toBe('MISSING_MODEL');
  });

  it('returns 2 when timeout is invalid', async () => {
    const r = await runDoctorJson({
      baseUrl: 'https://api.gonkagate.com/v1',
      model: 'm1',
      timeoutMs: 0,
    });
    expect(r.code).toBe(2);
    expect(r.json.ok).toBe(false);
    expect(r.json.error?.code).toBe('INVALID_TIMEOUT');
  });

  it('auto-guesses /v1 when baseUrl is missing /v1 and still works', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/health') {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (req.method === 'GET' && url === '/v1/models') {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ usageFeeRate: 0.1, data: [{ model: 'm1', networkUsdPer1M: 1 }] }));
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.origin, model: 'm1' });
      expect(r.code).toBe(0);
      expect(r.json.baseUrl).toBe(server.baseUrl);
      expect(r.json.warnings?.join('\n')).toMatch('/v1');
    } finally {
      await server.close();
    }
  });

  it('falls back to auth pricing endpoint when public pricing is unavailable', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/pricing') {
        const auth = req.headers.authorization;
        if (auth !== 'Bearer k') {
          res.statusCode = 401;
          res.end();
          return;
        }
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ model: 'm1', networkUsdPer1M: 1 }] }));
        return;
      }

      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.baseUrl, apiKey: 'k', model: 'm1' });
      expect(r.code).toBe(0);
      expect(r.json.ok).toBe(true);
      expect(r.json.estimatedCostPer1M?.totalUsdPer1M).toBeCloseTo(1.1, 10);
    } finally {
      await server.close();
    }
  });

  it('returns 13 when pricing response has no entry for selected model', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(13);
    } finally {
      await server.close();
    }
  });

  it('returns 10 when /v1/models returns invalid JSON', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end('nope');
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
      if (req.method === 'GET' && (url === '/api/v1/public/pricing' || url === '/api/v1/pricing')) {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ model: 'm1', networkUsdPer1M: 1 }] }));
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(10);
    } finally {
      await server.close();
    }
  });

  it('returns 10 on timeout (AbortError) when /v1/models hangs', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        // Intentionally never respond to trigger AbortController timeout.
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1', timeoutMs: 150 });
      expect(r.code).toBe(10);
      const models = r.json.checks?.find((c) => c.name === 'models');
      if (!models) throw new Error('missing models check');
      expect(models.hint).toMatch('timeout');
    } finally {
      await server.close();
    }
  });

  it('returns 10 when /v1/chat/completions returns 500', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 500;
        res.end();
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(10);
    } finally {
      await server.close();
    }
  });

  it('returns 13 when pricing returns invalid JSON', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
      if (req.method === 'GET' && (url === '/api/v1/public/pricing' || url === '/api/v1/pricing')) {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end('nope');
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(13);
      const pricing = r.json.checks?.find((c) => c.name === 'pricing');
      if (!pricing) throw new Error('missing pricing check');
      expect(pricing.hint).toMatch('invalid_json');
    } finally {
      await server.close();
    }
  });

  it('parses wrapped success/data pricing response from /api/v1/public/pricing', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'qwen/qwen3-235b-a22b-instruct-2507-fp8' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            data: {
              updatedAt: '2026-02-08T15:03:13.251Z',
              fees: { platformFeeRate: 0.1 },
              models: [
                {
                  id: 'qwen/qwen3-235b-a22b-instruct-2507-fp8',
                  usdPer1MTokens: { network: 0.0013, platformFee: 0.00013, total: 0.00143 },
                },
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
      const r = await runDoctorJson({
        baseUrl: server.baseUrl,
        model: 'qwen/qwen3-235b-a22b-instruct-2507-fp8',
      });
      expect(r.code).toBe(0);
      expect(r.json.estimatedCostPer1M?.totalUsdPer1M).toBeCloseTo(0.00143, 10);
      expect(r.json.estimatedCostPer1M?.updatedAt).toBe('2026-02-08T15:03:13.251Z');
    } finally {
      await server.close();
    }
  });

  it('returns 10 when /v1/models returns 200 but response shape is invalid', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ foo: [] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(10);
      const models = r.json.checks?.find((c) => c.name === 'models');
      if (!models) throw new Error('missing models check');
      expect(models.hint).toMatch('data');
    } finally {
      await server.close();
    }
  });

  it('returns 11 when /v1/chat/completions is 401 (even if /v1/models is 200)', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 401;
        res.end();
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(11);
    } finally {
      await server.close();
    }
  });

  it('returns 0 on success (health 404 is skip)', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/health') {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (req.method === 'GET' && url === '/v1/models') {
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({ data: [{ id: 'llama-3.1-70b-instruct' }, { id: 'llama-3.1-8b' }] }),
        );
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: { message: 'bad request' } }));
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            usageFeeRate: 0.1,
            updatedAt: '2026-02-08T00:00:00Z',
            data: [{ model: 'llama-3.1-70b-instruct', networkUsdPer1M: 0.004 }],
          }),
        );
        return;
      }

      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'llama-3.1-70b-instruct' });
      expect(r.code).toBe(0);
      expect(r.json.ok).toBe(true);
      expect(r.json.baseUrl).toBe(server.baseUrl);
      expect(r.json.estimatedCostPer1M?.totalUsdPer1M).toBeCloseTo(0.0044, 10);
    } finally {
      await server.close();
    }
  });

  it('doctor --smoke: skips when chat returns insufficient_quota (429)', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 429;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            error: {
              message: 'Insufficient quota.',
              type: 'insufficient_quota',
              code: 'insufficient_quota',
              param: null,
              metadata: { balance_usd: '0.00', estimated_cost_usd: '0.000011' },
            },
          }),
        );
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1', smoke: true });
      expect(r.code).toBe(0);
      const chat = r.json.checks?.find((c) => c.name === 'chatCompletions');
      if (!chat) throw new Error('missing chatCompletions check');
      expect(chat.ok).toBe(true);
      expect(chat.skipped).toBe(true);
      expect(chat.hint ?? '').toMatch('balance');
    } finally {
      await server.close();
    }
  });

  it('doctor --smoke: returns 12 when chat reports invalid_model (even if models list contains it)', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            error: {
              message: 'Model not found.',
              type: 'invalid_request_error',
              code: 'invalid_model',
              param: 'model',
            },
          }),
        );
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1', smoke: true });
      expect(r.code).toBe(12);
    } finally {
      await server.close();
    }
  });

  it('returns 11 on auth error (401)', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: { message: 'unauthorized' } }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 401;
        res.end();
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
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(11);
      expect(r.json.ok).toBe(false);
      const models = r.json.checks?.find((c) => c.name === 'models');
      if (!models) throw new Error('missing models check');
      expect(models.status).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('returns 12 when model not found and provides suggestions', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({ data: [{ id: 'llama-3.1-70b-instruct' }, { id: 'llama-3.1-8b' }] }),
        );
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
      if (req.method === 'GET' && url === '/api/v1/public/pricing') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({ data: [{ model: 'llama-3.1-70b-instruct', networkUsdPer1M: 1 }] }),
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'llama-3.1-70b' });
      expect(r.code).toBe(12);
      const modelExists = r.json.checks?.find((c) => c.name === 'modelExists');
      if (!modelExists) throw new Error('missing modelExists check');
      expect(modelExists.ok).toBe(false);
      expect(Array.isArray(modelExists.suggestions)).toBe(true);
      expect(modelExists.suggestions?.length ?? 0).toBeGreaterThan(0);
    } finally {
      await server.close();
    }
  });

  it('returns 13 when pricing endpoint unavailable', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ data: [{ id: 'm1' }] }));
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 400;
        res.end();
        return;
      }
      if (req.method === 'GET' && (url === '/api/v1/public/pricing' || url === '/api/v1/pricing')) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(13);
      const pricing = r.json.checks?.find((c) => c.name === 'pricing');
      if (!pricing) throw new Error('missing pricing check');
      expect(pricing.ok).toBe(false);
    } finally {
      await server.close();
    }
  });

  it('returns 10 when /v1/models is 404', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/v1/models') {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (req.method === 'POST' && url === '/v1/chat/completions') {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runDoctorJson({ baseUrl: server.baseUrl, model: 'm1' });
      expect(r.code).toBe(10);
    } finally {
      await server.close();
    }
  });
});
