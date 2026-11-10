'use client';

import { FullReturnCase } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

interface DeleteReturnCaseModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteReturnCaseModal({ returnCase, onClose, onSuccess }: DeleteReturnCaseModalProps) {
  return (
    <ConfirmDeleteModal
      title="Vakayı Sil" path={API_ENDPOINTS.RETURNS.BY_ID(returnCase.id)}
      fallbackError="Failed to delete case." onClose={onClose} onSuccess={onSuccess}
    >
      <strong className="text-gray-900">#{returnCase.id}</strong> nolu vakayı ({returnCase.customer.name}) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
    </ConfirmDeleteModal>
  );
}
