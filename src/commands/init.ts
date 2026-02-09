import { access, writeFile } from 'node:fs/promises';

export type InitArgs = {
  force: boolean;
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
  const path = '.env';
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
  lines.push('# GONKAGATE_MODEL=llama-3.1-70b');
  lines.push('');
  lines.push('# Usage:');
  lines.push('#   gonkagate doctor --model $GONKAGATE_MODEL');
  lines.push('#   gonkagate models');
  lines.push('#   gonkagate pricing --model $GONKAGATE_MODEL');
  lines.push('');

  await writeFile(path, lines.join('\n'), 'utf8');

  process.stdout.write(`Created ${path}\n`);
  process.stdout.write('Next:\n');
  process.stdout.write('  - set GONKAGATE_API_KEY in .env\n');
  process.stdout.write('  - run: gonkagate doctor --model <id>\n');

  return 0;
}
