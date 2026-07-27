export function largestRemainderAllocation(
  source: Readonly<Record<string, number>>,
  targetTotal: number,
): Record<string, number> {
  const sourceTotal = Object.values(source).reduce((sum, value) => sum + value, 0);
  if (sourceTotal <= 0 || targetTotal < 0) return {};
  const rows = Object.entries(source).map(([id, value], index) => {
    const exact = value * targetTotal / sourceTotal;
    return { id, index, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = targetTotal - rows.reduce((sum, row) => sum + row.floor, 0);
  rows
    .slice()
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index)
    .forEach((row) => {
      if (remaining > 0) {
        rows[row.index].floor += 1;
        remaining -= 1;
      }
    });
  return Object.fromEntries(rows.map((row) => [row.id, row.floor]));
}

export function countBy<T>(
  values: readonly T[],
  key: (value: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  values.forEach((value) => {
    const id = key(value);
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}
