import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { humanVisualPerceptionBlueprint } from '@/content/question-bank/opt374/human-visual-perception/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';

const diagnostics = validateQuestionBlueprint(
  humanVisualPerceptionCandidateBank,
  humanVisualPerceptionBlueprint,
);
console.log(formatBlueprintReport(
  humanVisualPerceptionCandidateBank,
  humanVisualPerceptionBlueprint,
));
if (diagnostics.length > 0) console.error(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = diagnostics.length > 0 ? 1 : 0;
