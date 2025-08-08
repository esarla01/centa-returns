// components/DeleteConfirmationModal.tsx
'use client';

import { useState } from 'react';
import { User } from '@/lib/types'; // Make sure to import your User type
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  user: User; // The user object to be deleted
  onClose: () => void; // Function to close the modal
  onSuccess: () => void; // Function to call after successful deletion to refresh the data
}

export default function DeleteConfirmationModal({ user, onClose, onSuccess }: DeleteConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/admin/', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email, 
        }),
        credentials: 'include', 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to delete user.');
      }
      onSuccess(); 
      onClose();   

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
        <div className="flex">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Kullanıcıyı Sil
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the user{' '}
                <strong className="text-gray-900">{user.firstName} {user.lastName}</strong>?
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isLoading}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Siliniyor...' : 'Evet, Sil'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}