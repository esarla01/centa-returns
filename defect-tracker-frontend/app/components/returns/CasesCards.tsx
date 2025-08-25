'use client';

import { useState } from 'react';
import { Package, Calendar, User, Building2, Eye, Pencil, CheckCircle, Trash2, Mail } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import { cn } from '@/lib/utils';
import TeslimAlindiModal from './TeslimAlindiModal';
import TeknikIncelemeModal from './TeknikIncelemeModal';
import OdemeTahsilatiModal from './OdemeTahsilatiModal';
import KargoyaVerildiModal from './KargoyaVerildiModal';
import TamamlandiModal from './TamamlandiModal';
import StageCompletionModal from './StageCompletionModal';
import ViewReturnCaseModal from './ViewReturnCaseModal';
import EmailCustomerModal from './EmailCustomerModal';

interface CasesCardsProps {
  cases: FullReturnCase[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  user: any; // Add user prop for permission checks
  onDelete: (returnCase: FullReturnCase) => void;
  onRefresh: () => void;
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Teslim Alındı': return 'bg-orange-100 text-orange-800';
    case 'Teknik İnceleme': return 'bg-blue-100 text-blue-800';
    case 'Ödeme Tahsilatı': return 'bg-yellow-100 text-yellow-800';
    case 'Kargoya Veriliyor': return 'bg-purple-100 text-purple-800';
    case 'Tamamlandı': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function CasesCards({
  cases,
  isLoading,
  hasActiveFilters,
  user,
  onDelete,
  onRefresh
}: CasesCardsProps) {
  // Modal states
  const [teslimAlindiModal, setTeslimAlindiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [teknikIncelemeModal, setTeknikIncelemeModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [odemeTahsilatiModal, setOdemeTahsilatiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [kargoyaVerildiModal, setKargoyaVerildiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [tamamlandiModal, setTamamlandiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [stageCompletionModal, setStageCompletionModal] = useState<{ isOpen: boolean; case: FullReturnCase | null; stage: string }>({ isOpen: false, case: null, stage: '' });
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [emailCustomerModal, setEmailCustomerModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });

  // Helper function: a stage is editable only if the user has permission to edit the return case at that stage.
  const canEditStage = (currentStatus: string, stage: string): boolean => {
    const editableStages = ['teslim_alindi', 'teknik_inceleme', 'odeme_tahsilati', 'kargoya_verildi'];
    if (!editableStages.includes(stage)) return false;

    // Map stage to status and required role
    const stageRoleMap: { [key: string]: { status: string, role: string } } = {
      'teslim_alindi': { status: 'Teslim Alındı', role: 'SUPPORT' },
      'teknik_inceleme': { status: 'Teknik İnceleme', role: 'TECHNICIAN' },
      'odeme_tahsilati': { status: 'Ödeme Tahsilatı', role: 'SALES' },
      'kargoya_verildi': { status: 'Kargoya Veriliyor', role: 'LOGISTICS' }
    };

    const mapping = stageRoleMap[stage];
    if (!mapping) return false;

    // User must have the required role and the case must be at the exact stage
    if (!user?.role) return false;
    if (user.role !== mapping.role) return false;
    if (currentStatus !== mapping.status) return false;

    return true;
  };

  // Check if user can edit the current stage of a case
  const canEditCase = (returnCase: FullReturnCase): boolean => {
    const stageMapping = {
      'Teslim Alındı': 'teslim_alindi',
      'Teknik İnceleme': 'teknik_inceleme',
      'Ödeme Tahsilatı': 'odeme_tahsilati',
      'Kargoya Veriliyor': 'kargoya_verildi',
      'Tamamlandı': 'tamamlandi'
    };

    const currentStage = stageMapping[returnCase.status as keyof typeof stageMapping];
    if (!currentStage) return false;

    // Check if user can edit this specific current stage
    return canEditStage(returnCase.status, currentStage);
  };

  // Update the canDeleteCase function to be more explicit
  const canDeleteCase = (returnCase: FullReturnCase): boolean => {
    // Only SUPPORT users can delete cases
    if (user?.role !== 'SUPPORT') return false;
    
    // Only cases at "Teslim Alındı" stage can be deleted
    if (returnCase.status !== 'Teslim Alındı') return false;
    
    return true;
  };

  // Check if user can email customer (LOGISTICS role for Tamamlandı stage)
  const canUserEmailCustomer = (userRole: string, caseStatus: string): boolean => {
    if (caseStatus === 'Tamamlandı') {
      return userRole === 'LOGISTICS';
    }
    return false;
  };

  // Check if user can complete the current stage of a case
  const canCompleteStage = (returnCase: FullReturnCase): boolean => {
    // Only users who can edit the current stage can complete it
    return canEditCase(returnCase);
  };

  // Get the stage key for stage completion
  const getStageKey = (status: string): string => {
    const stageMapping = {
      'Teslim Alındı': 'teslim_alindi',
      'Teknik İnceleme': 'teknik_inceleme',
      'Ödeme Tahsilatı': 'odeme_tahsilati',
      'Kargoya Veriliyor': 'kargoya_verildi',
      'Tamamlandı': 'tamamlandi'
    };
    return stageMapping[status as keyof typeof stageMapping] || '';
  };

  const openStageCompletionModal = (returnCase: FullReturnCase) => {
    const stageKey = getStageKey(returnCase.status);
    if (stageKey && canCompleteStage(returnCase)) {
      setStageCompletionModal({ isOpen: true, case: returnCase, stage: stageKey });
    }
  };

  const openViewModal = (returnCase: FullReturnCase) => {
    setViewModal({ isOpen: true, case: returnCase });
  };

  const openStageSpecificModal = (returnCase: FullReturnCase) => {
    const stageMapping = {
      'Teslim Alındı': 'teslim_alindi',
      'Teknik İnceleme': 'teknik_inceleme',
      'Ödeme Tahsilatı': 'odeme_tahsilati',
      'Kargoya Veriliyor': 'kargoya_verildi',
      'Tamamlandı': 'tamamlandi'
    };

    const currentStage = stageMapping[returnCase.status as keyof typeof stageMapping];
    if (!currentStage) return;

    // Check if user can edit this specific stage
    if (!canEditCase(returnCase)) return;

    // Open the appropriate modal based on the current stage
    switch (currentStage) {
      case 'teslim_alindi':
        setTeslimAlindiModal({ isOpen: true, case: returnCase });
        break;
      case 'teknik_inceleme':
        setTeknikIncelemeModal({ isOpen: true, case: returnCase });
        break;
      case 'odeme_tahsilati':
        setOdemeTahsilatiModal({ isOpen: true, case: returnCase });
        break;
      case 'kargoya_verildi':
        setKargoyaVerildiModal({ isOpen: true, case: returnCase });
        break;
      case 'tamamlandi':
        setTamamlandiModal({ isOpen: true, case: returnCase });
        break;
      default:
        // No fallback needed since we're in mobile cards
        break;
    }
  };
  if (isLoading) {
    return (
      <div className="md:hidden space-y-3 pb-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-500">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="md:hidden space-y-3 pb-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">
            {hasActiveFilters ? 'Arama kriterlerinize uygun vaka bulunamadı.' : 'Henüz vaka bulunmuyor.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3 pb-6">
        {cases.map((returnCase) => (
        <div key={returnCase.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Case Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    #{returnCase.id}
                  </span>
                </div>
                <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusClass(returnCase.status))}>
                  {returnCase.status}
                </span>
              </div>
              
              {/* Customer Info */}
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 truncate">
                  {returnCase.customer.name}
                </p>
              </div>
              
              {/* Arrival Date */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Geliş: {returnCase.arrival_date}
                </p>
              </div>
              
              {/* Products */}
              {returnCase.items && returnCase.items.length > 0 && (
                <div className="flex items-start gap-2 mb-2">
                  <Package className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Ürünler:</p>
                    {returnCase.items.map((item, itemIdx) => (
                      <p key={itemIdx} className="text-xs text-gray-500 ml-2">
                        • {item.product_model.name} ({item.product_count} adet)
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Receipt Method */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Teslim: {returnCase.receipt_method}
                </p>
              </div>
            </div>
            
                                                {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-3">
                    {/* View Button - Available to everyone */}
                    <button 
                      onClick={() => openViewModal(returnCase)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
                      title="Vakayı Görüntüle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Edit Button - Only show if user has permission */}
                    {canEditCase(returnCase) && (
                      <button 
                        onClick={() => openStageSpecificModal(returnCase)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        title="Vakayı Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Stage Completion Button - Only show if user has permission */}
                    {canCompleteStage(returnCase) && (
                      <button
                        onClick={() => openStageCompletionModal(returnCase)}
                        className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                        title="Aşamayı Tamamla"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Email Button - Only show if user is LOGISTICS and case is at Tamamlandı stage */}
                    {canUserEmailCustomer(user?.role || '', returnCase.status) && (
                      <button
                        onClick={() => setEmailCustomerModal({ isOpen: true, case: returnCase })}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        title="Müşteriye E-posta Gönder"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Delete Button - Only show if user is SUPPORT and case is at Teslim Alındı stage */}
                    {canDeleteCase(returnCase) && (
                      <button
                        onClick={() => onDelete(returnCase)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        title="Vakayı Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
          </div>
        </div>
      ))}
    </div>

    {/* Stage-specific Modals */}
    {teslimAlindiModal.isOpen && teslimAlindiModal.case && (
      <TeslimAlindiModal
        returnCase={teslimAlindiModal.case!}
        onClose={() => setTeslimAlindiModal({ isOpen: false, case: null })}
        onSuccess={() => {
          setTeslimAlindiModal({ isOpen: false, case: null });
          onRefresh();
        }}
      />
    )}

    {teknikIncelemeModal.isOpen && teknikIncelemeModal.case && (
      <TeknikIncelemeModal
        returnCase={teknikIncelemeModal.case!}
        onClose={() => setTeknikIncelemeModal({ isOpen: false, case: null })}
        onSuccess={() => {
          setTeknikIncelemeModal({ isOpen: false, case: null });
          onRefresh();
        }}
      />
    )}

    {odemeTahsilatiModal.isOpen && odemeTahsilatiModal.case && (
      <OdemeTahsilatiModal
        returnCase={odemeTahsilatiModal.case!}
        onClose={() => setOdemeTahsilatiModal({ isOpen: false, case: null })}
        onSuccess={() => {
          setOdemeTahsilatiModal({ isOpen: false, case: null });
          onRefresh();
        }}
      />
    )}

    {kargoyaVerildiModal.isOpen && kargoyaVerildiModal.case && (
      <KargoyaVerildiModal
        returnCase={kargoyaVerildiModal.case!}
        onClose={() => setKargoyaVerildiModal({ isOpen: false, case: null })}
        onSuccess={() => {
          setKargoyaVerildiModal({ isOpen: false, case: null });
          onRefresh();
        }}
      />
    )}

    {tamamlandiModal.isOpen && tamamlandiModal.case && (
      <TamamlandiModal
        returnCase={tamamlandiModal.case!}
        onClose={() => setTamamlandiModal({ isOpen: false, case: null })}
        onSuccess={() => {
          setTamamlandiModal({ isOpen: false, case: null });
          onRefresh();
        }}
      />
    )}

    {/* Stage Completion Modal */}
    {stageCompletionModal.isOpen && stageCompletionModal.case && (
      <StageCompletionModal
        isOpen={stageCompletionModal.isOpen}
        onClose={() => setStageCompletionModal({ isOpen: false, case: null, stage: '' })}
        stage={stageCompletionModal.stage}
        caseId={stageCompletionModal.case.id}
        onSuccess={() => {
          setStageCompletionModal({ isOpen: false, case: null, stage: '' });
          onRefresh();
        }}
      />
    )}

    {/* View Return Case Modal */}
    {viewModal.isOpen && viewModal.case && (
      <ViewReturnCaseModal
        returnCase={viewModal.case}
        onClose={() => setViewModal({ isOpen: false, case: null })}
      />
    )}

    {/* Email Customer Modal */}
    {emailCustomerModal.isOpen && emailCustomerModal.case && (
      <EmailCustomerModal
        returnCase={emailCustomerModal.case}
        onClose={() => setEmailCustomerModal({ isOpen: false, case: null })}
        onSuccess={() => {
          setEmailCustomerModal({ isOpen: false, case: null });
          onRefresh();
        }}
      />
    )}
  </>
  );
}
