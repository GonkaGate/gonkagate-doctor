import type { EstimatedCostPer1M } from './pricing.js';

export type DoctorCheckName = 'health' | 'models' | 'chatCompletions' | 'modelExists' | 'pricing';

export type DoctorCheck = {
  name: DoctorCheckName;
  ok: boolean;
  status?: number;
  ms?: number;
  skipped?: boolean;
  hint?: string;
  requestId?: string;
  model?: string;
  suggestions?: string[];
};

export type DoctorJsonOutput = {
  ok: boolean;
  baseUrl?: string;
  checks?: DoctorCheck[];
  estimatedCostPer1M?: EstimatedCostPer1M;
  warnings?: string[];
  error?: { code: string; message: string };
};

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return '';
  return `${ms}ms`;
}

function padRight(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function formatMoney6(n: number): string {
  return `$${n.toFixed(6)}`;
}

function statusLabel(check: DoctorCheck): 'OK' | 'FAIL' | 'SKIP' {
  if (check.skipped) return 'SKIP';
  return check.ok ? 'OK' : 'FAIL';
}

function displayCheckName(name: DoctorCheckName): string {
  switch (name) {
    case 'health':
      return '/health';
    case 'models':
      return '/v1/models';
    case 'chatCompletions':
      return '/v1/chat/completions';
    case 'modelExists':
      return 'model';
    case 'pricing':
      return 'pricing';
  }
}

export function writeJson(out: DoctorJsonOutput): void {
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

export function writeHuman(args: {
  baseUrl: string;
  warnings: string[];
  checks: DoctorCheck[];
  estimated?: EstimatedCostPer1M;
  nextHints: string[];
  verbose: boolean;
}): void {
  process.stdout.write('GonkaGate Doctor\n');
  process.stdout.write(`Base URL: ${args.baseUrl}\n`);

  if (args.warnings.length > 0) {
    process.stdout.write('\nWarnings:\n');
    for (const w of args.warnings) process.stdout.write(`  - ${w}\n`);
  }

  process.stdout.write('\n');

  const models = args.checks.find((c) => c.name === 'models');
  if (models) {
    const connectivityOk = models.status === 200 || models.status === 401;
    const label: DoctorCheck = { name: 'models', ok: connectivityOk, skipped: false };
    const connMs = formatMs(models.ms);
    const hint = !connectivityOk && models.hint ? ` - ${models.hint}` : '';
    process.stdout.write(
      `[${padRight(statusLabel(label), 4)}] ${padRight('Connectivity', 14)} ${connMs}${hint}`.trimEnd() +
        '\n\n',
    );
  }

  for (const check of args.checks) {
    const label = statusLabel(check);
    const name = displayCheckName(check.name);
    const status = check.status !== undefined ? `(${check.status})` : '';
    const ms = formatMs(check.ms);
    const details = [status, ms].filter(Boolean).join(' ').trim();

    const hint = check.hint ? ` - ${check.hint}` : '';
    process.stdout.write(
      `[${padRight(label, 4)}] ${padRight(name, 14)} ${details}${hint}`.trimEnd() + '\n',
    );

    if (args.verbose && check.requestId) {
      process.stdout.write(`         requestId: ${check.requestId}\n`);
    }

    if (
      check.name === 'modelExists' &&
      !check.ok &&
      check.suggestions &&
      check.suggestions.length > 0
    ) {
      process.stdout.write(`         suggestions: ${check.suggestions.join(', ')}\n`);
    }
  }

  if (args.estimated) {
    const feePct = Math.round(args.estimated.usageFeeRate * 100);
    process.stdout.write('\n');
    process.stdout.write(`Estimated cost per 1M tokens (USD) - ${args.estimated.model}\n`);
    process.stdout.write(`  network:   ${formatMoney6(args.estimated.network)}\n`);
    process.stdout.write(`  fee (${feePct}%): ${formatMoney6(args.estimated.platformFee)}\n`);
    process.stdout.write(`  total:     ${formatMoney6(args.estimated.total)}\n`);
    if (args.estimated.updatedAt) {
      process.stdout.write(`  updatedAt: ${args.estimated.updatedAt}\n`);
    }
    process.stdout.write('  note: pricing is estimated and subject to change\n');
  }

  if (args.nextHints.length > 0) {
    process.stdout.write('\nNext:\n');
    for (const h of args.nextHints) process.stdout.write(`  - ${h}\n`);
  }
}
