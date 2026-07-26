import { aqueousVitreousCandidateBank } from '@/content/question-bank/opt376/aqueous-vitreous/bank';
import { aqueousVitreousBlueprint } from '@/content/question-bank/opt376/aqueous-vitreous/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';
const diagnostics = validateQuestionBlueprint(aqueousVitreousCandidateBank, aqueousVitreousBlueprint);
console.log(formatBlueprintReport(aqueousVitreousCandidateBank, aqueousVitreousBlueprint));
if (diagnostics.length) console.error(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = diagnostics.length ? 1 : 0;
