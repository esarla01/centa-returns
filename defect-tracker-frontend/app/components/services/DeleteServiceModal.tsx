'use client';

import { ServiceModel } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

interface DeleteServiceModalProps {
  service: ServiceModel;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteServiceModal({ service, onClose, onSuccess }: DeleteServiceModalProps) {
  return (
    <ConfirmDeleteModal
      title="Servisi Sil" path={`${API_ENDPOINTS.SERVICES}/${service.id}`}
      fallbackError="Failed to delete service." onClose={onClose} onSuccess={onSuccess}
    >
      <strong className="text-gray-900">{service.service_name}</strong> servisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
    </ConfirmDeleteModal>
  );
}
