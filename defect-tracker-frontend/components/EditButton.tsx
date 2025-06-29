import React, { useState } from 'react';
import NewCaseModal from './EditCaseModal';

interface EditButtonProps {
    selectedRow: {
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
    } | null;
    onAdd: (newCase: {
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
    }) => void;
}

export default function EditButton({ selectedRow, onAdd }: EditButtonProps) {

const [isEditOpen, setIsEditOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsEditOpen(true)}
                disabled={!selectedRow}
                className="absolute bottom-0 right-0 px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-300"
            >
                Edit
            </button> 
            {isEditOpen && selectedRow &&
                // EditButton.tsx
                <NewCaseModal
                selectedRow={selectedRow}
                onClose={() => setIsEditOpen(false)}
                onSave={editedCase => {
                    onAdd(editedCase);
                    setIsEditOpen(false);
                }}
                />

            }
        </div>
    );
}