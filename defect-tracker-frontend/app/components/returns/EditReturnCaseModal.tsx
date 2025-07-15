'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase, ReturnCase, User, Customer, ProductModel } from '@/lib/types';
// This modal is too complex for a simple prop; it will fetch its own data.

interface EditReturnCaseModalProps {
  returnCaseSummary: ReturnCase; // Use summary to show a placeholder while loading
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReturnCaseModal({ returnCaseSummary, onClose, onSuccess }: EditReturnCaseModalProps) {
  const [fullCase, setFullCase] = useState<FullReturnCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // You would also need to fetch users, customers, products for dropdowns
  // For this example, we'll assume they are available or fetched.
  
  useEffect(() => {
    const fetchFullCaseData = async () => {
      setIsLoading(true);
      try {
        // ASSUMPTION: You have an endpoint to get a single case's full details
        const res = await fetch(`http://localhost:5000/api/return-cases/${returnCaseSummary.id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load case details.');
        const data: FullReturnCase = await res.json();
        setFullCase(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullCaseData();
  }, [returnCaseSummary.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullCase) return;
    
    // Logic to prepare the updated data and send a PUT request
    // This would be very similar to the Add modal's logic but starting from existing data
    console.log("Submitting updated case:", fullCase);
    
    // ... PUT request logic here ...

    // onSuccess();
  };

  if (isLoading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
             <div className="absolute inset-0 bg-gray-900 opacity-50"></div>
             <div className="text-white text-lg">Vaka Detayları Yükleniyor...</div>
        </div>
    )
  }

  if (error || !fullCase) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
             <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
             <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                <h3 className="text-xl text-red-600">Hata</h3>
                <p className="my-4">{error || "Vaka detayları yüklenemedi."}</p>
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Kapat</button>
             </div>
        </div>
    )
  }

  // The full form would be here, pre-filled with `fullCase` data.
  // It would manage its own state for changes, e.g., `const [status, setStatus] = useState(fullCase.status);`
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl h-[90vh] p-8 bg-white rounded-lg shadow-xl overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Vakayı Düzenle: #{fullCase.id}</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 
              This form would contain all the fields: Status, Assigned User, Fault Source,
              and a dynamic list for editing the items, similar to the Add Modal.
              Each field would be pre-populated from the `fullCase` state.
            */}
            <p className="text-center text-gray-500 my-10">
                (Burada vaka düzenleme formu yer alacak. Vakanın mevcut durumu, atanan kişi, ürünleri vb. düzenlenebilir olacak.)
            </p>

            <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Değişiklikleri Kaydet</button>
            </div>
        </form>
      </div>
    </div>
  );
}