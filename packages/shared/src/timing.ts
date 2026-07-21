export class Stopwatch {
  private startedAt: number;

  constructor() {
    this.startedAt = performance.now();
  }

  reset(): void {
    this.startedAt = performance.now();
  }

  elapsed(): number {
    return performance.now() - this.startedAt;
  }

  elapsedFormatted(): string {
    const ms = this.elapsed();
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms${label ? `: ${label}` : ''}`)), ms);
  });
  return Promise.race([promise, timeout]);
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
