'use client';

import { useState, type ComponentType } from 'react';
import { FullReturnCase } from '@/lib/types';
import { type Stage, type StageKey, stageByKey } from '@/lib/workflow';
import StageCompletionModal from './StageCompletionModal';
import TeslimAlindiModal from './TeslimAlindiModal';
import TeknikIncelemeModal from './TeknikIncelemeModal';
import OdemeTahsilatiModal from './OdemeTahsilatiModal';
import KargoyaVerildiModal from './KargoyaVerildiModal';
import TamamlandiModal from './TamamlandiModal';
import ViewReturnCaseModal from './ViewReturnCaseModal';
import EmailCustomerModal from './EmailCustomerModal';

type StageFormProps = { returnCase: FullReturnCase; onClose: () => void; onSuccess: () => void };

/** The form that edits each stage's fields. */
const STAGE_FORMS: Record<StageKey, ComponentType<StageFormProps>> = {
  teslim_alindi: TeslimAlindiModal,
  teknik_inceleme: TeknikIncelemeModal,
  odeme_tahsilati: OdemeTahsilatiModal,
  kargoya_verildi: KargoyaVerildiModal,
  tamamlandi: TamamlandiModal,
};

type OpenModal =
  | { kind: 'edit'; stage: Stage; returnCase: FullReturnCase }
  | { kind: 'complete'; stage: Stage; returnCase: FullReturnCase }
  | { kind: 'view'; returnCase: FullReturnCase }
  | { kind: 'email'; returnCase: FullReturnCase }
  | null;

/**
 * Everything that can pop up for a case: the stage forms, the "complete this
 * stage" confirmation, the read-only view and the email form. The table and
 * both card layouts all use this, so they open exactly the same dialogs.
 *
 * Render `modals` once; call the open functions from buttons. `onChanged`
 * runs after anything is saved, to reload the list.
 */
export function useCaseModals(onChanged?: () => void) {
  const [open, setOpen] = useState<OpenModal>(null);
  const close = () => setOpen(null);
  const changed = () => onChanged?.();

  let modals = null;
  if (open?.kind === 'edit') {
    const StageForm = STAGE_FORMS[open.stage.key];
    modals = <StageForm returnCase={open.returnCase} onClose={close} onSuccess={changed} />;
  } else if (open?.kind === 'complete') {
    modals = (
      <StageCompletionModal isOpen stage={open.stage.key} caseId={open.returnCase.id} onClose={close} onSuccess={changed} />
    );
  } else if (open?.kind === 'view') {
    modals = <ViewReturnCaseModal returnCase={open.returnCase} onClose={close} />;
  } else if (open?.kind === 'email') {
    modals = <EmailCustomerModal returnCase={open.returnCase} onClose={close} onSuccess={changed} />;
  }

  return {
    modals,
    editStage: (returnCase: FullReturnCase, stage: Stage) => setOpen({ kind: 'edit', stage, returnCase }),
    completeStage: (returnCase: FullReturnCase, stage: Stage) => setOpen({ kind: 'complete', stage, returnCase }),
    view: (returnCase: FullReturnCase) => setOpen({ kind: 'view', returnCase }),
    email: (returnCase: FullReturnCase) => setOpen({ kind: 'email', returnCase }),
    /** For callers that only know the stage's key. */
    stage: (key: StageKey) => stageByKey(key)!,
  };
}
