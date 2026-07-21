const GHOST_DOCS_START = '<!-- GHOST-DOCS:START -->';
const GHOST_DOCS_END = '<!-- GHOST-DOCS:END -->';

export interface MarkerLocation {
  startIndex: number;
  endIndex: number;
  startTagLength: number;
  endTagLength: number;
  existingContent: string;
}

export class MarkerParser {
  findMarkers(content: string): MarkerLocation | null {
    const startIdx = content.indexOf(GHOST_DOCS_START);
    const endIdx = content.indexOf(GHOST_DOCS_END);

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return null;
    }

    const existingContent = content.slice(
      startIdx + GHOST_DOCS_START.length,
      endIdx,
    );

    return {
      startIndex: startIdx,
      endIndex: endIdx + GHOST_DOCS_END.length,
      startTagLength: GHOST_DOCS_START.length,
      endTagLength: GHOST_DOCS_END.length,
      existingContent: existingContent.trim(),
    };
  }

  wrapContent(content: string): string {
    return `${GHOST_DOCS_START}\n${content.trim()}\n${GHOST_DOCS_END}`;
  }

  hasMarkers(content: string): boolean {
    return content.includes(GHOST_DOCS_START) && content.includes(GHOST_DOCS_END);
  }

  updateWithinMarkers(currentContent: string, newGeneratedContent: string): string {
    const markers = this.findMarkers(currentContent);

    if (!markers) {
      const wrapped = this.wrapContent(newGeneratedContent);
      return `${currentContent.trimEnd()}\n\n${wrapped}\n`;
    }

    const before = currentContent.slice(0, markers.startIndex);
    const after = currentContent.slice(markers.endIndex);
    const wrapped = this.wrapContent(newGeneratedContent);

    return `${before}${wrapped}${after}`;
  }
}
