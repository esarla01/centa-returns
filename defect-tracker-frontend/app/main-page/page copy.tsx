'use client';

import React, { useEffect, useState } from 'react';
import { CasesTable } from '../components/CasesTable';
import EditButton from '../components/EditButton';
import Header from '@/app/components/Header';
import CaseFilter from '@/app/components/Filters';
import { Case } from '@/types/cases';
import { User } from '@/types/user';
import { Permissions } from '@/types/permissions';

export default function MainPage() {
  // State for user and permissions
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  // useEffect(() => {
  //   const userData = localStorage.getItem('user');
  //   const perms = localStorage.getItem('permissions');

  //   if (!userData || !perms) {
  //     // if data missing, redirect to login
  //     window.location.href = '/login';
  //     return;
  //   }

  //   setUser(JSON.parse(userData));
  //   setPermissions(JSON.parse(perms));
  // }, []);

  // State for cases and filters
  const [cases, setCases] = useState<Case[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({
    name: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  // State for selected case ID
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const isFiltered = Object.values(filters).some(value => value !== '');

  // Handler functions
  const handleSelect = (id: number) => {
    setSelectedId(prev => (prev === id ? null : id));
  };
  const handleClearFilters = () => {
    setFilters({ name: '', status: '', dateFrom: '', dateTo: '' });
  };

  // Fetch cases from the API with applied filters
  const fetchCases = async () => {
    try {
      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, val]) => val !== ''))
      ).toString();

      const response = await fetch(`http://localhost:5000/api/retrieve-cases?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setCases(data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => alert('Logging out...')} />

      {/* Page Intro */}
      <div className="px-10 mt-8">
        {/* <h1 className="text-3xl font-bold mb-2">Hoşgeldin {user ? user.first_name : ""}</h1> */}
        <p className="text-lg text-gray-700">
          Bu sayfa, arıza kayıtlarını filtreleme, görüntüleme ve düzenleme işlemleri için bir yönetim paneli sunar.
        </p>
      </div>

      <div className="flex gap-6 mt-6 px-10">
        {/* Filter Panel */}
        <aside className="w-1/4">
          <CaseFilter onApply={setFilters} />
        </aside>

        {/* Table & Actions */}
        <main className="flex-1">
          <div className="flex flex-wrap gap-4 items-center mb-4">
              {/* Sonuç Sayısı */}
              <p className="text-2xl font-bold m-0 ml-2">
                Sonuç Sayısı: {cases.length}
              </p>

              {/* Filter Info & Button */}
              <div
                className={`
                  flex items-center gap-3 transition-all duration-300
                  ${isFiltered ? 'opacity-100 visible' : 'opacity-0 invisible'}
                `}
                style={{ minHeight: '48px' }}
              >
                <div className="flex flex-wrap gap-3 items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow">
                  <p className="font-medium m-0">
                    Filtrelenmiş sonuçlar görüntüleniyor. Tüm kayıtlar gösterilmiyor.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="bg-yellow-300 hover:bg-yellow-400 text-black font-semibold py-1 px-3 rounded transition"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
              </div>
              <CasesTable
                  data={cases}
                  selectedId={selectedId}
                  onSelect={handleSelect}
              />

            {permissions?.can_edit && (
              <div className="mt-4 flex justify-end">     
                <EditButton
                  selectedRow={cases.find(c => c.id === selectedId) ?? null}
                  onAdd={async (editedCase) => {
                    try {
                      const response = await fetch('http://localhost:5000/api/update-case', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editedCase),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.msg || 'Failed to update case');
                      }

                      await fetchCases();
                    } catch (error) {
                      console.error('Error updating case:', error);
                      alert(`Error updating case: ${error}`);
                    }
                  }}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }
