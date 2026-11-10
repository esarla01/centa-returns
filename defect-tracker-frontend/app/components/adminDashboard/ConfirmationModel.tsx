'use client';

import { User } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

interface DeleteConfirmationModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteConfirmationModal({ user, onClose, onSuccess }: DeleteConfirmationModalProps) {
  return (
    <ConfirmDeleteModal
      title="Kullanıcıyı Sil" path={API_ENDPOINTS.ADMIN.USERS} body={{ email: user.email }}
      fallbackError="Failed to delete user." onClose={onClose} onSuccess={onSuccess}
    >
      Kullanıcıyı silmek istediğinizden emin misiniz{' '}
      <strong className="text-gray-900">{user.firstName} {user.lastName}</strong>?
      Bu işlem geri alınamaz.
    </ConfirmDeleteModal>
  );
}
