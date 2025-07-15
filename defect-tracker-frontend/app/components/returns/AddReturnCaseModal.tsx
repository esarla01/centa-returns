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

// Internal state for a single item being added
interface NewItem {
    id: number; // Temporary client-side ID for list keys
    productModelId: string;
    productCount: number;
    serialNumber: string;
    includeAttachedUnit: boolean;
    attachedUnitModelId: string;
}

export default function AddReturnCaseModal({ onClose, onSuccess }: AddReturnCaseModalProps) {

    // Dropdown data states
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [mainProducts, setMainProducts] = useState<ProductModel[]>([]);
    const [controlUnits, setControlUnits] = useState<ProductModel[]>([]);
    
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
                const [custRes, userRes, prodRes] = await Promise.all([
                    fetch('http://localhost:5000/customers?limit=1000', { credentials: 'include' }),
                    fetch('http://localhost:5000/auth/retrieve-users?limit=100', { credentials: 'include' }),
                    fetch('http://localhost:5000/products?limit=1000', { credentials: 'include' })
                ]);
                const custData = await custRes.json();
                const userData = await userRes.json();
                const prodData = await prodRes.json();

                setCustomers(custData.customers || []);
                setUsers(userData.users || []);

                // Separate products into main items and control units based on your business rule
                setMainProducts(prodData.products);
                setControlUnits(prodData.products.filter((p: ProductModel) => p.product_type === 'Kontrol Ünitesi'));

            } catch (err) {
                setError("Dropdown verileri yüklenemedi.");
            }
        };
        fetchDropdownData();
    }, []);

    // --- Add/Remove Item Logic ---
    const handleAddItem = () => {
        setItems([...items, {
            id: Date.now(),
            productModelId: '',
            productCount: 1,
            serialNumber: '',
            includeAttachedUnit: false,
            attachedUnitModelId: ''
        }]);
    };

    // Remove item by filtering out the one with matching ID
    const handleRemoveItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };
    
    const handleItemChange = (id: number, field: keyof NewItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
    const handleCaseDetailChange = (field: keyof typeof caseDetails, value: string) => {
        setCaseDetails(prev => ({...prev, [field]: value}));
    };

    // --- Form Submission ---
    const handleSubmit = async (e: FormEvent) => {
        setIsSubmitting(true);

        console.log('Submitting case with details:', caseDetails);
        console.log('With items:', items);



        // e.preventDefault();
        // setIsSubmitting(true);
        // setError(null);

        // Transform frontend state to backend-expected format
        const finalItems = items.flatMap(item => {
            const mainItem = {
                product_model_id: parseInt(item.productModelId),
                product_count: item.productCount,
                serial_number: item.serialNumber,
                is_main_product: true,
            };
            if (item.includeAttachedUnit && item.attachedUnitModelId) {
                const attachedItem = {
                    product_model_id: parseInt(item.attachedUnitModelId),
                    product_count: 1,
                    serial_number: '',
                    is_main_product: false,
                };
                return [mainItem, attachedItem];
            }
            return [mainItem];
        }).filter(item => item.product_model_id); // Filter out empty items

        console.log('Final items to submit:', finalItems);

        // const payload = {
        //     ...caseDetails,
        //     customer_id: parseInt(caseDetails.customerId),
        //     assigned_user_id: caseDetails.assignedUserId ? parseInt(caseDetails.assignedUserId) : null,
        //     items: finalItems
        // };
        
        // try {
        //     const res = await fetch('http://localhost:5000/api/return-cases', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(payload),
        //         credentials: 'include'
        //     });
        //     const data = await res.json();
        //     if(!res.ok) throw new Error(data.msg || "Vaka oluşturulamadı.");
        //     onSuccess();
        // } catch (err: any) {
        //     setError(err.message);
        // } finally {
        //     setIsSubmitting(false);
        // }
        setIsSubmitting(false);


    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
        <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Yeni Gelen Ürün Vakası Oluştur</h2>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form id="add-case-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
            
            {/* Case Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-md">
                <h3 className="col-span-full text-lg font-semibold text-gray-700">Vaka Detayları</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Müşteri</label>
                    <select required value={caseDetails.customerId} onChange={e => handleCaseDetailChange('customerId', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                        <option value="" disabled>Müşteri Seçin...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div lang="tr">
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
                    <select required value={caseDetails.receiptMethod} onChange={e => handleCaseDetailChange('receiptMethod', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                        <option value="" disabled selected>Teslim Yöntemini Seçin...</option>    
                        <option value="shipment">Kargo</option>
                        <option value="in_person">Elden Teslim</option>
                    </select>
                </div>
            </div>
            
            {/* Returned Items Section */}
            <div className="p-4 border rounded-md space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Gelen Ürünler</h3>
                {items.map((item, index) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-4 border relative">
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><Trash2 size={16}/></button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Ana Ürün</label>
                                <select required value={item.productModelId} onChange={e => handleItemChange(item.id, 'productModelId', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                                    <option value="" disabled>Ürün Modeli Seçin...</option>
                                    {mainProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                        
                        { mainProducts.find(p => p.id === parseInt(item.productModelId))?.product_type !== 'Kontrol Ünitesi'
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
                { items.every(item => item.productModelId && item.productCount > 0) && (
                <button type="button" onClick={handleAddItem} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                    <PlusCircle size={18}/>
                    <span>Ürün Ekle</span>
                </button>
                )}
            </div>
             {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
        </form>

        <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">İptal</button>  
                <button type="submit" form="add-case-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                    {isSubmitting ? 'Oluşturuluyor...' : 'Vaka Oluştur'}
                </button>
                <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Deneme</button>  
            </div>
        </div>
      </div>
    </div>
  );
}