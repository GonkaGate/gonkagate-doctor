type Shell = 'bash' | 'zsh' | 'fish';

function writeJsonValue(v: unknown): void {
  process.stdout.write(JSON.stringify(v, null, 2) + '\n');
}

function bashScript(): string {
  // Minimal completion: commands + flags (no value completion).
  const lines = [
    '# bash completion for gonkagate',
    '_gonkagate_completions() {',
    '  local cur prev cmd',
    '  COMPREPLY=()',
    '  cur="${COMP_WORDS[COMP_CWORD]}"',
    '  prev="${COMP_WORDS[COMP_CWORD-1]}"',
    '  cmd="${COMP_WORDS[1]}"',
    '',
    '  if [[ ${COMP_CWORD} -eq 1 ]]; then',
    '    COMPREPLY=( $(compgen -W "doctor models pricing whoami init completion" -- "${cur}") )',
    '    return 0',
    '  fi',
    '',
    '  local opts=""',
    '  case "${cmd}" in',
    '    doctor)',
    '      opts="--api-key --model --timeout --smoke --json --verbose --help -h"',
    '      ;;',
    '    models)',
    '      opts="--api-key --timeout --json --verbose --help -h"',
    '      ;;',
    '    pricing)',
    '      opts="--model --timeout --json --help -h"',
    '      ;;',
    '    whoami)',
    '      opts="--api-key --timeout --json --verbose --help -h"',
    '      ;;',
    '    init)',
    '      opts="--force --help -h"',
    '      ;;',
    '    completion)',
    '      opts="--shell --help -h"',
    '      ;;',
    '  esac',
    '',
    '  if [[ "${cur}" == -* ]]; then',
    '    COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )',
    '    return 0',
    '  fi',
    '}',
    'complete -F _gonkagate_completions gonkagate',
    '',
  ];
  return lines.join('\n');
}

function zshScript(): string {
  const lines = [
    '#compdef gonkagate',
    '',
    '_gonkagate() {',
    '  local -a commands',
    '  commands=(',
    "    'doctor:Run diagnostics'",
    "    'models:List models and pricing'",
    "    'pricing:Show pricing for a model'",
    "    'whoami:Validate API key'",
    "    'init:Create a local .env template'",
    "    'completion:Print shell completion script'",
    '  )',
    '',
    '  if (( CURRENT == 2 )); then',
    "    _describe -t commands 'gonkagate command' commands",
    '    return',
    '  fi',
    '',
    '  local cmd="${words[2]}"',
    '  case "${cmd}" in',
    '    doctor)',
    '      _arguments \\',
    "        '--api-key[API key]' \\",
    "        '--model[Model id]' \\",
    "        '--timeout[Timeout in ms]:ms:' \\",
    "        '--smoke[Send a minimal real request (max_tokens=1)]' \\",
    "        '--json[JSON output]' \\",
    "        '--verbose[Verbose diagnostics]'",
    '      ;;',
    '    models)',
    '      _arguments \\',
    "        '--api-key[API key]' \\",
    "        '--timeout[Timeout in ms]:ms:' \\",
    "        '--json[JSON output]' \\",
    "        '--verbose[Verbose diagnostics]'",
    '      ;;',
    '    pricing)',
    '      _arguments \\',
    "        '--model[Model id]' \\",
    "        '--timeout[Timeout in ms]:ms:' \\",
    "        '--json[JSON output]'",
    '      ;;',
    '    whoami)',
    '      _arguments \\',
    "        '--api-key[API key]' \\",
    "        '--timeout[Timeout in ms]:ms:' \\",
    "        '--json[JSON output]' \\",
    "        '--verbose[Verbose diagnostics]'",
    '      ;;',
    '    init)',
    '      _arguments \\',
    "        '--force[Overwrite existing .env]'",
    '      ;;',
    '    completion)',
    '      _arguments \\',
    "        '--shell[Shell]:shell:(bash zsh fish)'",
    '      ;;',
    '  esac',
    '}',
    '',
    '_gonkagate "$@"',
    '',
  ];
  return lines.join('\n');
}

function fishScript(): string {
  const lines = [
    '# fish completion for gonkagate',
    '',
    'set -l commands doctor models pricing whoami init completion',
    '',
    'complete -c gonkagate -f -n "not __fish_seen_subcommand_from $commands" -a "$commands"',
    '',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from doctor" -l api-key -d "API key"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from doctor" -l model -d "Model id"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from doctor" -l timeout -d "Timeout in ms"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from doctor" -l smoke -d "Minimal real request (max_tokens=1)"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from doctor" -l json -d "JSON output"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from doctor" -l verbose -d "Verbose diagnostics"',
    '',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from models" -l api-key -d "API key"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from models" -l timeout -d "Timeout in ms"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from models" -l json -d "JSON output"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from models" -l verbose -d "Verbose diagnostics"',
    '',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from pricing" -l model -d "Model id"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from pricing" -l timeout -d "Timeout in ms"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from pricing" -l json -d "JSON output"',
    '',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from whoami" -l api-key -d "API key"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from whoami" -l timeout -d "Timeout in ms"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from whoami" -l json -d "JSON output"',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from whoami" -l verbose -d "Verbose diagnostics"',
    '',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from init" -l force -d "Overwrite existing .env"',
    '',
    'complete -c gonkagate -f -n "__fish_seen_subcommand_from completion" -l shell -d "Shell"',
    '',
  ];
  return lines.join('\n');
}

function normalizeShell(input: string | undefined): Shell | undefined {
  const v = (input ?? '').trim().toLowerCase();
  if (v === 'bash' || v === 'zsh' || v === 'fish') return v;
  return undefined;
}

export type CompletionArgs = { shell?: string; json?: boolean };

export function completion(args: CompletionArgs): number {
  const shell = normalizeShell(args.shell) ?? 'bash';

  if (args.shell && !normalizeShell(args.shell)) {
    if (args.json) {
      writeJsonValue({
        ok: false,
        error: { code: 'INVALID_SHELL', message: 'shell must be one of: bash, zsh, fish' },
      });
    } else {
      process.stderr.write('Invalid --shell. Use one of: bash, zsh, fish.\n');
    }
    return 2;
  }

  const script = shell === 'bash' ? bashScript() : shell === 'zsh' ? zshScript() : fishScript();
  process.stdout.write(script);
  return 0;
}
