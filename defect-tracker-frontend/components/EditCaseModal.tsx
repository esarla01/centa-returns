import React, { useEffect, useState } from 'react';

interface CasesRowProps {
  id: string;
  arrivalDate: string;
  company: string;
  companyRepresentative: string;
  companyContact: string;
  note: string;
  address: string;
  warrantyStatusPhotosensor: string;
  photosensorHeightCount: number;
  photosensorPowerCount: number;
  warrantyStatusOverload: string;
  overloadLC1Count: number;
  performedService: string;
  cost: number;
  paymentDetails: string;
  status: string;
  shippingCompany: string;
  shippingDate: string;
  shippingAddresses: string;
  shippingInformation: string;
}

interface NewCaseModalProps {
    selectedRow: CasesRowProps;
    onClose: () => void;
    onSave: (answer: CasesRowProps) => void;
}

export default function NewCaseModal({ selectedRow, onClose, onSave }: NewCaseModalProps) {

    const [casesRow, setCasesRow] = useState<CasesRowProps>(selectedRow);

    const handleChange = <K extends keyof CasesRowProps>(
        key: K,
        value: CasesRowProps[K]
    ) => {
        setCasesRow(prev => ({ ...prev, [key]: value }));
    };

    const allRequiredFilled = Object.entries(casesRow).every(([k, v]) => {
        if (typeof v === 'number') return true;
        return (v as string).trim() !== '';
    });

    const handleSave = () => {
        onSave(casesRow);
        onClose();
    };


    useEffect(() => {
        console.log(casesRow);
    }, [casesRow]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />

      <div className="relative z-10 bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Yeni Arıza Kaydı Oluştur</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Geliş Tarihi</label>
            <input
              type="date"
              value={casesRow.arrivalDate}
              onChange={e => handleChange('arrivalDate', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Firma</label>
            <input
              type="text"
              value={casesRow.company}
              onChange={e => handleChange('company', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Firma Yetkilisi</label>
            <input
              type="text"
              value={casesRow.companyRepresentative}
              onChange={e =>
                handleChange('companyRepresentative', e.target.value)
              }
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Firma İletişim</label>
            <input
              type="email"
              value={casesRow.companyContact}
              onChange={e => handleChange('companyContact', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Not</label>
            <input
              type="text"
              value={casesRow.note}
              onChange={e => handleChange('note', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Adres</label>
            <input
              type="text"
              value={casesRow.address}
              onChange={e => handleChange('address', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Fotosel Garanti Durumu
              </label>
              <select
                value={casesRow.warrantyStatusPhotosensor}
                onChange={e =>
                  handleChange('warrantyStatusPhotosensor', e.target.value)
                }
                className="mt-1 w-full border rounded px-3 py-2"
                required
              >
                <option value="">{casesRow.warrantyStatusPhotosensor ? casesRow.warrantyStatusPhotosensor : 'Seçiniz'}</option>
                <option>Geçerli</option>
                <option>Süresi Dolmuş</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Aşırı Yük Garanti Durumu
              </label>
              <select
                value={casesRow.warrantyStatusOverload}
                onChange={e =>
                  handleChange('warrantyStatusOverload', e.target.value)
                }
                className="mt-1 w-full border rounded px-3 py-2"
                required
              >
                <option value="">{casesRow.warrantyStatusOverload ? casesRow.warrantyStatusOverload : 'Seçiniz'}</option>
                <option>Geçerli</option>
                <option>Süresi Dolmuş</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Yapılan İşlem</label>
            <input
              type="text"
              value={casesRow.performedService}
              onChange={e =>
                handleChange('performedService', e.target.value)
              }
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Masraf</label>
            <input
              type="number"
              value={casesRow.cost}
              onChange={e =>
                handleChange('cost', Number(e.target.value))
              }
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Durum</label>
            <select
              value={casesRow.status}
              onChange={e => handleChange('status', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              required
            >
              <option value="">{casesRow.status ? casesRow.status : "Seçiniz"}</option>
              <option>Açık</option>
              <option>Devam Ediyor</option>
              <option>Kapandı</option>
            </select>
          </div>

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
              disabled={!allRequiredFilled}
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
