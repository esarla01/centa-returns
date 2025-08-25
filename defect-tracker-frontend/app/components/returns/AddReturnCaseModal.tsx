'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { tr } from 'date-fns/locale';

import { useState, useEffect, FormEvent, use } from 'react';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { Customer, User, ProductModel } from '@/lib/types';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import SearchableSelect from '../SearchableSelect';

interface AddReturnCaseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}
  
export default function AddReturnCaseModal({ onClose, onSuccess }: AddReturnCaseModalProps) {

    // Dropdown data states
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Form state for case details
    const [caseDetails, setCaseDetails] = useState({
        customerId: '',
        arrivalDate: new Date().toISOString().split('T')[0], // Default to today
        receiptMethod: '',
        notes: '',
    });

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data for all dropdowns when the modal mounts
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                // Fetch all data in parallel
                const [custRes, userRes] = await Promise.all([
                    fetch(buildApiUrl(API_ENDPOINTS.CUSTOMERS) + '?limit=1000', { method: 'GET', credentials: 'include' }),
                    fetch(buildApiUrl(API_ENDPOINTS.PRODUCTS) + '?limit=1000', { method: 'GET', credentials: 'include' })
                ]);
                const custData = await custRes.json();
                const userData = await userRes.json();

                setCustomers(custData.customers || []);
                setUsers(userData.users || []);

            } catch (err) {
                setError("Dropdown verileri yüklenemedi.");
            }
        };
        fetchDropdownData();
    }, []);

    const handleCaseDetailChange = (field: keyof typeof caseDetails, value: string) => {
        setCaseDetails(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!caseDetails.customerId) {
            setError('Müşteri seçiniz.');
            return;
        }
        if (!caseDetails.receiptMethod) {
            setError('Teslim alma yöntemini seçiniz.');
            return;
        }
        setIsSubmitting(true);
        try {
                const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.SIMPLE), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    customerId: caseDetails.customerId,
                    arrivalDate: caseDetails.arrivalDate,
                    receiptMethod: caseDetails.receiptMethod,
                    notes: caseDetails.notes,
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Sunucu hatası');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-lg h-auto bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Yeni Gelen Ürün Vakası Oluştur</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form id="add-case-form" onSubmit={(e) => e.preventDefault()} className="flex-grow overflow-y-auto p-5 space-y-6">
            <h3 className="text-base font-semibold text-gray-700 mb-2">Vaka Detayları</h3>
            <div className="flex flex-col gap-4">
                <div>
                    <SearchableSelect
                        options={customers}
                        value={caseDetails.customerId}
                        onChange={(value) => handleCaseDetailChange('customerId', value.toString())}
                        placeholder="Müşteri Seçin..."
                        label="Müşteri"
                        required
                        searchPlaceholder="Müşteri adı ile ara..."
                        className="mt-1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Geliş Tarihi</label>
                    <div className="mt-1 w-full border border-gray-300 rounded-md p-1.5 focus-within:ring-2 focus-within:ring-blue-200">
                        <DatePicker
                            selected={new Date(caseDetails.arrivalDate)}
                            onChange={date => date ? handleCaseDetailChange('arrivalDate', date.toISOString().split('T')[0]) : handleCaseDetailChange('arrivalDate', '')}
                            locale={tr}
                            dateFormat="dd.MM.yyyy"
                            wrapperClassName="w-full" 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Teslim Alma Yöntemi</label>
                    <select value={caseDetails.receiptMethod} onChange={e => handleCaseDetailChange('receiptMethod', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-200">
                        <option value="" disabled> Teslim Yöntemini Seçin... </option>
                        <option value="shipment">Kargo</option>
                        <option value="in_person">Elden Teslim</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Notlar</label>
                    <textarea
                        value={caseDetails.notes}
                        onChange={e => handleCaseDetailChange('notes', e.target.value)}
                        className="mt-1 w-full border border-gray-300 rounded-md p-2 min-h-[60px] focus:ring-2 focus:ring-blue-200"
                        placeholder="Eklemek istediğiniz notları buraya yazabilirsiniz..."
                    />
                </div>
            </div>
            {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">İptal</button>  
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                {isSubmitting ? 'Oluşturuluyor...' : 'Vaka Oluştur'}
                </button>

            </div>
        </form>
      </div>
    </div>
  );
}