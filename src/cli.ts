import { Command } from 'commander';

import { loadDotEnvIfPresent } from './lib/dotenv.js';
import { doctor } from './commands/doctor.js';
import { init } from './commands/init.js';
import { models } from './commands/models.js';
import { pricing } from './commands/pricing.js';
import { whoami } from './commands/whoami.js';
import { completion } from './commands/completion.js';

loadDotEnvIfPresent();

type DoctorCliOptions = {
  apiKey?: string;
  model?: string;
  timeout: string;
  json?: boolean;
  verbose?: boolean;
  smoke?: boolean;
};

const program = new Command();

program.name('gonkagate').description('GonkaGate CLI');

program
  .command('doctor')
  .description('Run connectivity/model/pricing diagnostics for GonkaGate OpenAI-compatible API')
  .option('--api-key <key>', 'API key', process.env.GONKAGATE_API_KEY)
  .option('--model <id>', 'Model id', process.env.GONKAGATE_MODEL)
  .option('--timeout <ms>', 'Timeout in milliseconds', '10000')
  .option('--smoke', 'Send a minimal real chat completion request (max_tokens=1)')
  .option('--json', 'Output machine-readable JSON')
  .option('--verbose', 'Verbose diagnostics')
  .action(async (opts: DoctorCliOptions) => {
    const code = await doctor({
      apiKey: opts.apiKey,
      model: opts.model,
      timeoutMs: Number(opts.timeout),
      json: Boolean(opts.json),
      verbose: Boolean(opts.verbose),
      smoke: Boolean(opts.smoke),
    });

    process.exitCode = code;
  });

type CommonCliOptions = {
  apiKey?: string;
  timeout: string;
  json?: boolean;
  verbose?: boolean;
};

program
  .command('models')
  .description('List available models and pricing')
  .option('--api-key <key>', 'API key', process.env.GONKAGATE_API_KEY)
  .option('--timeout <ms>', 'Timeout in milliseconds', '10000')
  .option('--json', 'Output machine-readable JSON')
  .option('--verbose', 'Verbose diagnostics')
  .action(async (opts: CommonCliOptions) => {
    const code = await models({
      apiKey: opts.apiKey,
      timeoutMs: Number(opts.timeout),
      json: Boolean(opts.json),
      verbose: Boolean(opts.verbose),
    });
    process.exitCode = code;
  });

type PricingCliOptions = {
  model?: string;
  timeout: string;
  json?: boolean;
};

program
  .command('pricing')
  .description('Print pricing breakdown for a model')
  .requiredOption('--model <id>', 'Model id')
  .option('--timeout <ms>', 'Timeout in milliseconds', '10000')
  .option('--json', 'Output machine-readable JSON')
  .action(async (opts: PricingCliOptions) => {
    const code = await pricing({
      model: opts.model,
      timeoutMs: Number(opts.timeout),
      json: Boolean(opts.json),
    });
    process.exitCode = code;
  });

program
  .command('whoami')
  .description('Validate API key and show masked account info')
  .option('--api-key <key>', 'API key', process.env.GONKAGATE_API_KEY)
  .option('--timeout <ms>', 'Timeout in milliseconds', '10000')
  .option('--json', 'Output machine-readable JSON')
  .option('--verbose', 'Verbose diagnostics')
  .action(async (opts: CommonCliOptions) => {
    const code = await whoami({
      apiKey: opts.apiKey,
      timeoutMs: Number(opts.timeout),
      json: Boolean(opts.json),
      verbose: Boolean(opts.verbose),
    });
    process.exitCode = code;
  });

type InitCliOptions = {
  force?: boolean;
};

program
  .command('init')
  .description('Create a local .env template for GonkaGate CLI')
  .option('--force', 'Overwrite existing .env')
  .action(async (opts: InitCliOptions) => {
    const code = await init({ force: Boolean(opts.force) });
    process.exitCode = code;
  });

type CompletionCliOptions = { shell?: string };

program
  .command('completion')
  .description('Print shell completion script')
  .option('--shell <name>', 'Shell (bash|zsh|fish)', 'bash')
  .action((opts: CompletionCliOptions) => {
    const code = completion({ shell: opts.shell });
    process.exitCode = code;
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
