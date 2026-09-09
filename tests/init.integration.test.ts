import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { init } from '../src/commands/init.js';

afterEach(() => {
  vi.restoreAllMocks();
});

async function writeTemplate(): Promise<{
  code: number;
  env: string;
  stdout: string;
  dir: string;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'gonkagate-init-'));
  let stdout = '';
  const stdoutSpy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stdout += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      return true;
    });

  try {
    const code = await init({ force: false, cwd: dir });
    const env = await readFile(join(dir, '.env'), 'utf8');
    return { code, env, stdout, dir };
  } finally {
    stdoutSpy.mockRestore();
  }
}

describe('init (integration)', () => {
  it('writes a .env template that leaves GONKAGATE_MODEL unset', async () => {
    const { code, env, dir } = await writeTemplate();

    try {
      expect(code).toBe(0);
      expect(env).toContain('# GONKAGATE_MODEL=');
      // No model id is baked into the template: nothing follows the `=`.
      expect(env).not.toMatch(/GONKAGATE_MODEL=\S/);
      // Uncommenting the line must not silently activate a model either.
      expect(env).not.toMatch(/^\s*GONKAGATE_MODEL=/m);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('points at the live catalog instead of naming a model', async () => {
    const { env, stdout, dir } = await writeTemplate();

    try {
      expect(env).toContain('gonkagate models');
      expect(stdout).toContain('gonkagate models');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('hardcodes no catalog metadata in the template', async () => {
    const { env, dir } = await writeTemplate();

    try {
      // The catalog (ids, display names, context windows) lives behind
      // `GET /v1/models`; `init` runs before an API key exists and must not
      // ship a stale copy of it.
      expect(env).not.toMatch(/deepseek|kimi|moonshot|minimax|qwen|llama/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
