export type ExitCodeInputs = {
  invalidArgs?: boolean;
  baseUrlUnreachable?: boolean;
  authError?: boolean;
  modelNotFound?: boolean;
  pricingError?: boolean;
};

// PRD exit codes:
// 0  - all checks passed
// 2  - invalid args / invalid URL
// 10 - base_url unreachable
// 11 - auth error (401)
// 12 - model not found
// 13 - pricing endpoint unavailable/invalid
export function determineExitCode(input: ExitCodeInputs): number {
  if (input.invalidArgs) return 2;
  if (input.baseUrlUnreachable) return 10;
  if (input.authError) return 11;
  if (input.modelNotFound) return 12;
  if (input.pricingError) return 13;
  return 0;
}
