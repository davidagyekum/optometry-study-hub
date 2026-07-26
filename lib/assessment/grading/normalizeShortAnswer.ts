export type ShortAnswerNormalization = {
  trim: boolean;
  caseInsensitive: boolean;
  collapseWhitespace: boolean;
  ignoreTerminalPunctuation: boolean;
};

export function normalizeShortAnswer(
  value: string,
  normalization: ShortAnswerNormalization,
): string {
  let normalized = value;
  if (normalization.trim) normalized = normalized.trim();
  if (normalization.collapseWhitespace) {
    normalized = normalized.replace(/\s+/gu, ' ');
  }
  if (normalization.caseInsensitive) normalized = normalized.toLocaleLowerCase('en');
  if (normalization.ignoreTerminalPunctuation) {
    normalized = normalized.replace(/\p{P}+$/gu, '');
  }
  return normalized;
}
