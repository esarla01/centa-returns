import { CheckCircle, Pencil, X } from 'lucide-react';
import { type Actor, type Stage, canCompleteStage, canEditStage, isCurrentStage, isStageCompleted } from '@/lib/workflow';

interface StageActionsProps {
  stage: Stage;
  status: string;
  user: Actor;
  /** Buttons only work on the case the user has ticked. */
  isSelected: boolean;
  /** 'table' in the wide table, 'card' on the tablet cards (slightly smaller). */
  variant: 'table' | 'card';
  onEdit: () => void;
  onComplete: () => void;
}

/** The edit and complete buttons of one stage of one case. */
export default function StageActions({ stage, status, user, isSelected, variant, onEdit, onComplete }: StageActionsProps) {
  const mayEdit = canEditStage(user, status, stage);
  const mayComplete = canCompleteStage(user, status, stage);
  const completed = isStageCompleted(status, stage);
  const card = variant === 'card';
  const hover = card ? '100' : '50';

  const editTitle = !isSelected
    ? 'Önce vakayı seçin'
    : mayEdit
    ? `${stage.title} aşamasını düzenle`
    : 'Bu aşama henüz aktif değil';

  const completeTitle = !isSelected
    ? 'Önce vakayı seçin'
    : completed
    ? `${stage.title} tamamlandı`
    : mayComplete
    ? `${stage.title} aşamasını tamamla`
    : isCurrentStage(status, stage)
    ? 'Bu aşamayı tamamlama yetkiniz yok'
    : 'Bu aşama henüz aktif değil';

  const completeClass = completed
    ? `text-green-600 hover:text-green-800 ${hover === '100' ? 'hover:bg-green-100' : 'hover:bg-green-50'}`
    : mayComplete && isSelected
    ? `text-red-600 hover:text-red-800 ${hover === '100' ? 'hover:bg-red-100' : 'hover:bg-red-50'}`
    : 'text-gray-400 cursor-not-allowed';

  return (
    <div className={`flex items-center ${card ? 'space-x-1' : 'justify-center space-x-2'}`}>
      <button
        onClick={onEdit}
        disabled={!mayEdit || !isSelected}
        className={`transition-colors p-1 rounded ${
          mayEdit && isSelected
            ? `${stage.tone.edit} ${card ? stage.tone.editHoverCard : stage.tone.editHover}`
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title={editTitle}
      >
        <Pencil className={card ? 'h-3 w-3' : 'h-4 w-4'} />
      </button>
      <button
        onClick={onComplete}
        disabled={!mayComplete || !isSelected}
        className={`transition-colors p-1 rounded ${completeClass}`}
        title={completeTitle}
      >
        {completed ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </button>
    </div>
  );
}
