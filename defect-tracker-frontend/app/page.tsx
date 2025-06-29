'use client';

import React, { use, useEffect, useState } from 'react';
import { CasesTable } from '../components/CasesTable';
import EditButton from '../components/EditButton';

export default function MainPage() {
  // Mock data
  const mockCases = [
    {
      id: '1',
      arrivalDate: '2024-07-20',
      company: 'Tech Solutions Inc.',
      companyRepresentative: 'John Doe',
      companyContact: 'john.doe@techsolutions.com',
      note: 'Urgent repair needed',
      address: '123 Maple St, Apt 4B',
      warrantyStatusPhotosensor: 'Valid',
      photosensorHeightCount: 2,
      photosensorPowerCount: 1,
      warrantyStatusOverload: 'Expired',
      overloadLC1Count: 1,
      performedService: 'Battery replacement',
      cost: 120,
      paymentDetails: 'Paid',
      status: 'Closed',
      shippingCompany: 'FedEx',
      shippingDate: '2024-07-22',
      shippingAddresses: '123 Maple St, Apt 4B',
      shippingInformation: 'Tracking #123456789',
    },
    {
      id: '2',
      arrivalDate: '2024-07-21',
      company: 'Office Supplies Co.',
      companyRepresentative: 'Jane Smith',
      companyContact: 'jane.smith@officesupplies.com',
      note: 'Replace broken keys',
      address: '456 Oak Ave, Unit 12',
      warrantyStatusPhotosensor: 'Expired',
      photosensorHeightCount: 0,
      photosensorPowerCount: 0,
      warrantyStatusOverload: 'Valid',
      overloadLC1Count: 0,
      performedService: 'Keycap replacement',
      cost: 45,
      paymentDetails: 'Pending',
      status: 'Open',
      shippingCompany: 'UPS',
      shippingDate: '2024-07-23',
      shippingAddresses: '456 Oak Ave, Unit 12',
      shippingInformation: 'Tracking #987654321',
    },
    {
      id: '3',
      arrivalDate: '2024-07-22',
      company: 'Electronics Depot',
      companyRepresentative: 'Carlos Ruiz',
      companyContact: 'c.ruiz@electronicsdepot.com',
      note: 'Intermittent cursor movement',
      address: '789 Pine Ln, Suite 300',
      warrantyStatusPhotosensor: 'Valid',
      photosensorHeightCount: 2,
      photosensorPowerCount: 1,
      warrantyStatusOverload: 'Expired',
      overloadLC1Count: 0,
      performedService: 'Reflow solder joints',
      cost: 60,
      paymentDetails: 'Paid',
      status: 'Closed',
      shippingCompany: 'FedEx',
      shippingDate: '2024-07-24',
      shippingAddresses: '789 Pine Ln, Suite 300',
      shippingInformation: 'Tracking #123456789',
    },
  ];

  interface Case {
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

  const [cases, setCases] = useState<Case[]>(mockCases);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleSelect = (id: string) => {
    setSelectedId(prevId => (prevId === id ? null : id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Defected Product Returns</h1>
      <p className="text-gray-600 mb-6">
        Manage and track defected product returns efficiently.
      </p>
      <CasesTable
        data={cases}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
      <EditButton
        selectedRow={cases.find(c => c.id === selectedId) ?? null}
        onAdd={caseFromModal => {
          console.log(caseFromModal);
          setCases(prev => {
            const index = prev.findIndex(c => c.id === caseFromModal.id);
            const updatedCases = [...prev];
            updatedCases[index] = caseFromModal;
            return updatedCases;  
          });
        }}
      />
    </div>
    
  );
}

