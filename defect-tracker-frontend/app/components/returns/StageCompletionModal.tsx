import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { completeStage } from '@/lib/utils';

interface StageCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: string;
  caseId: number;
  onSuccess?: () => void; // Optional callback for when stage is completed successfully
}

const STAGE_CONFIGS = {
  teslim_alindi: {
    title: 'Teslim Alındı',
    color: 'orange',
    icon: '📦'
  },
  teknik_inceleme: {
    title: 'Teknik İnceleme',
    color: 'blue',
    icon: '🔧'
  },
  dokumantasyon: {
    title: 'Dokümantasyon',
    color: 'yellow',
    icon: '📋'
  },
  kargoya_verildi: {
    title: 'Kargoya Verildi',
    color: 'purple',
    icon: '🚚'
  },
  tamamlandi: {
    title: 'Tamamlandı',
    color: 'gray',
    icon: '✅'
  }
};

const getColorClasses = (color: string) => {
  const colors = {
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };
  return colors[color as keyof typeof colors] || colors.gray;
};

const getButtonColorClasses = (color: string) => {
  const colors = {
    orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
  };
  return colors[color as keyof typeof colors] || colors.gray;
};

export default function StageCompletionModal({ isOpen, onClose, stage, caseId, onSuccess }: StageCompletionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stageConfig = STAGE_CONFIGS[stage as keyof typeof STAGE_CONFIGS];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    
    const result = await completeStage(caseId, stage);
    
    if (result.success) {
      console.log('Stage completed successfully:', result.message);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } else {
      setError(result.error || 'Bilinmeyen bir hata oluştu');
    }
    
    setIsSubmitting(false);
  };

  if (!isOpen || !stageConfig) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
      <div className={`relative w-full max-w-5xl max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden ${getColorClasses(stageConfig.color)}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{stageConfig.icon}</span>
            <h2 className="text-lg font-semibold">{stageConfig.title} Aşaması</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aşama Tamamlama Onayı
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Vaka #{caseId}</strong> için <strong>{stageConfig.title}</strong> aşamasını tamamlamak istediğinizden emin misiniz?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Dikkat:</strong> Bu işlem geri alınamaz. Aşama tamamlandıktan sonra değişiklik yapmak için yönetici onayı gerekebilir.
                </p>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">
                    <strong>Hata:</strong> {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 ${getButtonColorClasses(stageConfig.color)}`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Tamamlanıyor...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Aşamayı Tamamla</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 