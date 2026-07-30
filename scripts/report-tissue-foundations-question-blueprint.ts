import { tissueFoundationsCandidateBank } from '@/content/question-bank/opt376/tissue-foundations/bank';
import { tissueFoundationsBlueprint } from '@/content/question-bank/opt376/tissue-foundations/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';

const diagnostics = validateQuestionBlueprint(
  tissueFoundationsCandidateBank,
  tissueFoundationsBlueprint,
);
console.log(formatBlueprintReport(
  tissueFoundationsCandidateBank,
  tissueFoundationsBlueprint,
));
if (diagnostics.length > 0) {
  console.error(`\n${formatDiagnostics(diagnostics)}`);
}
process.exitCode = diagnostics.length > 0 ? 1 : 0;
