import { autonomicPharmacologyCandidateBank } from '@/content/question-bank/pharmacology/autonomic-pharmacology/bank';
import { autonomicPharmacologyBlueprint } from '@/content/question-bank/pharmacology/autonomic-pharmacology/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';

const diagnostics = validateQuestionBlueprint(
  autonomicPharmacologyCandidateBank,
  autonomicPharmacologyBlueprint,
);
console.log(formatBlueprintReport(
  autonomicPharmacologyCandidateBank,
  autonomicPharmacologyBlueprint,
));
if (diagnostics.length > 0) console.error(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = diagnostics.length > 0 ? 1 : 0;
