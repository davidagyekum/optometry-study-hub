'use client';

import { SafeNoteText } from '@/components/study/SafeNoteText';
import type { RichNoteNode, StudyBlockV3 } from '@/content/notes-v3/types';

function RichNodeRenderer({ node }: { node: RichNoteNode }) {
  switch (node.type) {
    case 'paragraph': {
      const qualification = node.text.startsWith('>');
      const text = qualification ? node.text.replace(/^>\s?|\s>\s?/g, ' ').trim() : node.text;
      return qualification
        ? <aside className="notes-v3-qualification"><SafeNoteText text={text} /></aside>
        : <p><SafeNoteText text={text} /></p>;
    }
    case 'subheading':
      return node.level === 3
        ? <h4><SafeNoteText text={node.text} /></h4>
        : <h5><SafeNoteText text={node.text} /></h5>;
    case 'list': {
      const List = node.ordered ? 'ol' : 'ul';
      return (
        <List>{node.items.map((item, index) => <li key={`${index}-${item}`}><SafeNoteText text={item} /></li>)}</List>
      );
    }
    case 'table':
      return (
        <div className="notes-table-wrap" tabIndex={0} role="region" aria-label="Scrollable study table">
          <table>
            <thead><tr>{node.columns.map((column) => <th key={column} scope="col"><SafeNoteText text={column} /></th>)}</tr></thead>
            <tbody>
              {node.rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join('|')}`}>
                  {row.map((cell, index) => index === 0
                    ? <th key={`${index}-${cell}`} scope="row"><SafeNoteText text={cell} /></th>
                    : <td key={`${index}-${cell}`}><SafeNoteText text={cell} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'sequence':
      return (
        <div className="notes-v3-sequence">
          {node.lines.map((line, index) => <div key={`${index}-${line}`}><SafeNoteText text={line} /></div>)}
        </div>
      );
  }
}

function RichNodes({ nodes }: { nodes: RichNoteNode[] }) {
  return <>{nodes.map((node, index) => <RichNodeRenderer key={`${node.type}-${index}`} node={node} />)}</>;
}

export function StudyBlockV3Renderer({ block }: { block: StudyBlockV3 }) {
  switch (block.type) {
    case 'focus-map':
      return (
        <section className="notes-v3-focus" aria-labelledby="notes-focus-title">
          <h3 id="notes-focus-title">What to focus on</h3>
          <div>
            {block.groups.map((group) => (
              <section key={group.priority} className={`focus-priority ${group.priority}`}>
                <h4><span aria-hidden="true">{group.priority === 'must' ? '1' : group.priority === 'should' ? '2' : '3'}</span>{group.label}</h4>
                <ul>{group.items.map((item) => <li key={item}><SafeNoteText text={item} /></li>)}</ul>
              </section>
            ))}
          </div>
        </section>
      );
    case 'rich-explanation':
      return <section className="notes-v3-block rich-explanation"><h3>{block.title}</h3><RichNodes nodes={block.nodes} /></section>;
    case 'cause-effect-chain':
      return (
        <section className="notes-v3-block cause-effect-chain">
          <h3>{block.title}</h3>
          <ol>{block.steps.map((step, index) => <li key={`${index}-${step}`}><SafeNoteText text={step} /></li>)}</ol>
        </section>
      );
    case 'memory-hook':
      return <aside className="notes-v3-block memory-hook"><h3>Memory hook · {block.title}</h3><RichNodes nodes={block.nodes} /></aside>;
    case 'exam-trap':
      return <aside className="notes-v3-block exam-trap"><h3>Exam trap · {block.title}</h3><RichNodes nodes={block.nodes} /></aside>;
    case 'worked-example':
      return <section className="notes-v3-block worked-example"><h3>{block.title}</h3><RichNodes nodes={block.nodes} /></section>;
    case 'active-recall':
      return (
        <section className="notes-v3-block active-recall">
          <h3>{block.title}</h3>
          <ol>{block.questions.map((question) => <li key={question}><SafeNoteText text={question} /></li>)}</ol>
          <details>
            <summary>Reveal answers</summary>
            <ol>{block.answers.map((answer, index) => <li key={`${index}-${answer}`}><SafeNoteText text={answer} /></li>)}</ol>
          </details>
        </section>
      );
    case 'one-minute-summary':
      return (
        <section className="notes-v3-block one-minute-summary">
          <h3>One-minute summary</h3>
          <ul>{block.items.map((item) => <li key={item}><SafeNoteText text={item} /></li>)}</ul>
        </section>
      );
    case 'definition-list':
      return (
        <section className="terms notes-v3-definitions">
          <h3>Key terms</h3>
          {block.entries.map((entry) => <div key={entry.term}><b>{entry.term}</b><span><SafeNoteText text={entry.definition} /></span></div>)}
        </section>
      );
  }
}
