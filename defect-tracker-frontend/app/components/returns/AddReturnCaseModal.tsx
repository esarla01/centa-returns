'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { tr } from 'date-fns/locale';

import { useState, useEffect, FormEvent, use } from 'react';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { Customer, User, ProductModel } from '@/lib/types';

interface AddReturnCaseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface NewItem {
    id: number; 
    productType: string; 
    productCount: number;
    serialNumber: string;
    includeAttachedUnit: boolean;
    attachedUnitModelId: string;
}

type NewReturnCasePayload = {
    customerId: number;
    arrivalDate: string;
    receiptMethod: string;
    items: {
      productType: string;
      productCount: number;
      serialNumber?: string | null;
      attachControlUnit?: boolean;
    }[];
  };
  

export default function AddReturnCaseModal({ onClose, onSuccess }: AddReturnCaseModalProps) {

    // Dropdown data states
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Form state for case details
    const [caseDetails, setCaseDetails] = useState({
        customerId: '',
        arrivalDate: new Date().toISOString().split('T')[0], // Default to today
        receiptMethod: '',
    });

    // State for dynamic items being added
    const [items, setItems] = useState<NewItem[]>([]);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data for all dropdowns when the modal mounts
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                // Fetch all data in parallel
                const [custRes, userRes] = await Promise.all([
                    fetch('http://localhost:5000/customers?limit=1000', { credentials: 'include' }),
                    fetch('http://localhost:5000/products?limit=1000', { credentials: 'include' })
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

    const handleAddItem = () => {
        setItems([...items, {
            id: Date.now(),
            productType: '', 
            productCount: 1,
            serialNumber: '',
            includeAttachedUnit: false,
            attachedUnitModelId: ''
        }]);
    };

    const handleRemoveItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };
    
    const handleItemChange = (id: number, field: keyof NewItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
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
        const validItems = items.filter(item => item.productType && item.productCount > 0);
        if (validItems.length === 0) {
            setError('En az bir arızalı ürün ekleyiniz.');
            return;
        }
    

        setIsSubmitting(true);

        try {
            const payload: NewReturnCasePayload = {
                customerId: parseInt(caseDetails.customerId),
                arrivalDate: caseDetails.arrivalDate,
                receiptMethod: caseDetails.receiptMethod,
                items: validItems.map(item => ({
                    productType: item.productType,
                    productCount: item.productCount,
                    serialNumber: item.serialNumber || null,
                    attachControlUnit: item.includeAttachedUnit || false
                }))
            };
    
            const response = await fetch('http://localhost:5000/returns/', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Sunucu hatası');
            }
    
            // Success! Inform parent, reset modal.
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
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
        <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Yeni Gelen Ürün Vakası Oluştur</h2>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form id="add-case-form" onSubmit={(e) => e.preventDefault()} className="flex-grow overflow-y-auto p-6 space-y-6">
            
            {/* Case Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-md">
                <h3 className="col-span-full text-lg font-semibold text-gray-700">Vaka Detayları</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Müşteri</label>
                    <select value={caseDetails.customerId} onChange={e => handleCaseDetailChange('customerId', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                        <option value="" disabled>Müşteri Seçin...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Geliş Tarihi</label>
                    <div className="mt-1 w-full border border-gray-300 rounded-md p-1.5">
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
                    <select value={caseDetails.receiptMethod} onChange={e => handleCaseDetailChange('receiptMethod', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                    <option value="" disabled> Teslim Yöntemini Seçin... </option>
                        <option value="shipment">Kargo</option>
                        <option value="in_person">Elden Teslim</option>
                    </select>
                </div>
            </div>
            
            {/* Returned Items Section */}
            <div className="p-4 border rounded-md space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Gelen Ürünler</h3>
                {items.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-4 border relative">
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><Trash2 size={16}/></button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ürün Tipi</label>
                                <select required value={item.productType} onChange={e => handleItemChange(item.id, 'productType', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                                    <option value="" disabled>Ürün Tipi Seçin...</option>
                                    <option value="overload">Aşırı Yük Sensörü</option>
                                    <option value="door_detector">Kapı Dedektörü</option>
                                    <option value="control_unit">Kontrol Ünitesi</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Adet</label>
                                <input type="number" min="1" value={item.productCount} onChange={e => handleItemChange(item.id, 'productCount', parseInt(e.target.value))} className="mt-1 w-full border border-gray-300 rounded-md p-2"/>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Seri Numarası</label>
                                <input type="text" value={item.serialNumber} onChange={e => handleItemChange(item.id, 'serialNumber', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2"/>
                             </div>
                        </div>
                        
                        { item.productType !== 'control_unit' 
                        && (
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex items-center">
                                <input type="checkbox" id={`cb-${item.id}`} checked={item.includeAttachedUnit} onChange={e => handleItemChange(item.id, 'includeAttachedUnit', e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                                <label htmlFor={`cb-${item.id}`} className="ml-2 block text-sm text-gray-900">Kontrol Ünitesi Ekle</label>
                            </div>
                        </div>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!items.every(item => item.productType && item.productCount > 0)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                    <PlusCircle size={18} />
                    <span>Ürün Ekle</span>
                </button>

            </div>
             {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
        </form>

        <div className="p-6 border-t bg-gray-50">
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
        </div>
      </div>
    </div>
  );
}