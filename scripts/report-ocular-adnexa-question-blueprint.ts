import { ocularAdnexaCandidateBank } from '@/content/question-bank/opt376/ocular-adnexa/bank';
import { ocularAdnexaBlueprint } from '@/content/question-bank/opt376/ocular-adnexa/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';

const diagnostics = validateQuestionBlueprint(
  ocularAdnexaCandidateBank,
  ocularAdnexaBlueprint,
);
console.log(formatBlueprintReport(
  ocularAdnexaCandidateBank,
  ocularAdnexaBlueprint,
));
if (diagnostics.length > 0) console.error(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = diagnostics.length > 0 ? 1 : 0;
