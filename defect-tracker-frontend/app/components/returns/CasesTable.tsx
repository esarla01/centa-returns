'use client';

import { FullReturnCase } from "@/lib/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { useState } from "react";
import { Pencil, Trash2 } from 'lucide-react';
import { RequirePermission } from "../RequirePermission";

interface CasesTableProps {
  cases: FullReturnCase[];
  isLoading: boolean;
  onEdit: (c: FullReturnCase) => void;
  onDelete: (c: FullReturnCase) => void;
}

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'Teslim Alındı':
      return 'text-orange-700'; // Orange (legend)
    case 'Teknik İnceleme':
      return 'text-blue-800'; // Blue (legend)
    case 'Dokümantasyon':
      return 'text-yellow-800'; // Yellow (legend)
    case 'Kargoya Veriliyor':
      return 'text-purple-800'; // Purple (legend)
    case 'Tamamlandı':
      return 'text-green-800'; // Green (legend)
    default:
      return 'text-gray-800';
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Teslim Alındı':
      return 'bg-orange-100 hover:bg-orange-200'; // Orange (legend)
    case 'Teknik İnceleme':
      return 'bg-blue-50 hover:bg-blue-100'; // Blue (legend)
    case 'Dokümantasyon':
      return 'bg-yellow-50 hover:bg-yellow-100'; // Yellow (legend)
    case 'Kargoya Veriliyor':
      return 'bg-purple-50 hover:bg-purple-100'; // Purple (legend)
    case 'Tamamlandı':
      return 'bg-green-50 hover:bg-green-100'; // Green (legend)
    default:
      return 'bg-gray-50 hover:bg-gray-100';
  }
};

const canUserEditCase = (userRole: string, caseStatus: string): boolean => {
  switch (caseStatus) {
    case 'Teknik İnceleme':
      return userRole === 'TECHNICIAN';
    case 'Dokümantasyon':
      return userRole === 'SUPPORT';
    case 'Kargoya Veriliyor':
      return userRole === 'SHIPPING' || userRole === 'SALES';
    case 'Tamamlandı':
      return userRole === 'MANAGER';
    default:
      return false;
  }
};

const formatTurkishDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  return `${day} ${months[month]} ${year}`;
};

export default function CasesTable({ cases, isLoading, onEdit, onDelete }: CasesTableProps) {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  const handleCaseSelection = (caseId: number) => {
    setSelectedCaseId(selectedCaseId === caseId ? null : caseId);
  };

  const handleEditClick = (caseItem: FullReturnCase) => {
    if (selectedCaseId === caseItem.id && canUserEditCase(user?.role || '', caseItem.status)) {
      onEdit(caseItem);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-sm">
            <tr>
              <th className="p-4 w-12">
                <span className="sr-only">Seç</span>
              </th>
              <th className="p-4">No</th>
              <th className="p-4">Durum & Atanan</th>
              <th className="p-4 text-orange-700">Müşteri</th>
              <th className="p-4 text-orange-700">Geliş Tarihi</th>
              <th className="p-4 text-orange-700">Teslim Yöntemi</th>
              <th className="p-4 text-orange-700">Notlar</th>
              <th className="p-4 text-blue-800">Ürünler</th>
              <th className="p-4 text-yellow-800">Yapılan Servisler</th>
              <th className="p-4 text-yellow-800">Tutar</th>
              <th className="p-4 text-purple-800">Kargo Bilgisi</th>
              <th className="p-4">Ödeme Durumu</th>
              <th className="p-4">Eylemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm text-center">
            {isLoading ? (
              <tr><td colSpan={14} className="p-4 text-center">Yükleniyor...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={14} className="p-4 text-center">Vaka bulunamadı.</td></tr>
            ) : (
              cases.map((c) => {
                const canEdit = canUserEditCase(user?.role || '', c.status);
                const isSelected = selectedCaseId === c.id;
                const isEditButtonActive = isSelected && canEdit;

                const canDelete = canUserEditCase(user?.role || '', c.status);
                const isDeleteButtonActive = isSelected && canDelete;

                return (
                  <tr key={c.id} className={getStatusStyle(c.status)}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleCaseSelection(c.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-4">{c.id}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div>
                          <span className={`${getStatusTextColor(c.status)} text-sm font-semibold`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {c.assigned_user ? `${c.assigned_user.firstName} ${c.assigned_user.lastName}` : "Atanan yok"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{c.customer?.name}</td>
                    <td className="p-4">{formatTurkishDate(c.arrival_date)}</td>
                    <td className="p-4">{c.receipt_method}</td>
                    <td className="p-4">{c.notes ? c.notes : "(Yok)"}</td>
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div>
                              <span className="font-semibold">{item.product_model?.name}</span>
                              {" "}({item.product_count} adet)
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.product_model?.name} | {item.serial_number && `SN: ${item.serial_number}`} | {item.is_main_product ? "Ana Ürün" : "Aksesuar"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">{c.performed_services ?? "—"}</td>
                    <td className="p-4">{c.cost ?? "—"}</td>
                    <td className="p-4">{c.shipping_info ?? "—"}</td>
                    <td className="p-4">{c.payment_status ?? "—"}</td>
                    <td className="p-4 flex gap-2">
                      <RequirePermission permission="CASE_EDIT" component={true}>
                        <button 
                          onClick={() => handleEditClick(c)}
                          disabled={!isEditButtonActive}
                          className={`mr-2 transition-all duration-200 ${
                            isEditButtonActive 
                              ? 'text-blue-600 hover:text-blue-800 cursor-pointer opacity-100' 
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                          title={!canEdit ? `Bu aşamada ${user?.role} rolü düzenleme yapamaz` : ''}
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                      </RequirePermission>
                      <RequirePermission permission="CASE_DELETE" component={true}>
                        <button 
                          onClick={() => onDelete(c)}
                          disabled={!isDeleteButtonActive}
                          className={`transition-all duration-200 ${
                            isDeleteButtonActive
                              ? 'text-red-500 hover:text-red-700 cursor-pointer opacity-100'
                              : 'text-gray-300 cursor-not-allowed opacity-50'
                          }`}
                          title={!canDelete ? `Bu aşamada ${user?.role} rolü silme yapamaz` : ''}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </RequirePermission>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tablet Table View */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 w-12">
                <span className="sr-only">Seç</span>
              </th>
              <th className="p-4">No</th>
              <th className="p-4">Durum & Atanan</th>
              <th className="p-4 text-orange-700">Müşteri</th>
              <th className="p-4 text-orange-700">Geliş Tarihi</th>
              <th className="p-4 text-orange-700">Teslim Yöntemi</th>
              <th className="p-4 text-orange-700">Notlar</th>
              <th className="p-4 text-blue-800">Ürünler</th>
              <th className="p-4 text-yellow-800">Yapılan Servisler</th>
              <th className="p-4 text-yellow-800">Tutar</th>
              <th className="p-4 text-purple-800">Kargo Bilgisi</th>
              <th className="p-4">Ödeme Durumu</th>
              <th className="p-4">Eylemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={14} className="p-4 text-center">Yükleniyor...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={14} className="p-4 text-center">Vaka bulunamadı.</td></tr>
            ) : (
              cases.map((c) => {
                const canEdit = canUserEditCase(user?.role || '', c.status);
                const isSelected = selectedCaseId === c.id;
                const isEditButtonActive = isSelected && canEdit;

                const canDelete = canUserEditCase(user?.role || '', c.status);
                const isDeleteButtonActive = isSelected && canDelete;

                return (
                  <tr key={c.id} className={getStatusStyle(c.status)}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleCaseSelection(c.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-4">{c.id}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div>
                          <span className={`${getStatusTextColor(c.status)} text-sm font-semibold`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {c.assigned_user ? `${c.assigned_user.firstName} ${c.assigned_user.lastName}` : "Atanan yok"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{c.customer?.name}</td>
                    <td className="p-4">{formatTurkishDate(c.arrival_date)}</td>
                    <td className="p-4">{c.receipt_method}</td>
                    <td className="p-4">{c.notes ? c.notes : "(Yok)"}</td>
                    <td className="p-4">
                      <div className="text-sm">
                        {c.items.length} ürün
                      </div>
                    </td>
                    <td className="p-4">{c.performed_services ?? "—"}</td>
                    <td className="p-4">{c.cost ?? "—"}</td>
                    <td className="p-4">{c.shipping_info ?? "—"}</td>
                    <td className="p-4">{c.payment_status ?? "—"}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleEditClick(c)}
                        disabled={!isEditButtonActive}
                        className={`mr-2 transition-all duration-200 ${
                          isEditButtonActive 
                            ? 'text-blue-600 hover:text-blue-800 cursor-pointer opacity-100' 
                            : 'text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                        title={!canEdit ? `Bu aşamada ${user?.role} rolü düzenleme yapamaz` : ''}
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => onDelete(c)}
                        disabled={!isDeleteButtonActive}
                        className={`transition-all duration-200 ${
                          isDeleteButtonActive
                            ? 'text-red-500 hover:text-red-700 cursor-pointer opacity-100'
                            : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                        title={!canDelete ? `Bu aşamada ${user?.role} rolü silme yapamaz` : ''}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8">Vaka bulunamadı.</div>
        ) : (
          cases.map((c) => {
            const canEdit = canUserEditCase(user?.role || '', c.status);
            const isSelected = selectedCaseId === c.id;
            const isEditButtonActive = isSelected && canEdit;

            const canDelete = canUserEditCase(user?.role || '', c.status);
            const isDeleteButtonActive = isSelected && canDelete;

            return (
              <div key={c.id} className={`bg-white rounded-lg shadow border p-4 space-y-3 ${getStatusStyle(c.status)}`}>
                {/* Header with Checkbox */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleCaseSelection(c.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">#{c.id}</h3>
                      <p className="text-sm text-gray-600">{c.customer?.name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditClick(c)}
                      disabled={!isEditButtonActive}
                      className={`p-1 transition-all duration-200 ${
                        isEditButtonActive 
                          ? 'text-blue-600 hover:text-blue-800 opacity-100' 
                          : 'text-gray-400 opacity-50'
                      }`}
                      title={!canEdit ? `Bu aşamada ${user?.role} rolü düzenleme yapamaz` : ''}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onDelete(c)}
                      disabled={!isDeleteButtonActive}
                      className={`p-1 transition-all duration-200 ${
                        isDeleteButtonActive
                          ? 'text-red-500 hover:text-red-700 opacity-100'
                          : 'text-gray-300 opacity-50'
                      }`}
                      title={!canDelete ? `Bu aşamada ${user?.role} rolü silme yapamaz` : ''}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Status and Assigned User */}
                <div className="space-y-1">
                  <span className={`${getStatusTextColor(c.status)} text-sm font-semibold`}>
                    {c.status}
                  </span>
                  <div className="text-sm text-gray-600">
                    Atanan: {c.assigned_user ? `${c.assigned_user.firstName} ${c.assigned_user.lastName}` : "—"}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Geliş Tarihi:</span>
                    <p>{formatTurkishDate(c.arrival_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Teslim Yöntemi:</span>
                    <p>{c.receipt_method}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tutar:</span>
                    <p>{c.cost ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ödeme Durumu:</span>
                    <p>{c.payment_status ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kargo Bilgisi:</span>
                    <p>{c.shipping_info ?? "—"}</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <span className="text-gray-500 text-sm">Ürünler ({c.items.length}):</span>
                  <div className="mt-1 space-y-1">
                    {c.items.slice(0, 2).map(item => (
                      <div key={item.id} className="text-xs bg-gray-50 p-2 rounded">
                        <span className="font-medium">{item.product_model?.name}</span>
                        <span className="text-gray-500"> ({item.product_count} adet)</span>
                      </div>
                    ))}
                    {c.items.length > 2 && (
                      <div className="text-xs text-gray-500">+{c.items.length - 2} daha...</div>
                    )}
                  </div>
                </div>

                {/* Performed Services */}
                {c.performed_services && (
                  <div>
                    <span className="text-gray-500 text-sm">Yapılan Servisler:</span>
                    <p className="text-sm mt-1">{c.performed_services}</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <span className="text-gray-500 text-sm">Notlar:</span>
                  <p className="text-sm mt-1">{c.notes ? c.notes : "(Yok)"}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}