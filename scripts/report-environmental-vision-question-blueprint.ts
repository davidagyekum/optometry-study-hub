import { environmentalVisionCandidateBank } from '@/content/question-bank/opt508/environmental-vision/bank';
import { environmentalVisionBlueprint } from '@/content/question-bank/opt508/environmental-vision/blueprint';
import { formatBlueprintReport } from '@/lib/assessment/blueprint/reportBlueprint';
import { validateQuestionBlueprint } from '@/lib/assessment/blueprint/validateBlueprint';
import { formatDiagnostics } from '@/lib/assessment/diagnostics';

const diagnostics = validateQuestionBlueprint(
  environmentalVisionCandidateBank,
  environmentalVisionBlueprint,
);
console.log(formatBlueprintReport(
  environmentalVisionCandidateBank,
  environmentalVisionBlueprint,
));
if (diagnostics.length > 0) console.error(`\n${formatDiagnostics(diagnostics)}`);
process.exitCode = diagnostics.length > 0 ? 1 : 0;
