import { systemicPathologyCandidateBank } from '@/content/question-bank/systemic-pathology/systemic-pathology/bank';
import { systemicPathologyBlueprint } from '@/content/question-bank/systemic-pathology/systemic-pathology/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';

const diagnostics = validateQuestionBlueprint(
  systemicPathologyCandidateBank,
  systemicPathologyBlueprint,
);
console.log(formatBlueprintReport(
  systemicPathologyCandidateBank,
  systemicPathologyBlueprint,
));
if (diagnostics.length > 0) console.error(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = diagnostics.length > 0 ? 1 : 0;
