import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  AssessmentDraftResponse,
  PersistedResponse,
} from '@/lib/storage/schemas';

export type FormatQuestion<Format extends AssessmentQuestion['format']> =
  Extract<AssessmentQuestion, { format: Format }>;

export type FormatDraft<Format extends AssessmentDraftResponse['format']> =
  Extract<AssessmentDraftResponse, { format: Format }>;

export type FormatResponse<Format extends PersistedResponse['format']> =
  Extract<PersistedResponse, { format: Format }>;

export type RendererProps<Format extends AssessmentQuestion['format']> = {
  question: FormatQuestion<Format>;
  presentationOrder?: string[];
  draft?: FormatDraft<Format>;
  response?: FormatResponse<Format>;
  disabled?: boolean;
  descriptionId?: string;
  validationMessage?: string;
  onDraftChange: (draft: FormatDraft<Format>) => void;
  onClear: () => void;
};
