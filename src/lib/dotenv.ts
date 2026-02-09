import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripQuotes(v: string): string {
  const s = v.trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Loads a local `.env` file (if present) into `process.env` without overriding
 * any variables already set in the environment.
 *
 * This is intentionally minimal (no expansions, no multiline values).
 */
export function loadDotEnvIfPresent(path = '.env'): void {
  const fullPath = resolve(process.cwd(), path);
  if (!existsSync(fullPath)) return;

  const text = readFileSync(fullPath, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;
    if (process.env[key] !== undefined) continue;

    const value = stripQuotes(line.slice(eq + 1));
    process.env[key] = value;
  }
}
