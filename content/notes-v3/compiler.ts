import type { Module } from '@/lib/legacy/types';
import type { StudySource } from '@/content/notes-v2/types';
import type {
  NotesPriority,
  RichNoteNode,
  StudyBlockV3,
  StudyModuleContentV3,
} from '@/content/notes-v3/types';

type CompileOptions = {
  markdown: string;
  module: Module;
  sectionSourceIds: Readonly<Record<string, string[]>>;
  sources: StudySource[];
};

const heading = /^(#{2,4})\s+(.+?)\s*$/;
const orderedItem = /^\s*\d+[.)]\s+(.+)$/;
const bulletItem = /^\s*[-*]\s+(.+)$/;

function plainText(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function splitCells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const cells = splitCells(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseNodes(input: readonly string[]): RichNoteNode[] {
  const lines = [...input];
  const nodes: RichNoteNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();
    if (!trimmed || trimmed === '<details>' || trimmed === '</details>' || /^<summary>/.test(trimmed)) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(heading);
    if (headingMatch && headingMatch[1].length >= 3) {
      nodes.push({
        type: 'subheading',
        level: headingMatch[1].length === 3 ? 3 : 4,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const sequence: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        if (lines[index].trim()) sequence.push(lines[index].trim());
        index += 1;
      }
      index += 1;
      if (sequence.length) nodes.push({ type: 'sequence', lines: sequence });
      continue;
    }

    if (trimmed.startsWith('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const columns = splitCells(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const row = splitCells(lines[index]);
        if (row.length === columns.length) rows.push(row);
        index += 1;
      }
      if (rows.length) nodes.push({ type: 'table', columns, rows });
      continue;
    }

    const listMatch = trimmed.match(orderedItem) ?? trimmed.match(bulletItem);
    if (listMatch) {
      const ordered = orderedItem.test(trimmed);
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const match = ordered ? current.match(orderedItem) : current.match(bulletItem);
        if (!match) break;
        let item = match[1];
        index += 1;
        while (
          index < lines.length
          && lines[index].trim()
          && !heading.test(lines[index].trim())
          && !orderedItem.test(lines[index].trim())
          && !bulletItem.test(lines[index].trim())
          && !lines[index].trim().startsWith('|')
          && !/^```/.test(lines[index].trim())
        ) {
          item += ` ${lines[index].trim()}`;
          index += 1;
        }
        items.push(item);
      }
      nodes.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph: string[] = [trimmed];
    index += 1;
    while (
      index < lines.length
      && lines[index].trim()
      && !heading.test(lines[index].trim())
      && !orderedItem.test(lines[index].trim())
      && !bulletItem.test(lines[index].trim())
      && !lines[index].trim().startsWith('|')
      && !/^```/.test(lines[index].trim())
      && !/^<\/?details>|^<summary>/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    nodes.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return nodes;
}

function parseListItems(lines: readonly string[]): string[] {
  return parseNodes(lines)
    .flatMap((node) => node.type === 'list' ? node.items : [])
    .map(plainText)
    .filter(Boolean);
}

function parseFocusMap(lines: readonly string[]): StudyBlockV3 {
  const groups = new Map<NotesPriority, string[]>();
  let priority: NotesPriority | undefined;
  let groupLines: string[] = [];
  const flush = () => {
    if (priority) groups.set(priority, parseListItems(groupLines));
    groupLines = [];
  };
  for (const line of lines) {
    const match = line.trim().match(/^###\s+(.+)$/);
    if (match) {
      flush();
      const title = plainText(match[1]).toLowerCase();
      priority = title.startsWith('must') ? 'must' : title.startsWith('should') ? 'should' : 'useful';
      continue;
    }
    if (priority) groupLines.push(line);
  }
  flush();
  return {
    type: 'focus-map',
    groups: ([
      ['must', 'Must know'],
      ['should', 'Should know'],
      ['useful', 'Useful extension'],
    ] as const).map(([key, label]) => ({ priority: key, label, items: groups.get(key) ?? [] })),
  };
}
function parseDefinitions(lines: readonly string[]): StudyBlockV3 {
  const entries: Array<{ term: string; definition: string }> = [];
  for (const item of parseNodes(lines).flatMap((node) => node.type === 'list' ? node.items : [])) {
    const normalized = item.replace(/^\*\*/, '').replace(/\*\*/, '');
    const parts = normalized.split(/\s+(?:—|–|-|:)\s+|:\s+/u);
    if (parts.length >= 2) {
      entries.push({ term: plainText(parts.shift() ?? ''), definition: plainText(parts.join(': ')) });
    }
  }
  return { type: 'definition-list', entries };
}

function numberedItems(lines: readonly string[]): string[] {
  const items: string[] = [];
  let current = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (/^-{3,}$/.test(line)) break;
    const match = line.match(orderedItem);
    if (match) {
      if (current) items.push(current);
      current = match[1];
    } else if (current && line && !line.startsWith('<')) {
      current += ` ${line}`;
    }
  }
  if (current) items.push(current);
  return items.map(plainText);
}

function parseRecall(lines: readonly string[]): StudyBlockV3 {
  const revealIndex = lines.findIndex((line) => line.includes('<details>'));
  const questions = numberedItems(revealIndex >= 0 ? lines.slice(0, revealIndex) : lines);
  const answers = numberedItems(revealIndex >= 0 ? lines.slice(revealIndex + 1) : []);
  return { type: 'active-recall', title: 'Active recall checkpoint', questions, answers };
}

function blockForChunk(title: string, lines: readonly string[]): StudyBlockV3[] {
  const normalized = plainText(title).toLowerCase();
  if (normalized === 'what to focus on') return [parseFocusMap(lines)];
  if (normalized === 'key terms') return [parseDefinitions(lines)];
  if (normalized === 'one-minute summary') {
    const list = parseListItems(lines);
    const items = list.length ? list : parseNodes(lines).flatMap((node) => node.type === 'paragraph' ? [plainText(node.text)] : []);
    return [{ type: 'one-minute-summary', items }];
  }
  if (normalized === 'active recall checkpoint') return [parseRecall(lines)];

  const nodes = parseNodes(lines);
  if (!nodes.length) return [];
  if (/memory (hook|aid)/.test(normalized)) return [{ type: 'memory-hook', title, nodes }];
  if (/common (trap|misconception)/.test(normalized)) return [{ type: 'exam-trap', title, nodes }];
  if (/worked|workstation audit/.test(normalized)) return [{ type: 'worked-example', title, nodes }];
  if (/cause.?effect/.test(normalized)) {
    const steps = nodes.flatMap((node) => node.type === 'sequence' ? node.lines : []);
    if (steps.length >= 2) return [{ type: 'cause-effect-chain', title, steps }];
  }

  const blocks: StudyBlockV3[] = [{ type: 'rich-explanation', title, nodes }];
  for (const node of nodes) {
    if (node.type === 'sequence' && node.lines.length >= 2 && node.lines.some((line) => /→|->|--/.test(line))) {
      blocks.push({ type: 'cause-effect-chain', title: `${title}: cause and effect`, steps: node.lines });
    }
  }
  return blocks;
}

function chunksForSection(markdown: string): Array<{ title: string; lines: string[] }> {
  const lines = markdown.split('\n');
  const chunks: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | undefined;
  for (const line of lines) {
    const match = line.trim().match(/^##\s+(.+)$/)
      ?? line.trim().match(/^#\s+(?!\d+\.\s)(.+)$/);
    if (match) {
      if (current) chunks.push(current);
      current = { title: match[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function compileAuthoredNotesV3(options: CompileOptions): StudyModuleContentV3 {
  const normalized = options.markdown.replace(/\r\n?/g, '\n');
  const anchors = [...normalized.matchAll(/<a id="([^"]+)"><\/a>/g)];
  const legacySections = new Map(options.module.sections.map((section) => [section.id, section]));
  const sections = anchors.map((anchor, index) => {
    const id = anchor[1];
    const start = (anchor.index ?? 0) + anchor[0].length;
    const end = anchors[index + 1]?.index ?? normalized.length;
    const markdown = normalized.slice(start, end).trim();
    const title = markdown.match(/^#\s+\d+\.\s+(.+)$/m)?.[1]?.trim() ?? legacySections.get(id)?.title ?? id;
    const chunks = chunksForSection(markdown);
    const bigPicture = chunks.find((chunk) => plainText(chunk.title).toLowerCase() === 'big picture');
    const overviewNode = bigPicture ? parseNodes(bigPicture.lines).find((node) => node.type === 'paragraph') : undefined;
    const overview = overviewNode?.type === 'paragraph'
      ? plainText(overviewNode.text)
      : legacySections.get(id)?.summary ?? title;
    const sourceIds = options.sectionSourceIds[id] ?? [];
    return {
      id,
      title,
      overview,
      blocks: chunks.flatMap((chunk) => blockForChunk(chunk.title, chunk.lines)),
      figure: legacySections.get(id)?.image,
      sourceIds,
    };
  });

  return {
    schemaVersion: 3,
    moduleId: options.module.id,
    courseId: options.module.courseId,
    title: options.module.title,
    description: options.module.description,
    learningObjectives: options.module.objectives,
    sections,
    sources: options.sources,
  };
}
