import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { whoami } from '../src/commands/whoami.js';

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

async function runWhoamiJson(args: { baseUrl: string; apiKey?: string }): Promise<{
  code: number;
  stdout: string;
  json: unknown;
}> {
  let stdout = '';
  const stdoutSpy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stdout += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      return true;
    });

  try {
    const code = await whoami({
      baseUrl: args.baseUrl,
      apiKey: args.apiKey,
      timeoutMs: 2000,
      json: true,
      verbose: false,
    });
    const parsed = stdout.trim() ? jsonParseUnknown(stdout) : undefined;
    return { code, stdout, json: parsed };
  } finally {
    stdoutSpy.mockRestore();
  }
}

describe('whoami (integration)', () => {
  it('returns 0 and prints whoami payload (per backend spec)', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/api/v1/whoami') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            data: {
              user: { emailMasked: 't**t', emailVerified: true },
              apiKey: {
                name: 'Default',
                maskedKey: 'gp-abcd...wxyz',
                status: 'active',
                expiresAt: null,
                lastUsed: '2026-02-08T10:30:00.000Z',
              },
              balance: { usd: '12.34', status: 'active' },
            },
          }),
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runWhoamiJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(0);
      const json = r.json as {
        ok?: unknown;
        user?: { emailMasked?: unknown; emailVerified?: unknown };
        apiKey?: { maskedKey?: unknown; status?: unknown };
        balance?: { usd?: unknown; status?: unknown };
      };
      expect(json.ok).toBe(true);
      expect(json.user?.emailMasked).toBe('t**t');
      expect(json.user?.emailVerified).toBe(true);
      expect(json.apiKey?.maskedKey).toBe('gp-abcd...wxyz');
      expect(json.apiKey?.status).toBe('active');
      expect(json.balance?.usd).toBe('12.34');
      expect(json.balance?.status).toBe('active');
    } finally {
      await server.close();
    }
  });

  it('returns 11 on 401 with api error format', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/api/v1/whoami') {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            error: {
              message: 'Unauthorized',
              statusCode: 401,
              requestId: 'r1',
              timestamp: '2026-02-08T10:30:00.000Z',
            },
          }),
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runWhoamiJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(11);
      const json = r.json as { ok?: unknown; error?: { code?: unknown; message?: unknown } };
      expect(json.ok).toBe(false);
      expect(json.error?.code).toBe('AUTH_ERROR');
    } finally {
      await server.close();
    }
  });

  it('returns 13 when endpoint is not implemented (404)', async () => {
    const server = await startServer((req, res) => {
      const url = req.url ?? '';
      if (req.method === 'GET' && url === '/api/v1/whoami') {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    try {
      const r = await runWhoamiJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(13);
    } finally {
      await server.close();
    }
  });
});
