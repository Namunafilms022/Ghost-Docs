import type { DocumentationPatch, SyncResult } from '@ghost-docs/types';

export class DiffRenderer {
  render(result: SyncResult): string {
    const lines: string[] = [];

    lines.push('# Documentation Sync Preview');
    lines.push('');
    lines.push(`**Summary:** ${result.analysis.summary}`);
    lines.push(`**Confidence:** ${(result.confidence * 100).toFixed(0)}%`);
    lines.push('');
    lines.push('---');
    lines.push('');

    if (result.impacts.length === 0) {
      lines.push('No documentation changes needed.');
      return lines.join('\n');
    }

    for (const impact of result.impacts) {
      lines.push(`## ${impact.docType}`);
      lines.push('');
      lines.push(`**File:** \`${impact.filePath}\``);
      lines.push(`**Action:** ${impact.suggestedAction}`);
      lines.push(`**Reason:** ${impact.reason}`);
      lines.push(`**Confidence:** ${(impact.confidence * 100).toFixed(0)}%`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');

    for (const patch of result.patches) {
      lines.push(`## \`${patch.filePath}\``);
      lines.push('');
      if (patch.additions > 0 || patch.deletions > 0) {
        lines.push(`+${patch.additions} / -${patch.deletions} lines`);
        lines.push('');
        lines.push('```diff');
        const diff = this.computeDiff(patch.originalContent, patch.patchedContent);
        lines.push(diff);
        lines.push('```');
        lines.push('');
      } else {
        lines.push('No changes.');
        lines.push('');
      }
    }

    if (result.pullRequest) {
      lines.push('---');
      lines.push('');
      lines.push('## Pull Request');
      lines.push('');
      lines.push(`**Title:** ${result.pullRequest.title}`);
      lines.push(`**Branch:** ${result.pullRequest.branch}`);
      lines.push(`**Body:**`);
      lines.push(result.pullRequest.body);
      lines.push('');
    }

    return lines.join('\n');
  }

  private computeDiff(original: string, patched: string): string {
    const origLines = original.split('\n');
    const patchLines = patched.split('\n');
    const result: string[] = [];

    const maxLen = Math.max(origLines.length, patchLines.length);
    for (let i = 0; i < maxLen; i++) {
      const orig = origLines[i] ?? '';
      const patchedLine = patchLines[i] ?? '';
      if (orig !== patchedLine) {
        if (i < origLines.length) result.push(`- ${orig}`);
        if (i < patchLines.length) result.push(`+ ${patchedLine}`);
      } else {
        if (result.length < 50 || i > maxLen - 10) {
          result.push(`  ${orig}`);
        } else if (result[result.length - 1] !== '...') {
          result.push('...');
        }
      }
    }

    return result.join('\n').substring(0, 3000);
  }
}
