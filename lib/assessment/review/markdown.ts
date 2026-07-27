export function safeMarkdownJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  const longestBacktickRun = Math.max(
    0,
    ...Array.from(json.matchAll(/`+/g), (match) => match[0].length),
  );
  const fence = '`'.repeat(Math.max(3, longestBacktickRun + 1));
  return `${fence}json\n${json}\n${fence}`;
}
