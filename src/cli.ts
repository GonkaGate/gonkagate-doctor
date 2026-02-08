import { Command } from 'commander';

import { doctor } from './commands/doctor.js';

type DoctorCliOptions = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeout: string;
  json?: boolean;
  verbose?: boolean;
};

const program = new Command();

program.name('gonkagate').description('GonkaGate CLI (MVP: gonkagate doctor)');

program
  .command('doctor')
  .description('Run connectivity/model/pricing diagnostics for GonkaGate OpenAI-compatible API')
  .option('--base-url <url>', 'Base URL (should end with /v1)', process.env.GONKAGATE_BASE_URL)
  .option('--api-key <key>', 'API key', process.env.GONKAGATE_API_KEY)
  .option('--model <id>', 'Model id', process.env.GONKAGATE_MODEL)
  .option('--timeout <ms>', 'Timeout in milliseconds', '10000')
  .option('--json', 'Output machine-readable JSON')
  .option('--verbose', 'Verbose diagnostics')
  .action((opts: DoctorCliOptions) => {
    const code = doctor({
      baseUrl: opts.baseUrl,
      apiKey: opts.apiKey,
      model: opts.model,
      timeoutMs: Number(opts.timeout),
      json: Boolean(opts.json),
      verbose: Boolean(opts.verbose),
    });

    process.exitCode = code;
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
