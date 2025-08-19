'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { FullReturnCase } from '@/lib/types'; // Using the full type for consistency
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface DeleteReturnCaseModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteReturnCaseModal({ returnCase, onClose, onSuccess }: DeleteReturnCaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.BASE) + '/' + returnCase.id, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to delete case.');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Vakayı Sil</h3>
            <p className="mt-2 text-sm text-gray-500">
              <strong className="text-gray-900">#{returnCase.id}</strong> nolu vakayı ({returnCase.customer.name}) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
          </div>
        </div>
        {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button type="button" onClick={handleConfirmDelete} disabled={isLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:text-sm disabled:bg-red-300">
            {isLoading ? 'Siliniyor...' : 'Evet, Sil'}
          </button>
          <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}