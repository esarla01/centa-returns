// src/components/CasesTable.tsx
import React from 'react'
import CaseRow from './CasesRow'
import { Case } from '@/types/cases'

interface CasesTableProps {
  data: Case[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function CasesTable({ data, selectedId, onSelect }: CasesTableProps) {
  const headers = [
    '',
    'Geliş Tarihi',
    'Firma İsmi',
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
    <div className="h-[475px] md:max-w-[1100px] sm:max-w-[100%] overflow-x-auto bg-white shadow-md rounded-2xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-300">
      <thead className="sticky top-0 z-10">
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
        <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
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
      {data.length === 0 && (
        <div className="text-center text-gray-500 py-8 text-sm">
          Herhangi bir kayıt bulunamadı.
        </div>
      )}
    </div>
  )
}
