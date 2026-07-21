import type { ChangedFile, ChangeAnalysis } from '@ghost-docs/types';

export class ChangeAnalyzer {
  analyze(files: ChangedFile[]): ChangeAnalysis {
    const sorted = [...files].sort(
      (a, b) => b.additions + b.deletions - (a.additions + a.deletions),
    );

    const summaryParts: string[] = [];
    const added = files.filter((f) => f.status === 'added');
    const modified = files.filter((f) => f.status === 'modified');
    const deleted = files.filter((f) => f.status === 'deleted');

    if (added.length > 0) summaryParts.push(`${added.length} added`);
    if (modified.length > 0) summaryParts.push(`${modified.length} modified`);
    if (deleted.length > 0) summaryParts.push(`${deleted.length} deleted`);

    const totalChanges = files.reduce((s, f) => s + f.additions + f.deletions, 0);
    summaryParts.push(`${totalChanges} lines changed`);

    const hasSourceChanges = files.some((f) =>
      /\.(ts|js|tsx|jsx|py|rs|go|java|rb|php|c|cpp|cs|swift|kt)$/i.test(f.path),
    );
    const hasApiChanges = files.some(
      (f) =>
        /\/api\/|router|route|endpoint|controller/i.test(f.path) &&
        /\.(ts|js|py|rs|go)$/i.test(f.path),
    );
    const hasConfigChanges = files.some(
      (f) =>
        /config|\.env|\.json|\.ya?ml|\.toml/i.test(f.path) &&
        !f.path.includes('node_modules'),
    );
    const hasDepChanges = files.some(
      (f) =>
        /package\.json|Cargo\.toml|go\.mod|requirements\.txt|pyproject\.toml|Gemfile/i.test(
          f.path,
        ),
    );
    const hasBreaking = hasApiChanges || hasDepChanges;

    return {
      files: sorted,
      summary: summaryParts.join(', '),
      hasBreaking,
      hasApiChanges,
      hasConfigChanges,
      hasDepChanges,
      hasSourceChanges,
    };
  }
}
