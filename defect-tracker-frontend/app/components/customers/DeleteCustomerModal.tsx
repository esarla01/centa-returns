'use client';

import { Customer } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

interface DeleteCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteCustomerModal({ customer, onClose, onSuccess }: DeleteCustomerModalProps) {
  return (
    <ConfirmDeleteModal
      title="Müşteriyi Sil" path={`${API_ENDPOINTS.CUSTOMERS}/${customer.id}`}
      fallbackError="Müşteri silinemedi." onClose={onClose} onSuccess={onSuccess}
    >
      <strong className="text-gray-900">{customer.name}</strong> isimli müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
    </ConfirmDeleteModal>
  );
}
