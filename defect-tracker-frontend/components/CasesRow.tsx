// src/components/CaseRow.tsx
import React, { useState } from 'react'
import { Case } from '@/types/cases'


interface CaseRowProps {
  data: Case
  isSelected: boolean
  onSelect: (id: number) => void
}

export default function CaseRow({
  data,
  isSelected,
  onSelect,
}: CaseRowProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Truncate note if longer than 10 chars
  const truncatedNote =
    data.note && data.note.length > 10 ? data.note.slice(0, 10) + '...' : data.note;
  return (
    <>
    {showNoteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-4 max-w-sm w-full shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Not Detayı</h3>
          <p className="mb-4 whitespace-pre-wrap">{data.note}</p>
          <button
            onClick={() => setShowNoteModal(false)}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-700"
            type="button"
          >
            Kapat
          </button>
        </div>
      </div>
 
    )}
    <tr
      className={`
        hover:bg-gray-100
        ${isSelected ? 'bg-cyan-100' : ''}
      `}
    >
      <td className="px-4 py-4 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(data.id)}
          className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
        />
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.arrival_date}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.name}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.representative}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.contact}
      </td>
      {/* Note cell */}
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.note && data.note.length > 10 ? (
          <button
            className="text-black hover:underline cursor-pointer"
            onClick={() => setShowNoteModal(true)}
            type="button"
            aria-label="Show full note"
          >
            {truncatedNote}
          </button>
        ) : (
          data.note || ''
        )}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.address}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.warranty_status_photosensor || 'Yok'}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.photosensor_height_count}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.photosensor_power_count}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.warranty_status_overload || 'Yok'}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.overload_lc1_count}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.performed_service}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.cost}₺
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.payment_details || 'N/A'}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.status}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.shipping_company}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.shipping_date || 'N/A'}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.shipping_addresses}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
        {data.shipping_information || 'N/A'}
      </td>
    </tr>
    </>
  )
}
