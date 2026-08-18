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

async function runModelsHuman(args: {
  baseUrl: string;
  apiKey?: string;
  verbose?: boolean;
}): Promise<{ code: number; stdout: string }> {
  let stdout = '';
  const stdoutSpy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stdout += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      return true;
    });
  const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

  try {
    const code = await models({
      baseUrl: args.baseUrl,
      apiKey: args.apiKey,
      timeoutMs: 2000,
      json: false,
      verbose: Boolean(args.verbose),
    });
    return { code, stdout };
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
}

/** Serves `GET /v1/models` verbatim plus flat pricing for every listed id. */
async function startCatalogServer(
  modelsData: unknown[],
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const ids = modelsData
    .map((m) => (m as { id?: unknown }).id)
    .filter((id): id is string => typeof id === 'string');

  return startServer((req, res) => {
    const url = req.url ?? '';
    if (req.method === 'GET' && url === '/v1/models') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ object: 'list', data: modelsData }));
      return;
    }
    if (req.method === 'GET' && url === '/api/v1/public/pricing') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: ids.map((id) => ({ model: id, networkUsdPer1M: 1 })) }));
      return;
    }
    res.statusCode = 404;
    res.end();
  });
}

type OutModel = {
  id: string;
  name?: unknown;
  description?: unknown;
  contextLength?: unknown;
};

function outModels(json: unknown): OutModel[] {
  const list = (json as { models?: unknown }).models;
  if (!Array.isArray(list)) throw new Error('expected models[] in output');
  return list as OutModel[];
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

  // A gateway that has not shipped the enriched catalog yet returns only the
  // OpenAI-compatible fields. The CLI must degrade, not crash or invent values.
  it('falls back when the gateway returns only id/object/created/owned_by', async () => {
    const server = await startCatalogServer([
      { id: 'm1', object: 'model', created: 0, owned_by: 'gonka' },
      { id: 'm2', object: 'model', created: 0, owned_by: 'gonka' },
    ]);

    try {
      const r = await runModelsJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(0);

      const [first, second] = outModels(r.json);
      expect(first?.id).toBe('m1');
      expect(second?.id).toBe('m2');
      // Absent metadata is omitted, never emitted as 0/null/a placeholder.
      for (const m of [first, second]) {
        expect(m).not.toHaveProperty('contextLength');
        expect(m).not.toHaveProperty('name');
        expect(m).not.toHaveProperty('description');
      }

      const human = await runModelsHuman({ baseUrl: server.baseUrl, apiKey: 'k', verbose: true });
      expect(human.code).toBe(0);
      expect(human.stdout).toContain('context');
      expect(human.stdout).toMatch(/^m1\s+.*\bn\/a\b/m);
    } finally {
      await server.close();
    }
  });

  it('surfaces live name/description/context_length when the gateway sends them', async () => {
    const server = await startCatalogServer([
      {
        id: 'm1',
        object: 'model',
        created: 1753920000,
        owned_by: 'gonka',
        name: 'Model One',
        description: 'first model',
        context_length: 400000,
      },
      // camelCase tolerance must be preserved alongside snake_case.
      { id: 'm2', object: 'model', created: 0, owned_by: 'gonka', contextLength: 240000 },
    ]);

    try {
      const r = await runModelsJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(0);

      const [first, second] = outModels(r.json);
      expect(first?.name).toBe('Model One');
      expect(first?.description).toBe('first model');
      expect(first?.contextLength).toBe(400000);
      expect(second?.contextLength).toBe(240000);

      const human = await runModelsHuman({ baseUrl: server.baseUrl, apiKey: 'k', verbose: true });
      expect(human.stdout).toContain('400000');
      expect(human.stdout).toContain('240000');
      expect(human.stdout).toContain('name: Model One');
      expect(human.stdout).toContain('description: first model');
    } finally {
      await server.close();
    }
  });

  it('treats null metadata as absent', async () => {
    const server = await startCatalogServer([
      {
        id: 'm1',
        object: 'model',
        created: 0,
        owned_by: 'gonka',
        name: null,
        description: null,
        context_length: null,
      },
    ]);

    try {
      const r = await runModelsJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(r.code).toBe(0);

      const [first] = outModels(r.json);
      expect(first?.id).toBe('m1');
      expect(first).not.toHaveProperty('contextLength');
      expect(first).not.toHaveProperty('name');
      expect(first).not.toHaveProperty('description');

      const human = await runModelsHuman({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(human.stdout).toMatch(/^m1\s+.*\bn\/a\b/m);
    } finally {
      await server.close();
    }
  });

  it('reports the first model in response order as the default', async () => {
    const server = await startCatalogServer([{ id: 'zzz' }, { id: 'aaa' }]);

    try {
      const r = await runModelsJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect((r.json as { defaultModel?: unknown }).defaultModel).toBe('zzz');
      expect(outModels(r.json).map((m) => m.id)).toEqual(['zzz', 'aaa']);

      const human = await runModelsHuman({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect(human.stdout).toContain('Default model: zzz');
    } finally {
      await server.close();
    }
  });

  it('follows the gateway when the response order changes', async () => {
    const server = await startCatalogServer([{ id: 'aaa' }, { id: 'zzz' }]);

    try {
      const r = await runModelsJson({ baseUrl: server.baseUrl, apiKey: 'k' });
      expect((r.json as { defaultModel?: unknown }).defaultModel).toBe('aaa');
    } finally {
      await server.close();
    }
  });
});
