'use client';

import { FullReturnCase } from "@/lib/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { useState } from "react";
import { Pencil, Trash2, X, CheckCircle } from 'lucide-react';
import StageCompletionModal from './StageCompletionModal';
import TeslimAlindiModal from './TeslimAlindiModal';
import TeknikIncelemeModal from './TeknikIncelemeModal';
import DokumantasyonModal from './DokumantasyonModal';
import KargoyaVerildiModal from './KargoyaVerildiModal';
import TamamlandiModal from './TamamlandiModal';


interface CasesTableProps {
  cases: FullReturnCase[];
  isLoading: boolean;
  onEdit: (c: FullReturnCase) => void;
  onDelete: (c: FullReturnCase) => void;
  onRefresh?: () => void; // Optional callback to refresh data
}


const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'Teslim Alındı':
      return 'text-orange-700';
    case 'Teknik İnceleme':
      return 'text-blue-800';
    case 'Dokümantasyon':
      return 'text-yellow-800';
    case 'Kargoya Veriliyor':
      return 'text-purple-800';
    case 'Tamamlandı':
      return 'text-green-800';
    default:
      return 'text-gray-800';
  }
};

const getStatusStyle = (status: string) => {
    switch (status) {
    case 'Teslim Alındı':
      return 'bg-orange-50 hover:bg-orange-100';
    case 'Teknik İnceleme':
      return 'bg-blue-50 hover:bg-blue-100';
    case 'Dokümantasyon':
      return 'bg-yellow-50 hover:bg-yellow-100';
    case 'Kargoya Veriliyor':
      return 'bg-purple-50 hover:bg-purple-100';
    case 'Tamamlandı':
      return 'bg-green-50 hover:bg-green-100';
    default:
      return 'bg-gray-50 hover:bg-gray-100';
  }
};

// Helper function to check if a stage is completed (current status is beyond this stage)
const isStageCompleted = (currentStatus: string, stage: string): boolean => {
  const stageOrder = ['Teslim Alındı', 'Teknik İnceleme', 'Dokümantasyon', 'Kargoya Veriliyor', 'Tamamlandı'];
  const currentIndex = stageOrder.indexOf(currentStatus);
  const stageIndex = stageOrder.indexOf(stage);
  
  if (currentIndex === -1 || stageIndex === -1) return false;
  return currentIndex > stageIndex;
};

const canUserCompleteStage = (userRole: string, caseStatus: string): boolean => {
  switch (caseStatus) {
    case 'Teslim Alındı':
      return userRole === 'SUPPORT';
    case 'Teknik İnceleme':
      return userRole === 'TECHNICIAN';
    case 'Dokümantasyon':
      return userRole === 'SUPPORT';
    case 'Kargoya Veriliyor':
      return userRole === 'SHIPPING';
    case 'Tamamlandı':
      return userRole === 'MANAGER';
    default:
      return false;
  }
};


// Helper function to check if a stage is current (current status matches this stage)
const isCurrentStage = (currentStatus: string, stage: string): boolean => {
  const stageMapping = {
    'teslim_alindi': 'Teslim Alındı',
    'teknik_inceleme': 'Teknik İnceleme',
    'dokumantasyon': 'Dokümantasyon',
    'kargoya_verildi': 'Kargoya Veriliyor',
    'tamamlandi': 'Tamamlandı'
  };
  return stageMapping[stage as keyof typeof stageMapping] === currentStatus;
};

const canUserDeleteCase = (userRole: string, caseStatus: string): boolean => {
  if (caseStatus === 'Teslim Alındı') {
    return userRole === 'SUPPORT';
  }
  return false;
};

const getDeletePermissionMessage = (userRole: string, caseStatus: string): string => {
  if (caseStatus === 'Teslim Alındı') {
    return userRole === 'SUPPORT' ? 'Sil' : 'Sadece DESTEK rolü silebilir';
  }
  return 'Bu durumda silme yapılamaz';
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

export default function CasesTable({ cases, isLoading, onEdit, onDelete, onRefresh }: CasesTableProps) {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [stageCompletionModal, setStageCompletionModal] = useState<{
    isOpen: boolean;
    caseId: number;
    stage: string;
  }>({
    isOpen: false,
    caseId: 0,
    stage: ''
  });

  // Stage-specific modal states
  const [teslimAlindiModal, setTeslimAlindiModal] = useState<{
    isOpen: boolean;
    case: FullReturnCase | null;
  }>({
    isOpen: false,
    case: null
  });

  const [teknikIncelemeModal, setTeknikIncelemeModal] = useState<{
    isOpen: boolean;
    case: FullReturnCase | null;
  }>({
    isOpen: false,
    case: null
  });

  const [dokumantasyonModal, setDokumantasyonModal] = useState<{
    isOpen: boolean;
    case: FullReturnCase | null;
  }>({
    isOpen: false,
    case: null
  });

  const [kargoyaVerildiModal, setKargoyaVerildiModal] = useState<{
    isOpen: boolean;
    case: FullReturnCase | null;
  }>({
    isOpen: false,
    case: null
  });

  const [tamamlandiModal, setTamamlandiModal] = useState<{
    isOpen: boolean;
    case: FullReturnCase | null;
  }>({
    isOpen: false,
    case: null
  });

  const handleCaseSelection = (caseId: number) => {
    setSelectedCaseId(selectedCaseId === caseId ? null : caseId);
  };

  const handleDeleteClick = (caseItem: FullReturnCase) => {
    if (selectedCaseId !== caseItem.id) return;
    onDelete(caseItem);
  };

  const handleStageEdit = (caseItem: FullReturnCase, stage: string) => {
    switch (stage) {
      case 'teslim_alindi':
        setTeslimAlindiModal({ isOpen: true, case: caseItem });
        break;
      case 'teknik_inceleme':
        setTeknikIncelemeModal({ isOpen: true, case: caseItem });
        break;
      case 'dokumantasyon':
        setDokumantasyonModal({ isOpen: true, case: caseItem });
        break;
      case 'kargoya_verildi':
        setKargoyaVerildiModal({ isOpen: true, case: caseItem });
        break;
      case 'tamamlandi':
        setTamamlandiModal({ isOpen: true, case: caseItem });
        break;
      default:
        console.log(`Edit stage: ${stage} for case: ${caseItem.id}`);
        onEdit(caseItem);
    }
  };

  // Helper function to check if a stage can be edited by the current user role
  const canEditStage = (currentStatus: string, stage: string): boolean => {
    const stageMapping = {
      'teslim_alindi': 'Teslim Alındı',
      'teknik_inceleme': 'Teknik İnceleme',
      'dokumantasyon': 'Dokümantasyon',
      'kargoya_verildi': 'Kargoya Veriliyor',
      'tamamlandi': 'Tamamlandı'
    };

    // Define which roles can edit which stages
    const stageEditPermissions: { [key: string]: string[] } = {
      'teslim_alindi': ['SUPPORT'],
      'teknik_inceleme': ['TECHNICIAN'],
      'dokumantasyon': ['SUPPORT'],
      'kargoya_verildi': ['SHIPPING'],
      'tamamlandi': ['MANAGER']
    };

    // Get the mapped stage name
    const mappedStage = stageMapping[stage as keyof typeof stageMapping];
    if (!mappedStage) return false;

    // Only allow editing if the current status is at or beyond this stage
    const stageOrder = ['Teslim Alındı', 'Teknik İnceleme', 'Dokümantasyon', 'Kargoya Veriliyor', 'Tamamlandı'];
    const currentIndex = stageOrder.indexOf(currentStatus);
    const stageIndex = stageOrder.indexOf(mappedStage);

    if (currentIndex === -1 || stageIndex === -1) return false;
    if (currentIndex < stageIndex) return false;

    // Check if the user's role is allowed to edit this stage
    // user?.role is available in the component scope
    // If user is not defined, deny permission
    if (!user?.role) return false;
    const allowedRoles = stageEditPermissions[stage];
    if (!allowedRoles) return false;

    return allowedRoles.includes(user.role);
  };

  const handleStageComplete = (caseItem: FullReturnCase, stage: string) => {
    setStageCompletionModal({
      isOpen: true,
      caseId: caseItem.id,
      stage
    });
  };

  const handleStageCompleteSuccess = () => {
    console.log('CasesTable: handleStageCompleteSuccess called');
    if (onRefresh) {
      console.log('CasesTable: Calling onRefresh callback');
      onRefresh();
    } else {
      console.log('CasesTable: No onRefresh callback provided');
    }
  };

  const closeStageCompletionModal = () => {
    setStageCompletionModal({
      isOpen: false,
      caseId: 0,
      stage: ''
    });
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
              <th className="p-4">Durum</th>
              
              {/* Teslim Alındı Stage - Orange */}
              <th className="p-4 text-orange-700">Müşteri</th>
              <th className="p-4 text-orange-700">Geliş Tarihi</th>
              <th className="p-4 text-orange-700">Teslim Yöntemi</th>
              <th className="p-4 text-orange-700">Notlar</th>
              <th className="p-4 text-orange-700">Teslim Alındı Eylemler</th>
              
              {/* Teknik İnceleme Stage - Blue */}
              <th className="p-4 text-blue-800">Ürünler</th>
              <th className="p-4 text-blue-800">Seri Numarası</th>
              <th className="p-4 text-blue-800">Garanti Durumu</th>
              <th className="p-4 text-blue-800">Hata Sorumluluğu</th>
              <th className="p-4 text-blue-800">Çözüm Yöntemi</th>
              <th className="p-4 text-blue-800">Hizmet</th>
              <th className="p-4 text-blue-800">Kablo Kontrol</th>
              <th className="p-4 text-blue-800">Profil Kontrol</th>
              <th className="p-4 text-blue-800">Paketleme</th>
              <th className="p-4 text-blue-800">Teknik Servis Notu</th>
              <th className="p-4 text-blue-800">Tutar</th>
              <th className="p-4 text-blue-800">Teknik İnceleme Eylemler</th>
              
              {/* Dokümantasyon Stage - Yellow */}
              <th className="p-4 text-yellow-800">Dokümantasyon</th>
              <th className="p-4 text-yellow-800">Dokümantasyon Eylemler</th>
              
              {/* Kargoya Verildi Stage - Purple */}
              <th className="p-4 text-purple-800">Kargo Bilgisi</th>
              <th className="p-4 text-purple-800">Kargo Numarası</th>
              <th className="p-4 text-purple-800">Kargoya Verilme Tarihi</th>
              <th className="p-4 text-purple-800">Kargoya Verildi Eylemler</th>
              
              {/* Tamamlandı Stage */}
              <th className="p-4">Ödeme Durumu</th>
              <th className="p-4">Tamamlandı Eylemler</th>
              
              <th className="p-4">Genel Eylemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm text-center">
            {isLoading ? (
              <tr><td colSpan={28} className="p-4 text-center">Yükleniyor...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={28} className="p-4 text-center">Vaka bulunamadı.</td></tr>
            ) : (
              cases.map((c) => {
                const isSelected = selectedCaseId === c.id;
                const canDelete = canUserDeleteCase(user?.role || '', c.status);
                const isDeleteButtonActive = isSelected && canDelete;

                return (
                  <tr key={c.id} className={getStatusStyle(c.status)}>
                    {/* Selection Checkbox */}
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleCaseSelection(c.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    
                    {/* Case Number */}
                    <td className="p-4">{c.id}</td>
        
                    {/* Status */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div>
                          <span className={`${getStatusTextColor(c.status)} text-sm font-semibold`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Teslim Alındı Stage */}
                    <td className="p-4">{c.customer?.name}</td>
                    <td className="p-4">{formatTurkishDate(c.arrival_date)}</td>
                    <td className="p-4">{c.receipt_method}</td>
                    <td className="p-4">{c.notes ? (c.notes.length > 20 ? `${c.notes.substring(0, 20)}...` : c.notes) : "(Yok)"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStageEdit(c, 'teslim_alindi')}
                          disabled={!canEditStage(c.status, 'teslim_alindi') || !isSelected}
                          className={`transition-colors p-1 rounded ${
                            canEditStage(c.status, 'teslim_alindi') && isSelected
                              ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : canEditStage(c.status, 'teslim_alindi')
                              ? "Teslim Alındı aşamasını düzenle"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStageComplete(c, 'teslim_alindi')}
                          className={`transition-colors p-1 rounded ${
                            isStageCompleted(c.status, 'Teslim Alındı')
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                              : isCurrentStage(c.status, 'teslim_alindi') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!isCurrentStage(c.status, 'teslim_alindi') || !isSelected}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : isStageCompleted(c.status, 'Teslim Alındı') 
                              ? "Teslim Alındı tamamlandı" 
                              : isCurrentStage(c.status, 'teslim_alindi') && canUserCompleteStage(user?.role || '', c.status)
                              ? "Teslim Alındı aşamasını tamamla"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          {isStageCompleted(c.status, 'Teslim Alındı') ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    
                    {/* Teknik İnceleme Stage */}
                    <td className="p-4 min-w-[200px]">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="flex flex-row">
                              <span className="text-xs text-gray-600">
                              <span className="font-semibold">{item.product_model?.name} </span>
                              ({item.product_count} adet{item.has_control_unit ? ", ünite dahil" : ""})
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.serial_number || "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.warranty_status === 'Garanti Dahilinde' ? 'Var' :
                               item.warranty_status === 'Garanti Dışı' ? ' Yok' : "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.fault_responsibility === 'Kullanıcı Hatası' ? 'Kullanıcı Hatası' :
                               item.fault_responsibility === 'Teknik Sorun' ? 'Teknik Sorun' :
                               item.fault_responsibility === 'Karışık' ? 'Karışık' : "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0  pb-1">
                            <div className="text-xs">
                              {item.resolution_method === 'Tamir' ? 'Tamir' :
                               item.resolution_method === 'Değişim' ? 'Değişim' : "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    {/* Hizmet */}
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.service_type || "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    {/* Kablo Kontrol */}
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.cable_check ? "✓" : "✗"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    {/* Profil Kontrol */}
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.profile_check ? "✓" : "✗"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    {/* Paketleme */}
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.packaging ? "✓" : "✗"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    {/* Teknik İnceleme Stage - Teknik Servis Notu */}
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.performed_services || "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">
                      <ul className="space-y-1">
                        {c.items.map(item => (
                          <li key={item.id} className="border-b last:border-b-0 pb-1">
                            <div className="text-xs">
                              {item.cost !== null && item.cost !== undefined ? `₺${item.cost}` : "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    {/* Teknik İnceleme Eylemler */}
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStageEdit(c, 'teknik_inceleme')}
                          disabled={!canEditStage(c.status, 'teknik_inceleme') || !isSelected}
                          className={`transition-colors p-1 rounded ${
                            canEditStage(c.status, 'teknik_inceleme') && isSelected
                              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : canEditStage(c.status, 'teknik_inceleme')
                              ? "Teknik İnceleme aşamasını düzenle"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStageComplete(c, 'teknik_inceleme')}
                          className={`transition-colors p-1 rounded ${
                            isStageCompleted(c.status, 'Teknik İnceleme')
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                              : isCurrentStage(c.status, 'teknik_inceleme') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!isCurrentStage(c.status, 'teknik_inceleme') || !isSelected}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : isStageCompleted(c.status, 'Teknik İnceleme') 
                              ? "Teknik İnceleme tamamlandı" 
                              : isCurrentStage(c.status, 'teknik_inceleme') && canUserCompleteStage(user?.role || '', c.status)
                              ? "Teknik İnceleme aşamasını tamamla"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          {isStageCompleted(c.status, 'Teknik İnceleme') ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    
                    {/* Dokümantasyon Stage */}
                    <td className="p-4">—</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStageEdit(c, 'dokumantasyon')}
                          disabled={!canEditStage(c.status, 'dokumantasyon') || !isSelected}
                          className={`transition-colors p-1 rounded ${
                            canEditStage(c.status, 'dokumantasyon') && isSelected
                              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : canEditStage(c.status, 'dokumantasyon')
                              ? "Dokümantasyon aşamasını düzenle"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStageComplete(c, 'dokumantasyon')}
                          className={`transition-colors p-1 rounded ${
                            isStageCompleted(c.status, 'Dokümantasyon')
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                              : isCurrentStage(c.status, 'dokumantasyon') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!isCurrentStage(c.status, 'dokumantasyon') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : isStageCompleted(c.status, 'Dokümantasyon') 
                              ? "Dokümantasyon tamamlandı" 
                              : isCurrentStage(c.status, 'dokumantasyon') && canUserCompleteStage(user?.role || '', c.status)
                              ? "Dokümantasyon aşamasını tamamla"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          {isStageCompleted(c.status, 'Dokümantasyon') ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    
                    {/* Kargoya Verildi Stage */}
                    <td className="p-4">{c.shipping_info ?? "—"}</td>
                    <td className="p-4">{c.tracking_number ?? "—"}</td>
                    <td className="p-4">{c.shipping_date ? formatTurkishDate(c.shipping_date) : "—"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStageEdit(c, 'kargoya_verildi')}
                          disabled={!canEditStage(c.status, 'kargoya_verildi') || !isSelected}
                          className={`transition-colors p-1 rounded ${
                            canEditStage(c.status, 'kargoya_verildi') && isSelected
                              ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : canEditStage(c.status, 'kargoya_verildi')
                              ? "Kargoya Verildi aşamasını düzenle"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStageComplete(c, 'kargoya_verildi')}
                          className={`transition-colors p-1 rounded ${
                            isStageCompleted(c.status, 'Kargoya Veriliyor')
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                              : isCurrentStage(c.status, 'kargoya_verildi') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!isCurrentStage(c.status, 'kargoya_verildi') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : isStageCompleted(c.status, 'Kargoya Veriliyor') 
                              ? "Kargoya Verildi tamamlandı" 
                              : isCurrentStage(c.status, 'kargoya_verildi') && canUserCompleteStage(user?.role || '', c.status)
                              ? "Kargoya Verildi aşamasını tamamla"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          {isStageCompleted(c.status, 'Kargoya Veriliyor') ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                            </td>
                    
                    {/* Tamamlandı Stage */}
                    <td className="p-4">{c.payment_status ?? "—"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStageEdit(c, 'tamamlandi')}
                          disabled={!canEditStage(c.status, 'tamamlandi') || !isSelected}
                          className={`transition-colors p-1 rounded ${
                            canEditStage(c.status, 'tamamlandi') && isSelected
                              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : canEditStage(c.status, 'tamamlandi')
                              ? "Tamamlandı aşamasını düzenle"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStageComplete(c, 'tamamlandi')}
                          className={`transition-colors p-1 rounded ${
                            isStageCompleted(c.status, 'Tamamlandı')
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                              : isCurrentStage(c.status, 'tamamlandi') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!isCurrentStage(c.status, 'tamamlandi') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : isStageCompleted(c.status, 'Tamamlandı') 
                              ? "Tamamlandı" 
                              : isCurrentStage(c.status, 'tamamlandi') && canUserCompleteStage(user?.role || '', c.status)
                              ? "Tamamlandı aşamasını tamamla"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          {isStageCompleted(c.status, 'Tamamlandı') ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                                </div>
                            </td>
                    
                    {/* Actions */}
                    <td className="p-4">                     
                      <button 
                        onClick={() => handleDeleteClick(c)}
                        disabled={!isDeleteButtonActive}
                        className={`transition-all duration-200 ${
                          isDeleteButtonActive
                            ? 'text-red-500 hover:text-red-700 cursor-pointer opacity-100'
                            : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                        title={getDeletePermissionMessage(user?.role || '', c.status)}
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
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8">Vaka bulunamadı.</div>
        ) : (
          cases.map((c) => {
            const isSelected = selectedCaseId === c.id;
            const canDelete = canUserDeleteCase(user?.role || '', c.status);
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
                      onClick={() => handleDeleteClick(c)}
                      disabled={!isDeleteButtonActive}
                      className={`p-1 transition-all duration-200 ${
                        isDeleteButtonActive
                          ? 'text-red-500 hover:text-red-700 opacity-100'
                          : 'text-gray-300 opacity-50'
                      }`}
                      title={getDeletePermissionMessage(user?.role || '', c.status)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <span className={`${getStatusTextColor(c.status)} text-sm font-semibold`}>
                    {c.status}
                  </span>
                </div>

                {/* Stage Completion Status with Edit Buttons */}
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div className="flex items-center space-x-1">
                      <span className="text-orange-700 font-semibold">Teslim Alındı:</span>
                      <span>{isStageCompleted(c.status, 'Teslim Alındı') ? "✅" : isCurrentStage(c.status, 'teslim_alindi') ? "🔄" : "❌"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStageEdit(c, 'teslim_alindi')}
                        disabled={!canEditStage(c.status, 'teslim_alindi') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          canEditStage(c.status, 'teslim_alindi') && isSelected
                            ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : canEditStage(c.status, 'teslim_alindi')
                            ? "Teslim Alındı aşamasını düzenle"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleStageComplete(c, 'teslim_alindi')}
                        disabled={!isCurrentStage(c.status, 'teslim_alindi') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          isStageCompleted(c.status, 'Teslim Alındı')
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                            : isCurrentStage(c.status, 'teslim_alindi') && isSelected
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : isStageCompleted(c.status, 'Teslim Alındı') 
                            ? "Teslim Alındı tamamlandı" 
                            : isCurrentStage(c.status, 'teslim_alindi')
                            ? "Teslim Alındı aşamasını tamamla"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        {isStageCompleted(c.status, 'Teslim Alındı') ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-800 font-semibold">Teknik İnceleme:</span>
                      <span>{isStageCompleted(c.status, 'Teknik İnceleme') ? "✅" : isCurrentStage(c.status, 'teknik_inceleme') ? "🔄" : "❌"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStageEdit(c, 'teknik_inceleme')}
                        disabled={!canEditStage(c.status, 'teknik_inceleme') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          canEditStage(c.status, 'teknik_inceleme') && isSelected
                            ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : canEditStage(c.status, 'teknik_inceleme')
                            ? "Teknik İnceleme aşamasını düzenle"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleStageComplete(c, 'teknik_inceleme')}
                        disabled={!isCurrentStage(c.status, 'teknik_inceleme') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          isStageCompleted(c.status, 'Teknik İnceleme')
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                            : isCurrentStage(c.status, 'teknik_inceleme') && isSelected
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : isStageCompleted(c.status, 'Teknik İnceleme') 
                            ? "Teknik İnceleme tamamlandı" 
                            : isCurrentStage(c.status, 'teknik_inceleme')
                            ? "Teknik İnceleme aşamasını tamamla"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        {isStageCompleted(c.status, 'Teknik İnceleme') ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-800 font-semibold">Dokümantasyon:</span>
                      <span>{isStageCompleted(c.status, 'Dokümantasyon') ? "✅" : isCurrentStage(c.status, 'dokumantasyon') ? "🔄" : "❌"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStageEdit(c, 'dokumantasyon')}
                        disabled={!canEditStage(c.status, 'dokumantasyon') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          canEditStage(c.status, 'dokumantasyon') && isSelected
                            ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : canEditStage(c.status, 'dokumantasyon')
                            ? "Dokümantasyon aşamasını düzenle"
                            : "Bu aşama henüz aktif değil"
                          }
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleStageComplete(c, 'dokumantasyon')}
                        disabled={!isCurrentStage(c.status, 'dokumantasyon') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          isStageCompleted(c.status, 'Dokümantasyon')
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                            : isCurrentStage(c.status, 'dokumantasyon') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : isStageCompleted(c.status, 'Dokümantasyon') 
                            ? "Dokümantasyon tamamlandı" 
                            : isCurrentStage(c.status, 'dokumantasyon') && canUserCompleteStage(user?.role || '', c.status)
                            ? "Dokümantasyon aşamasını tamamla"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        {isStageCompleted(c.status, 'Dokümantasyon') ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div className="flex items-center space-x-1">
                      <span className="text-purple-800 font-semibold">Kargoya Verildi:</span>
                      <span>{isStageCompleted(c.status, 'Kargoya Veriliyor') ? "✅" : isCurrentStage(c.status, 'kargoya_verildi') ? "🔄" : "❌"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStageEdit(c, 'kargoya_verildi')}
                        disabled={!canEditStage(c.status, 'kargoya_verildi') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          canEditStage(c.status, 'kargoya_verildi') && isSelected
                            ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : canEditStage(c.status, 'kargoya_verildi')
                            ? "Kargoya Verildi aşamasını düzenle"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleStageComplete(c, 'kargoya_verildi')}
                        disabled={!isCurrentStage(c.status, 'kargoya_verildi') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          isStageCompleted(c.status, 'Kargoya Veriliyor')
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                            : isCurrentStage(c.status, 'kargoya_verildi') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : isStageCompleted(c.status, 'Kargoya Veriliyor') 
                            ? "Kargoya Verildi tamamlandı" 
                            : isCurrentStage(c.status, 'kargoya_verildi') && canUserCompleteStage(user?.role || '', c.status)
                            ? "Kargoya Verildi aşamasını tamamla"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        {isStageCompleted(c.status, 'Kargoya Veriliyor') ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">Tamamlandı:</span>
                      <span>{isStageCompleted(c.status, 'Tamamlandı') ? "✅" : isCurrentStage(c.status, 'tamamlandi') ? "🔄" : "❌"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStageEdit(c, 'tamamlandi')}
                        disabled={!canEditStage(c.status, 'tamamlandi') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          canEditStage(c.status, 'tamamlandi') && isSelected
                            ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : canEditStage(c.status, 'tamamlandi')
                            ? "Tamamlandı aşamasını düzenle"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleStageComplete(c, 'tamamlandi')}
                        disabled={!isCurrentStage(c.status, 'tamamlandi') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          isStageCompleted(c.status, 'Tamamlandı')
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                            : isCurrentStage(c.status, 'tamamlandi') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                            : isStageCompleted(c.status, 'Tamamlandı') 
                            ? "Tamamlandı" 
                            : isCurrentStage(c.status, 'tamamlandi') && canUserCompleteStage(user?.role || '', c.status)
                            ? "Tamamlandı aşamasını tamamla"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        {isStageCompleted(c.status, 'Tamamlandı') ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
                                            <p>{c.items.length > 0 ? c.items.map(item => item.cost !== null && item.cost !== undefined ? `₺${item.cost}` : "—").join(", ") : "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ödeme Durumu:</span>
                    <p>{c.payment_status ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kargo Bilgisi:</span>
                    <p>{c.shipping_info ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kargo Numarası:</span>
                    <p>{c.tracking_number ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kargoya Verilme Tarihi:</span>
                    <p>{c.shipping_date ? formatTurkishDate(c.shipping_date) : "—"}</p>
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
                        <div className="text-gray-400 mt-1">
                          <span className="mr-2">
                            <strong>Seri No:</strong> {item.serial_number || "—"}
                          </span>
                          <span className="mr-2">
                            {item.warranty_status === 'Garanti Dahilinde' ? '✅ Garanti Dahilinde' :
                             item.warranty_status === 'Garanti Dışı' ? '❌ Garanti Dışı' : '—'}
                          </span>
                          <span className="mr-2">
                            {item.fault_responsibility === 'Kullanıcı Hatası' ? '👤 Kullanıcı Hatası' :
                             item.fault_responsibility === 'Teknik Sorun' ? '🔧 Teknik Sorun' :
                             item.fault_responsibility === 'Karışık' ? '🔄 Karışık' : "—"}
                          </span>
                          <span>
                            {item.resolution_method === 'Tamir' ? '🔨 Tamir' :
                             item.resolution_method === 'Değişim' ? '🔄 Değişim' : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {c.items.length > 2 && (
                      <div className="text-xs text-gray-500">+{c.items.length - 2} daha...</div>
                    )}
                  </div>
                </div>

                {/* Performed Services */}
                {c.items.some(item => item.performed_services) && (
                  <div>
                                            <span className="text-gray-500 text-sm">Teknik Servis Notu:</span>
                    <p className="text-sm mt-1">{c.items.filter(item => item.performed_services).map(item => item.performed_services).join(", ")}</p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <span className="text-gray-500 text-sm">Notlar:</span>
                  <p className="text-sm mt-1">{c.notes ? (c.notes.length > 10 ? `${c.notes.substring(0, 10)}...` : c.notes) : "(Yok)"}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stage Completion Modal */}
      <StageCompletionModal
        isOpen={stageCompletionModal.isOpen}
        onClose={closeStageCompletionModal}
        stage={stageCompletionModal.stage}
        caseId={stageCompletionModal.caseId}
        onSuccess={handleStageCompleteSuccess}
      />

      {/* Stage-specific Modals */}
      {teslimAlindiModal.isOpen && teslimAlindiModal.case && (
        <TeslimAlindiModal
          returnCase={teslimAlindiModal.case}
          onClose={() => setTeslimAlindiModal({ isOpen: false, case: null })}
          onSuccess={handleStageCompleteSuccess}
        />
      )}

      {teknikIncelemeModal.isOpen && teknikIncelemeModal.case && (
        <TeknikIncelemeModal
          returnCase={teknikIncelemeModal.case}
          onClose={() => setTeknikIncelemeModal({ isOpen: false, case: null })}
          onSuccess={handleStageCompleteSuccess}
        />
      )}

      {dokumantasyonModal.isOpen && dokumantasyonModal.case && (
        <DokumantasyonModal
          returnCase={dokumantasyonModal.case}
          onClose={() => setDokumantasyonModal({ isOpen: false, case: null })}
          onSuccess={handleStageCompleteSuccess}
        />
      )}

      {kargoyaVerildiModal.isOpen && kargoyaVerildiModal.case && (
        <KargoyaVerildiModal
          returnCase={kargoyaVerildiModal.case}
          onClose={() => setKargoyaVerildiModal({ isOpen: false, case: null })}
          onSuccess={handleStageCompleteSuccess}
        />
      )}

      {tamamlandiModal.isOpen && tamamlandiModal.case && (
        <TamamlandiModal
          returnCase={tamamlandiModal.case}
          onClose={() => setTamamlandiModal({ isOpen: false, case: null })}
          onSuccess={handleStageCompleteSuccess}
        />
      )}
        </div>
    );
}