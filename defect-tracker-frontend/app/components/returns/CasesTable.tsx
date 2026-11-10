'use client';

import { FullReturnCase } from "@/lib/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { useState } from "react";
import { Pencil, Trash2, X, CheckCircle, Mail, Eye } from 'lucide-react';
import StageCompletionModal from './StageCompletionModal';
import TeslimAlindiModal from './TeslimAlindiModal';
import TeknikIncelemeModal from './TeknikIncelemeModal';
import OdemeTahsilatiModal from './OdemeTahsilatiModal';
import KargoyaVerildiModal from './KargoyaVerildiModal';
import TamamlandiModal from './TamamlandiModal';
import ViewReturnCaseModal from './ViewReturnCaseModal';
import EmailCustomerModal from './EmailCustomerModal';
import { truncateTextWithEllipsis, formatCurrency } from "@/lib/utils";


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
    case 'Ödeme Tahsilatı':
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
    case 'Ödeme Tahsilatı':
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
  const stageOrder = ['Teslim Alındı', 'Teknik İnceleme', 'Ödeme Tahsilatı', 'Kargoya Veriliyor', 'Tamamlandı'];
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
    case 'Ödeme Tahsilatı':
      return userRole === 'SALES';
    case 'Kargoya Veriliyor':
      return userRole === 'LOGISTICS';
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
    'odeme_tahsilati': 'Ödeme Tahsilatı',
    'kargoya_verildi': 'Kargoya Veriliyor',
    'tamamlandi': 'Tamamlandı'
  };
  return stageMapping[stage as keyof typeof stageMapping] === currentStatus;
};

const canUserDeleteCase = (userRole: string, caseStatus: string): boolean => {
  const deletableStatuses = ['Teslim Alındı', 'Teknik İnceleme'];
  const allowedRoles = ['SUPPORT', 'MANAGER', 'ADMIN'];
  return deletableStatuses.includes(caseStatus) && allowedRoles.includes(userRole);
};

const canUserEmailCustomer = (userRole: string, caseStatus: string): boolean => {
  if (caseStatus === 'Tamamlandı') {
    return userRole === 'LOGISTICS';
  }
  return false;
};

const getDeletePermissionMessage = (userRole: string, caseStatus: string): string => {
  const deletableStatuses = ['Teslim Alındı', 'Teknik İnceleme'];
  if (!deletableStatuses.includes(caseStatus)) {
    return 'Bu durumda silme yapılamaz';
  }
  return ['SUPPORT', 'MANAGER', 'ADMIN'].includes(userRole)
    ? 'Sil'
    : 'Sadece DESTEK, YÖNETİCİ veya ADMIN rolü silebilir';
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

  const [odemeTahsilatiModal, setOdemeTahsilatiModal] = useState<{
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

  const [viewModal, setViewModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });

  const [emailCustomerModal, setEmailCustomerModal] = useState<{
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
      case 'odeme_tahsilati':
        setOdemeTahsilatiModal({ isOpen: true, case: caseItem });
        break;
      case 'kargoya_verildi':
        setKargoyaVerildiModal({ isOpen: true, case: caseItem });
        break;
      case 'tamamlandi':
        setTamamlandiModal({ isOpen: true, case: caseItem });
        break;
      default:
        onEdit(caseItem);
    }
  };

  // Helper function to check if a stage can be edited by the current user role
  const canEditStage = (currentStatus: string, stage: string): boolean => {
    const stageMapping = {
      'teslim_alindi': 'Teslim Alındı',
      'teknik_inceleme': 'Teknik İnceleme',
      'odeme_tahsilati': 'Ödeme Tahsilatı',
      'kargoya_verildi': 'Kargoya Veriliyor',
      'tamamlandi': 'Tamamlandı'
    };

    // Define which roles can edit which stages
    const stageEditPermissions: { [key: string]: string[] } = {
      'teslim_alindi': ['SUPPORT'],
      'teknik_inceleme': ['TECHNICIAN'],
      'odeme_tahsilati': ['SALES'],
      'kargoya_verildi': ['LOGISTICS'],
      'tamamlandi': ['MANAGER']
    };

    // Get the mapped stage name
    const mappedStage = stageMapping[stage as keyof typeof stageMapping];
    if (!mappedStage) return false;

    // Only allow editing if the current status is at or beyond this stage
    const stageOrder = ['Teslim Alındı', 'Teknik İnceleme', 'Ödeme Tahsilatı', 'Kargoya Veriliyor', 'Tamamlandı'];
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
    if (onRefresh) {
      onRefresh();
    }
  };

  const closeStageCompletionModal = () => {
    setStageCompletionModal({
      isOpen: false,
      caseId: 0,
      stage: ''
    });
  };

  const handleEmailCustomer = (caseItem: FullReturnCase) => {
    setEmailCustomerModal({ isOpen: true, case: caseItem });
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
              <th className="p-4 text-blue-800 min-w-[200px]">Arza Tespiti</th>
              <th className="p-4 text-blue-800">Toplam Tutar</th>
              <th className="p-4 text-blue-800">Teknik İnceleme Eylemler</th>
              
              {/* Ödeme Tahsilatı Stage - Yellow */}
              <th className="p-4 text-yellow-800">Ödeme Durumu</th>
              <th className="p-4 text-yellow-800">Ödeme Tahsilatı Eylemler</th>
              
              {/* Kargoya Verildi Stage - Purple */}
              <th className="p-4 text-purple-800">Kargo Bilgisi</th>
              <th className="p-4 text-purple-800">Kargo Numarası</th>
              <th className="p-4 text-purple-800">Kargoya Verilme Tarihi</th>
              <th className="p-4 text-purple-800">Kargoya Verildi Eylemler</th>
              

              
              <th className="p-4">Genel Eylemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm text-center">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="p-4 text-start pl-125">Yükleniyor...</td>
                <td colSpan={14} className="p-4 text-start pl-150">Yükleniyor...</td>
              </tr>
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-start pl-125">Vaka bulunamadı.</td>
                <td colSpan={14} className="p-4 text-start pl-150">Vaka bulunamadı.</td>
                </tr>
            ) : (
              cases.map((c) => {
                const isSelected = selectedCaseId === c.id;
                const canDelete = canUserDeleteCase(user?.role || '', c.status);
                const canEmail = canUserEmailCustomer(user?.role || '', c.status);
                const isDeleteButtonActive = isSelected && canDelete;
                const isViewButtonActive = isSelected;
                const isEmailButtonActive = isSelected && canEmail;
                // const isEmailButtonActive = isSelected;


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
                      {c.items.length > 0 ? (
                        <ul className="space-y-1">
                          {c.items.map(item => (
                            <li key={item.id} className="border-b last:border-b-0 pb-1">
                              <div className="flex flex-row">
                                <span className="text-xs text-gray-600">
                                <span className="font-semibold">{item.product_model?.name || "—"} </span>
                                {item.product_count ? `(${item.product_count} adet${item.has_control_unit ? ", ünite dahil" : ""})` : ""}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </td>
                    <td className="p-4">
                      {c.items.length > 0 ? (
                        <ul className="space-y-1">
                          {c.items.map(item => (
                            <li key={item.id} className="border-b last:border-b-0 pb-1">
                              <div className="text-xs">
                                {item.production_date || "—"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </td>
                    <td className="p-4">
                      {c.items.length > 0 ? (
                        <ul className="space-y-1">
                          {c.items.map(item => (
                            <li key={item.id} className="border-b last:border-b-0 pb-1">
                              <div className="text-xs">
                                {item.warranty_status === 'Garanti Dahilinde' ? 'Var' :
                                 item.warranty_status === 'Garanti Dışı' ? 'Yok' : "—"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </td>
                    <td className="p-4">
                      {c.items.length > 0 ? (
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
                      ) : (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </td>
                    <td className="p-4">
                      {c.items.length > 0 ? (
                        <ul className="space-y-1">
                          {c.items.map(item => (
                            <li key={item.id} className="border-b last:border-b-0  pb-1">
                              <div className="text-xs">
                                {item.resolution_method || "—"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </td>

                    {/* Arza Tespiti/Hizmetleri */}
                    <td className="p-4 min-w-[200px]">
                      {c.items.length > 0 ? (
                        <ul className="space-y-1">
                          {c.items.map(item => (
                            <li key={item.id} className="border-b last:border-b-0 pb-1">
                              <div className="text-xs">
                                {item.services && item.services.length > 0 ? (
                                  <div className="space-y-1">
                                    {item.services.filter(service => service.is_performed).slice(0, 2).map(service => (
                                      <div key={service.id} className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-700">{service.service_name}</span>
                                      </div>
                                    ))}
                                    {item.services.filter(service => service.is_performed).length > 2 && (
                                      <div className="text-gray-500 text-xs">
                                        +{item.services.filter(service => service.is_performed).length - 2} daha...
                                      </div>
                                    )}
                                    {item.services.filter(service => service.is_performed).length === 0 && (
                                      <span className="text-gray-500">Hizmet seçilmemiş</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Hizmet bilgisi yok</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-500">—</div>
                      )}
                    </td>

                    {/* Toplam Tutar */}
                    <td className="p-4">
                      <div className="text-sm font-semibold text-blue-600">
                        {formatCurrency(c.cost)}
                      </div>
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
                    
                    {/* Ödeme Tahsilatı Stage */}
                    <td className="p-4">{c.payment_status ?? "—"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStageEdit(c, 'odeme_tahsilati')}
                          disabled={!canEditStage(c.status, 'odeme_tahsilati') || !isSelected}
                          className={`transition-colors p-1 rounded ${
                            canEditStage(c.status, 'odeme_tahsilati') && isSelected
                              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : canEditStage(c.status, 'odeme_tahsilati')
                              ? "Ödeme Tahsilatı aşamasını düzenle"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStageComplete(c, 'odeme_tahsilati')}
                          className={`transition-colors p-1 rounded ${
                            isStageCompleted(c.status, 'Ödeme Tahsilatı')
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                              : isCurrentStage(c.status, 'odeme_tahsilati') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!isCurrentStage(c.status, 'odeme_tahsilati') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                          title={
                            !isSelected
                              ? "Önce vakayı seçin"
                              : isStageCompleted(c.status, 'Ödeme Tahsilatı') 
                              ? "Ödeme Tahsilatı tamamlandı" 
                              : isCurrentStage(c.status, 'odeme_tahsilati') && canUserCompleteStage(user?.role || '', c.status)
                              ? "Ödeme Tahsilatı aşamasını tamamla"
                              : "Bu aşama henüz aktif değil"
                          }
                        >
                          {isStageCompleted(c.status, 'Ödeme Tahsilatı') ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    
                    {/* Kargoya Verildi Stage */}
                    <td className="p-4">{truncateTextWithEllipsis(c.shipping_info, 30) || "—"}</td>
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
                    
                    {/* Actions */}
                    <td className="p-4">  
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => setViewModal({ isOpen: true, case: c })}
                          disabled={!isViewButtonActive}
                          className={`transition-all duration-200 ${
                            isViewButtonActive
                              ? 'text-blue-600 hover:text-blue-800 cursor-pointer opacity-100'
                              : 'text-gray-300 cursor-not-allowed opacity-50'
                          }`}
                          title="Görüntüle"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEmailCustomer(c)}
                          disabled={!isEmailButtonActive}
                          className={`transition-all duration-200 ${
                            isEmailButtonActive
                              ? 'text-blue-600 hover:text-blue-800 cursor-pointer opacity-100'
                              : 'text-gray-300 cursor-not-allowed opacity-50'
                          }`}
                          title="Müşteriye e-posta gönder"
                        >
                          <Mail className="h-5 w-5" />
                        </button>
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
                        
                      </div>
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
            const isViewButtonActive = isSelected;

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
                      onClick={() => setViewModal({ isOpen: true, case: c })}
                      disabled={!isViewButtonActive}
                      className={`p-1 transition-all duration-200 ${
                        isViewButtonActive
                          ? 'text-blue-600 hover:text-blue-800 opacity-100'
                          : 'text-gray-300 opacity-50'
                      }`}
                      title="Görüntüle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 105.197 11.16l3.646 3.647a.75.75 0 101.06-1.061l-3.646-3.646A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
                      </svg>
                    </button>
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
                                      <span className="text-yellow-800 font-semibold">Ödeme Tahsilatı:</span>
                <span>{isStageCompleted(c.status, 'Ödeme Tahsilatı') ? "✅" : isCurrentStage(c.status, 'odeme_tahsilati') ? "🔄" : "❌"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStageEdit(c, 'odeme_tahsilati')}
                        disabled={!canEditStage(c.status, 'odeme_tahsilati') || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          canEditStage(c.status, 'odeme_tahsilati') && isSelected
                            ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                                                      : canEditStage(c.status, 'odeme_tahsilati')
                          ? "Ödeme Tahsilatı aşamasını düzenle"
                            : "Bu aşama henüz aktif değil"
                          }
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleStageComplete(c, 'odeme_tahsilati')}
                        disabled={!isCurrentStage(c.status, 'odeme_tahsilati') || !canUserCompleteStage(user?.role || '', c.status) || !isSelected}
                        className={`transition-colors p-1 rounded ${
                          isStageCompleted(c.status, 'Ödeme Tahsilatı')
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                            : isCurrentStage(c.status, 'odeme_tahsilati') && canUserCompleteStage(user?.role || '', c.status) && isSelected
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !isSelected
                            ? "Önce vakayı seçin"
                                                        : isStageCompleted(c.status, 'Ödeme Tahsilatı')
                            ? "Ödeme Tahsilatı tamamlandı" 
                            : isCurrentStage(c.status, 'odeme_tahsilati') && canUserCompleteStage(user?.role || '', c.status)
                            ? "Ödeme Tahsilatı aşamasını tamamla"
                            : "Bu aşama henüz aktif değil"
                        }
                      >
                        {isStageCompleted(c.status, 'Ödeme Tahsilatı') ? (
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
                    <span className="text-gray-500">Yedek Parça:</span>
                    <p>{formatCurrency(c.yedek_parca)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Bakım:</span>
                    <p>{formatCurrency(c.bakim)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">İşçilik:</span>
                    <p>{formatCurrency(c.iscilik)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Toplam Tutar:</span>
                    <p className="font-semibold text-blue-600">{formatCurrency(c.cost)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ödeme Durumu:</span>
                    <p>{c.payment_status ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kargo Bilgisi:</span>
                    <p>{truncateTextWithEllipsis(c.shipping_info, 40) || "—"}</p>
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
                  {c.items.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {c.items.slice(0, 2).map(item => (
                        <div key={item.id} className="text-xs bg-gray-50 p-2 rounded">
                          <span className="font-medium">{item.product_model?.name || "—"}</span>
                          <span className="text-gray-500"> ({item.product_count || 0} adet)</span>
                          <div className="text-gray-400 mt-1">
                            <span className="mr-2">
                              <strong>Üretim Tarihi:</strong> {item.production_date || "—"}
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
                            <span className="mr-2">
                              {item.resolution_method === 'Tamir' ? '🔨 Tamir' :
                               item.resolution_method === 'Bedelsiz Değişim' ? '🎁 Bedelsiz Değişim' :
                               item.resolution_method === 'Eski Ürün (Yok)' ? '❌ Eski Ürün (Yok)' :
                               item.resolution_method === 'Bilinmiyor' ? '❓ Bilinmiyor' : "—"}
                            </span>
                          </div>
                         
                        </div>
                      ))}
                      {c.items.length > 2 && (
                        <div className="text-xs text-gray-500">+{c.items.length - 2} daha...</div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-500">—</div>
                  )}
                </div>

                {/* Performed Services */}
                {c.performed_services && (
                  <div>
                    <span className="text-gray-500 text-sm">Teknik Servis Notu:</span>
                    <p className="text-sm mt-1">{c.performed_services.length > 50 ? `${c.performed_services.substring(0, 50)}...` : c.performed_services}</p>
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

      {odemeTahsilatiModal.isOpen && odemeTahsilatiModal.case && (
        <OdemeTahsilatiModal
          returnCase={odemeTahsilatiModal.case}
          onClose={() => setOdemeTahsilatiModal({ isOpen: false, case: null })}
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

      {viewModal.isOpen && viewModal.case && (
        <ViewReturnCaseModal
          returnCase={viewModal.case}
          onClose={() => setViewModal({ isOpen: false, case: null })}
        />
      )}

      {emailCustomerModal.isOpen && emailCustomerModal.case && (
        <EmailCustomerModal
          returnCase={emailCustomerModal.case}
          onClose={() => setEmailCustomerModal({ isOpen: false, case: null })}
          onSuccess={handleStageCompleteSuccess}
        />
      )}
        </div>
    );
}