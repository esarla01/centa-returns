'use client';

import { Package, Calendar, User, Building2, Eye, Pencil, CheckCircle, Trash2, Mail } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  type Actor, canCompleteStage, canDeleteCase, canEditStage, canEmailCustomer, stageOfStatus, statusTone,
} from '@/lib/workflow';
import { useCaseModals } from './useCaseModals';

interface CasesCardsProps {
  cases: FullReturnCase[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  user: Actor;
  onDelete: (returnCase: FullReturnCase) => void;
  onRefresh: () => void;
}

/** The case list on phones. Wider screens use CasesTable. */
export function CasesCards({
  cases,
  isLoading,
  hasActiveFilters,
  user,
  onDelete,
  onRefresh
}: CasesCardsProps) {
  const modals = useCaseModals(onRefresh);

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
        {cases.map((returnCase) => {
        // Phones show one set of buttons, for the stage the case is at now.
        const currentStage = stageOfStatus(returnCase.status);
        return (
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
                <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusTone(returnCase.status).chip)}>
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
                      onClick={() => modals.view(returnCase)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
                      title="Vakayı Görüntüle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Edit the current stage - only shown to who may */}
                    {currentStage && canEditStage(user, returnCase.status, currentStage) && (
                      <button 
                        onClick={() => modals.editStage(returnCase, currentStage)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        title="Vakayı Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Stage Completion Button - Only show if user has permission */}
                    {currentStage && canCompleteStage(user, returnCase.status, currentStage) && (
                      <button
                        onClick={() => modals.completeStage(returnCase, currentStage)}
                        className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                        title="Aşamayı Tamamla"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Email the customer - same rule as the table */}
                    {canEmailCustomer(user, returnCase.status) && (
                      <button
                        onClick={() => modals.email(returnCase)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        title="Müşteriye E-posta Gönder"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Delete - same rule as the table */}
                    {canDeleteCase(user, returnCase.status) && (
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
      );
      })}
    </div>

    {modals.modals}
  </>
  );
}
