import React, { useState } from 'react';
import NewCaseModal from './EditCaseModal';
import { Case } from '@/types/cases';

interface EditButtonProps {
    selectedRow: Case | null;   
    onAdd: (editedCase: Case) => void;
}

export default function EditButton({ selectedRow, onAdd }: EditButtonProps) {

const [isEditOpen, setIsEditOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsEditOpen(true)}
                disabled={!selectedRow}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-300"
            >
                Düzenle
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