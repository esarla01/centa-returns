'use client';

import { ProductModel } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

interface DeleteProductModalProps {
  product: ProductModel;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteProductModal({ product, onClose, onSuccess }: DeleteProductModalProps) {
  return (
    <ConfirmDeleteModal
      title="Modeli Sil" path={`${API_ENDPOINTS.PRODUCTS}/${product.id}`}
      fallbackError="Failed to delete model." onClose={onClose} onSuccess={onSuccess}
    >
      <strong className="text-gray-900">{product.name}</strong> modelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
    </ConfirmDeleteModal>
  );
}
