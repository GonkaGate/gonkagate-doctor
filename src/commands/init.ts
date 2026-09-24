import { access, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * `init` runs before an API key exists, so it cannot read the live catalog.
 * It therefore names no model at all: the template leaves `GONKAGATE_MODEL`
 * commented and unset and points at `gonkagate models`, which reads the model
 * ids and their metadata from `GET /v1/models` at run time.
 */
export type InitArgs = {
  force: boolean;
  /** Directory to write `.env` into (defaults to the current working directory). */
  cwd?: string;
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function init(args: InitArgs): Promise<number> {
  const path = args.cwd ? join(args.cwd, '.env') : '.env';
  if (!args.force && (await fileExists(path))) {
    process.stdout.write('.env already exists (use --force to overwrite)\n');
    return 0;
  }

  const lines: string[] = [];
  lines.push('# GonkaGate CLI (.env)');
  lines.push('# Base URL is fixed to https://api.gonkagate.com/v1');
  lines.push('');
  lines.push('# API key (never commit secrets)');
  lines.push('# GONKAGATE_API_KEY=gp-REDACTED');
  lines.push('');
  lines.push('# Default model (optional)');
  lines.push('# Model ids are not fixed here: run `gonkagate models` to list the live');
  lines.push('# catalog with pricing. The first model it lists is the default.');
  lines.push('# GONKAGATE_MODEL=');
  lines.push('');
  lines.push('# Usage:');
  lines.push('#   gonkagate models');
  lines.push('#   gonkagate doctor --model $GONKAGATE_MODEL');
  lines.push('#   gonkagate pricing --model $GONKAGATE_MODEL');
  lines.push('');

  await writeFile(path, lines.join('\n'), 'utf8');

  process.stdout.write(`Created ${path}\n`);
  process.stdout.write('Next:\n');
  process.stdout.write('  - set GONKAGATE_API_KEY in .env\n');
  process.stdout.write(
    '  - run: gonkagate models   (lists the live catalog; first entry is default)\n',
  );
  process.stdout.write('  - run: gonkagate doctor --model <id>\n');

  return 0;
}
