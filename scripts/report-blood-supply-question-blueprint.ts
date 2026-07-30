import { bloodSupplyCandidateBank } from '@/content/question-bank/opt376/blood-supply/bank';
import { bloodSupplyBlueprint } from '@/content/question-bank/opt376/blood-supply/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';

const diagnostics = validateQuestionBlueprint(
  bloodSupplyCandidateBank,
  bloodSupplyBlueprint,
);
console.log(formatBlueprintReport(
  bloodSupplyCandidateBank,
  bloodSupplyBlueprint,
));
if (diagnostics.length > 0) console.error(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = diagnostics.length > 0 ? 1 : 0;
