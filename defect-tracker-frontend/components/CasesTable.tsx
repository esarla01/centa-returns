// src/components/CasesTable.tsx
import React from 'react'
import CaseRow from './CasesRow'

interface Case {
  id: string
  arrivalDate: string
  company: string
  companyRepresentative: string
  companyContact: string
  note: string
  address: string
  warrantyStatusPhotosensor: string
  photosensorHeightCount: number
  photosensorPowerCount: number
  warrantyStatusOverload: string
  overloadLC1Count: number
  performedService: string
  cost: number
  paymentDetails: string
  status: string
  shippingCompany: string
  shippingDate: string
  shippingAddresses: string
  shippingInformation: string
}

interface CasesTableProps {
  data: Case[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function CasesTable({ data, selectedId, onSelect }: CasesTableProps) {
  const headers = [
    '',
    'Geliş Tarihi',
    'Firma',
    'Firma Yetkilisi',
    'Firma İletişim',
    'Not',
    'Adres',
    'Garanti Fotosel',
    'Boy Fotosel Adet',
    'Fotosel Besleme Adet',
    'Garanti Aşırı Yük',
    'Aşırı Yük LC1 Adet',
    'Yapılan İşlem',
    'Masraf',
    'Tahsilat',
    'Durum',
    'Kargo Firması',
    'Sevk Tarihi',
    'Sevk Adresleri',
    'Sevk Bilgileri',
  ]

  return (
    <div className="max-h-[640px] overflow-y-auto max-w-[1000px] overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-white">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className={`
                  ${idx === 0 ? 'w-12 px-4' : 'px-6'}
                  py-3 text-left text-sm font-medium text-gray-700 tracking-wider
                `}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((caseItem) => (
            <CaseRow
              key={caseItem.id}
              data={caseItem}
              isSelected={caseItem.id === selectedId}
              onSelect={() => onSelect(caseItem.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
