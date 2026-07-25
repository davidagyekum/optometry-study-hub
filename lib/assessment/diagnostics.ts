export type DiagnosticSeverity = 'error' | 'warning';

export type Diagnostic = {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  questionId?: string;
  path?: string;
};

export type DiagnosticSummary = {
  errors: number;
  warnings: number;
};

export function summarizeDiagnostics(diagnostics: Diagnostic[]): DiagnosticSummary {
  return diagnostics.reduce(
    (summary, diagnostic) => {
      summary[diagnostic.severity === 'error' ? 'errors' : 'warnings'] += 1;
      return summary;
    },
    { errors: 0, warnings: 0 },
  );
}

export function formatDiagnostics(diagnostics: Diagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      const subject = diagnostic.questionId ? ` [${diagnostic.questionId}]` : '';
      const path = diagnostic.path ? ` ${diagnostic.path}` : '';
      return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}${subject}${path}: ${diagnostic.message}`;
    })
    .join('\n');
}
