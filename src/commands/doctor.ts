import { normalizeBaseUrl } from '../lib/url.js';

export type DoctorArgs = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
  json: boolean;
  verbose: boolean;
};

export function doctor(args: DoctorArgs): number {
  const normalized = normalizeBaseUrl(args.baseUrl);
  if (!normalized.ok) {
    if (args.json) {
      process.stdout.write(
        JSON.stringify(
          {
            ok: false,
            error: {
              code: 'INVALID_BASE_URL',
              message: normalized.error,
            },
          },
          null,
          2,
        ) + '\n',
      );
    } else {
      process.stderr.write(`Invalid base URL: ${normalized.error}\n`);
      if (normalized.suggestedBaseUrl) {
        process.stderr.write(`Did you mean: ${normalized.suggestedBaseUrl}\n`);
      }
    }

    return 2;
  }

  // Placeholder: real HTTP checks will be added next.
  if (args.json) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: false,
          baseUrl: normalized.baseUrl,
          checks: [],
          note: 'doctor checks not implemented yet',
        },
        null,
        2,
      ) + '\n',
    );
  } else {
    process.stdout.write('GonkaGate Doctor\n');
    process.stdout.write(`Base URL: ${normalized.baseUrl}\n\n`);
    process.stdout.write('[SKIP] Connectivity checks not implemented yet\n');
  }

  return 13;
}
