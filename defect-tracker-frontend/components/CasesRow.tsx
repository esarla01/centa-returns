// src/components/CaseRow.tsx
import React from 'react'

interface DataProps {
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

interface CaseRowProps {
  data: DataProps
  isSelected: boolean
  onSelect: (id: string) => void
}

export default function CaseRow({
  data,
  isSelected,
  onSelect,
}: CaseRowProps) {
  return (
    <tr
      className={`
        hover:bg-gray-50
        ${isSelected ? 'bg-green-50' : ''}
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.arrivalDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
        {data.company}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.companyRepresentative}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.companyContact}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.note}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.address}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.warrantyStatusPhotosensor}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.photosensorHeightCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.photosensorPowerCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.warrantyStatusOverload}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.overloadLC1Count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.performedService}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.cost}₺
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.paymentDetails}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.status}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.shippingCompany}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.shippingDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.shippingAddresses}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.shippingInformation}
      </td>
    </tr>
  )
}
