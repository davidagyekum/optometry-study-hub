import { Fragment, type ReactNode } from 'react';

const inlineToken = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export function SafeNoteText({ text }: { text: string }) {
  const parts = text.split(inlineToken).filter(Boolean);
  return parts.map((part, index): ReactNode => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${index}-${part}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${index}-${part}`}>{part.slice(1, -1)}</code>;
    }
    return <Fragment key={`${index}-${part}`}>{part}</Fragment>;
  });
}
