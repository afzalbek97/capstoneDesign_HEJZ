export interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
  success?: boolean;
  palign?: number;
}

export interface LyricsBlock {
  lines: string[];  // [line1, line2]
  start: number;
  end: number;
}

type ParseOptions = {
  includeSectionTags?: boolean;
};

export function parseAlignedWordsToBlocks(
  alignedWords: AlignedWord[],
  opts: ParseOptions = { includeSectionTags: false }
): { blocks: LyricsBlock[]; fullLyrics: string } {
  const lines: { text: string; start: number; end: number }[] = [];

  let currentText = '';
  let lineStart: number | null = null;
  let lastEnd: number | null = null;

  const flushLine = () => {
    const text = currentText.trim();
    if (text.length > 0 && lineStart != null && lastEnd != null) {
      const cleaned = opts.includeSectionTags ? text : text.replace(/\[(.*?)\]/g, '').trim();
      if (cleaned.length > 0) {
        lines.push({ text: cleaned, start: lineStart, end: lastEnd });
      }
    }
    currentText = '';
    lineStart = null;
    lastEnd = null;
  };

  for (const w of alignedWords) {
    const raw = w.word ?? '';
    const parts = raw.split(/\n/);

    for (let i = 0; i < parts.length; i++) {
      const piece = parts[i];

      if (currentText === '') lineStart = w.startS;
      currentText += piece;
      lastEnd = w.endS;

      if (i < parts.length - 1) {
        flushLine();
      } else {
      }

      if (i === parts.length - 1) currentText += ' ';
    }
  }
  flushLine();

  const blocks: LyricsBlock[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const l1 = lines[i];
    const l2 = lines[i + 1];
    if (l2) {
      blocks.push({
        lines: [l1.text, l2.text],
        start: l1.start,
        end: l2.end,
      });
    } else {
      blocks.push({
        lines: [l1.text, ' '],
        start: l1.start,
        end: l1.end,
      });
    }
  }

  const fullLyrics = lines.map(l => l.text).join('\n');

  return { blocks, fullLyrics };
}
