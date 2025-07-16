import React, { useState } from 'react';
import { Case } from '@/types/cases';

interface NewCaseModalProps {
  selectedRow: Case;
  onClose: () => void;
  onSave: (updatedCase: Case) => void;
}

const WARRANTY_OPTIONS = [
  { label: 'Seçiniz', value: '' },
  { label: 'Geçerli', value: 'valid' },
  { label: 'Süresi Dolmuş', value: 'expired' },
  { label: 'Bilinmiyor', value: 'unknown' },
];

const PAYMENT_OPTIONS = [
  { label: 'Seçiniz', value: '' },
  { label: 'Paid', value: 'paid' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Pending', value: 'pending' },
];

const STATUS_OPTIONS = [
  { label: 'Seçiniz', value: '' },
  { label: 'Açık', value: 'open' },
  { label: 'Devam Ediyor', value: 'in_progress' },
  { label: 'Kapandı', value: 'closed' },
];

export default function NewCaseModal({
  selectedRow,
  onClose,
  onSave,
}: NewCaseModalProps) {
  // Initialize form state from selectedRow, converting enums to lowercase
  const [caseRow, setCaseRow] = useState<Case>({
    ...selectedRow,
    warranty_status_photosensor: selectedRow.warranty_status_photosensor?.toLowerCase() as Case['warranty_status_photosensor'],
    warranty_status_overload: selectedRow.warranty_status_overload?.toLowerCase() as Case['warranty_status_overload'],
    payment_details: selectedRow.payment_details?.toLowerCase() as Case['payment_details'],
    status: selectedRow.status?.toLowerCase() as Case['status'],
  });

  const handleChange = <K extends keyof Case>(key: K, value: Case[K]) => {
    setCaseRow((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(caseRow);
    onClose();
  };

  // Helper to handle nullable numbers (allow empty string to be null)
  const handleNumberChange = (key: keyof Case, val: string) => {
    const parsed = val === '' ? null : Number(val);
    handleChange(key, parsed as any);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Yeni Arıza Kaydı Düzenle</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          {/* Arrival Date */}
          <div>
            <label className="block text-sm font-medium">Geliş Tarihi</label>
            <input
              type="date"
              value={caseRow.arrival_date}
              onChange={(e) => handleChange('arrival_date', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Firma */}
          <div>
            <label className="block text-sm font-medium">Firma İsmi</label>
            <input
              type="text"
              value={caseRow.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Representative */}
          <div>
            <label className="block text-sm font-medium">Firma Yetkilisi</label>
            <input
              type="text"
              value={caseRow.representative ?? ''}
              onChange={(e) => handleChange('representative', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium">Firma İletişim</label>
            <input
              type="text"
              value={caseRow.contact ?? ''}
              onChange={(e) => handleChange('contact', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium">Not</label>
            <input
              type="text"
              value={caseRow.note ?? ''}
              onChange={(e) => handleChange('note', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium">Adres</label>
            <input
              type="text"
              value={caseRow.address ?? ''}
              onChange={(e) => handleChange('address', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Warranty & Counts grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Fotosel Garanti Durumu</label>
              <select
                value={caseRow.warranty_status_photosensor || ''}
                onChange={(e) => handleChange('warranty_status_photosensor', e.target.value as Case['warranty_status_photosensor'])}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                {WARRANTY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Boy Fotosel Adet</label>
              <input
                type="number"
                min={0}
                value={caseRow.photosensor_height_count ?? ''}
                onChange={(e) => handleNumberChange('photosensor_height_count', e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Fotosel Besleme Adet</label>
              <input
                type="number"
                min={0}
                value={caseRow.photosensor_power_count ?? ''}
                onChange={(e) => handleNumberChange('photosensor_power_count', e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Aşırı Yük Garanti Durumu</label>
              <select
                value={caseRow.warranty_status_overload || ''}
                onChange={(e) => handleChange('warranty_status_overload', e.target.value as Case['warranty_status_overload'])}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                {WARRANTY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Aşırı Yük LC1 Adet</label>
              <input
                type="number"
                min={0}
                value={caseRow.overload_lc1_count ?? ''}
                onChange={(e) => handleNumberChange('overload_lc1_count', e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Performed Service */}
          <div>
            <label className="block text-sm font-medium">Yapılan İşlem</label>
            <input
              type="text"
              value={caseRow.performed_service ?? ''}
              onChange={(e) => handleChange('performed_service', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium">Masraf</label>
            <input
              type="number"
              min={0}
              value={caseRow.cost ?? ''}
              onChange={(e) => handleNumberChange('cost', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Payment Details */}
          <div>
            <label className="block text-sm font-medium">Tahsilat</label>
            <select
              value={caseRow.payment_details || ''}
              onChange={(e) => handleChange('payment_details', e.target.value as Case['payment_details'])}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              {PAYMENT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium">Durum</label>
            <select
              value={caseRow.status || ''}
              onChange={(e) => handleChange('status', e.target.value as Case['status'])}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Shipping Information */}
          <div>
            <label className="block text-sm font-medium">Kargo Firması</label>
            <input
              type="text"
              value={caseRow.shipping_company ?? ''}
              onChange={(e) => handleChange('shipping_company', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Sevk Tarihi</label>
            <input
              type="date"
              value={caseRow.shipping_date ?? ''}
              onChange={(e) => handleChange('shipping_date', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Sevk Adresleri</label>
            <input
              type="text"
              value={caseRow.shipping_addresses ?? ''}
              onChange={(e) => handleChange('shipping_addresses', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Sevk Bilgileri</label>
            <input
              type="text"
              value={caseRow.shipping_information ?? ''}
              onChange={(e) => handleChange('shipping_information', e.target.value || null)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-gray-100"
            >
              Kapat
            </button>
            <button
              type="submit"
              // disabled={None}
              className="px-4 py-2 rounded bg-green-600 text-white disabled:bg-gray-300 hover:bg-green-700"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
