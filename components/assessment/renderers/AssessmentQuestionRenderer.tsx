import { ExtendedMatchingRenderer } from '@/components/assessment/renderers/ExtendedMatchingRenderer';
import { ImageHotspotRenderer } from '@/components/assessment/renderers/ImageHotspotRenderer';
import { ImageLabelRenderer } from '@/components/assessment/renderers/ImageLabelRenderer';
import { MatchingRenderer } from '@/components/assessment/renderers/MatchingRenderer';
import { MultipleResponseRenderer } from '@/components/assessment/renderers/MultipleResponseRenderer';
import { OpenResponseRenderer } from '@/components/assessment/renderers/OpenResponseRenderer';
import { OrderingRenderer } from '@/components/assessment/renderers/OrderingRenderer';
import { ShortAnswerRenderer } from '@/components/assessment/renderers/ShortAnswerRenderer';
import { SingleBestAnswerRenderer } from '@/components/assessment/renderers/SingleBestAnswerRenderer';
import type { AssessmentQuestion } from '@/lib/assessment/types';
import type {
  AssessmentDraftResponse,
  PersistedResponse,
} from '@/lib/storage/schemas';

type AssessmentQuestionRendererProps = {
  question: AssessmentQuestion;
  presentationOrder?: string[];
  draft?: AssessmentDraftResponse;
  response?: PersistedResponse;
  disabled?: boolean;
  descriptionId?: string;
  validationMessage?: string;
  onDraftChange: (draft: AssessmentDraftResponse) => void;
  onClear: () => void;
};

export function AssessmentQuestionRenderer({
  question,
  presentationOrder,
  draft,
  response,
  disabled,
  descriptionId,
  validationMessage,
  onDraftChange,
  onClear,
}: AssessmentQuestionRendererProps) {
  const shared = {
    presentationOrder,
    disabled,
    descriptionId,
    validationMessage,
    onClear,
  };
  switch (question.format) {
    case 'single_best_answer':
      return (
        <SingleBestAnswerRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'multiple_response':
      return (
        <MultipleResponseRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'ordering':
      return (
        <OrderingRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'matching':
      return (
        <MatchingRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'extended_matching':
      return (
        <ExtendedMatchingRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'image_hotspot':
      return (
        <ImageHotspotRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'image_label':
      return (
        <ImageLabelRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'short_answer':
      return (
        <ShortAnswerRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
    case 'open_response':
      return (
        <OpenResponseRenderer
          {...shared}
          question={question}
          draft={draft?.format === question.format ? draft : undefined}
          response={response?.format === question.format ? response : undefined}
          onDraftChange={onDraftChange}
        />
      );
  }
}
