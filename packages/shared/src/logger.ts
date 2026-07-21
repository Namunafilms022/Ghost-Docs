const isDebug = process.env.GHOST_DEBUG === 'true' || process.env.GHOST_DEBUG === '1';

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function prefix(level: string, color: string): string {
  return `${colors.dim}${timestamp()}${colors.reset} ${color}[${level}]${colors.reset}`;
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (!isDebug) return;
    const extra = args.length ? ` ${args.map(a => JSON.stringify(a)).join(' ')}` : '';
    process.stderr.write(`${prefix('DEBUG', colors.dim)} ${message}${extra}\n`);
  },

  info: (message: string) => {
    process.stdout.write(`${prefix('INFO', colors.blue)} ${message}\n`);
  },

  success: (message: string) => {
    process.stdout.write(`${prefix('OK', colors.green)} ${message}\n`);
  },

  warn: (message: string) => {
    process.stderr.write(`${prefix('WARN', colors.yellow)} ${message}\n`);
  },

  error: (message: string, error?: Error) => {
    process.stderr.write(`${prefix('ERROR', colors.red)} ${message}\n`);
    if (error && isDebug) {
      process.stderr.write(`${colors.dim}  ${error.stack || error.message}${colors.reset}\n`);
    }
  },
};
