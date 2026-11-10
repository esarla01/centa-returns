'use client';

import { FullReturnCase, FullReturnCaseItem } from "@/lib/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { useState, type ReactNode } from "react";
import { Trash2, Mail, Eye } from 'lucide-react';
import StageActions from './StageActions';
import { useCaseModals } from './useCaseModals';
import { truncateTextWithEllipsis, formatCurrency, formatTurkishDate } from "@/lib/utils";
import {
  STAGES, canDeleteCase, canEmailCustomer, deleteHint, isCurrentStage, isStageCompleted, statusTone,
} from "@/lib/workflow";

interface CasesTableProps {
  cases: FullReturnCase[];
  isLoading: boolean;
  onDelete: (c: FullReturnCase) => void;
  onRefresh?: () => void; // reload the list after something was saved
}

/** One line per product in the case, or a dash when there are none yet. */
function PerItem({ items, children }: { items: FullReturnCaseItem[]; children: (item: FullReturnCaseItem) => ReactNode }) {
  if (items.length === 0) return <div className="text-xs text-gray-500">—</div>;
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id} className="border-b last:border-b-0 pb-1">{children(item)}</li>
      ))}
    </ul>
  );
}

/**
 * The case list for wide screens (a table) and tablets (cards). Phones use
 * CasesCards. A case must be ticked before its buttons work.
 */
export default function CasesTable({ cases, isLoading, onDelete, onRefresh }: CasesTableProps) {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const modals = useCaseModals(onRefresh);

  const handleCaseSelection = (caseId: number) => {
    setSelectedCaseId(selectedCaseId === caseId ? null : caseId);
  };

  const handleDeleteClick = (caseItem: FullReturnCase) => {
    if (selectedCaseId !== caseItem.id) return;
    onDelete(caseItem);
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
                const canDelete = canDeleteCase(user, c.status);
                const canEmail = canEmailCustomer(user, c.status);
                const isDeleteButtonActive = isSelected && canDelete;
                const isViewButtonActive = isSelected;
                const isEmailButtonActive = isSelected && canEmail;
                // const isEmailButtonActive = isSelected;


                return (
                  <tr key={c.id} className={statusTone(c.status).row}>
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
                          <span className={`${statusTone(c.status).text} text-sm font-semibold`}>
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
                      <StageActions
                        stage={modals.stage('teslim_alindi')} status={c.status} user={user} isSelected={isSelected} variant="table"
                        onEdit={() => modals.editStage(c, modals.stage('teslim_alindi'))}
                        onComplete={() => modals.completeStage(c, modals.stage('teslim_alindi'))}
                      />
                    </td>
                    
                    {/* Teknik İnceleme Stage */}
                    <td className="p-4 min-w-[200px]">
                      <PerItem items={c.items}>
                        {(item) => (
                              <div className="flex flex-row">
                                <span className="text-xs text-gray-600">
                                <span className="font-semibold">{item.product_model?.name || "—"} </span>
                                {item.product_count ? `(${item.product_count} adet${item.has_control_unit ? ", ünite dahil" : ""})` : ""}
                                </span>
                              </div>
                        )}
                      </PerItem>
                    </td>
                    <td className="p-4">
                      <PerItem items={c.items}>
                        {(item) => (
                              <div className="text-xs">
                                {item.production_date || "—"}
                              </div>
                        )}
                      </PerItem>
                    </td>
                    <td className="p-4">
                      <PerItem items={c.items}>
                        {(item) => (
                              <div className="text-xs">
                                {item.warranty_status === 'Garanti Dahilinde' ? 'Var' :
                                 item.warranty_status === 'Garanti Dışı' ? 'Yok' : "—"}
                              </div>
                        )}
                      </PerItem>
                    </td>
                    <td className="p-4">
                      <PerItem items={c.items}>
                        {(item) => (
                              <div className="text-xs">
                                {item.fault_responsibility === 'Kullanıcı Hatası' ? 'Kullanıcı Hatası' :
                                 item.fault_responsibility === 'Teknik Sorun' ? 'Teknik Sorun' :
                                 item.fault_responsibility === 'Karışık' ? 'Karışık' : "—"}
                              </div>
                        )}
                      </PerItem>
                    </td>
                    <td className="p-4">
                      <PerItem items={c.items}>
                        {(item) => (
                              <div className="text-xs">
                                {item.resolution_method || "—"}
                              </div>
                        )}
                      </PerItem>
                    </td>

                    {/* Arza Tespiti/Hizmetleri */}
                    <td className="p-4 min-w-[200px]">
                      <PerItem items={c.items}>
                        {(item) => (
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
                        )}
                      </PerItem>
                    </td>

                    {/* Toplam Tutar */}
                    <td className="p-4">
                      <div className="text-sm font-semibold text-blue-600">
                        {formatCurrency(c.cost)}
                      </div>
                    </td>

                    {/* Teknik İnceleme Eylemler */}
                    <td className="p-4">
                      <StageActions
                        stage={modals.stage('teknik_inceleme')} status={c.status} user={user} isSelected={isSelected} variant="table"
                        onEdit={() => modals.editStage(c, modals.stage('teknik_inceleme'))}
                        onComplete={() => modals.completeStage(c, modals.stage('teknik_inceleme'))}
                      />
                    </td>
                    
                    {/* Ödeme Tahsilatı Stage */}
                    <td className="p-4">{c.payment_status ?? "—"}</td>
                    <td className="p-4">
                      <StageActions
                        stage={modals.stage('odeme_tahsilati')} status={c.status} user={user} isSelected={isSelected} variant="table"
                        onEdit={() => modals.editStage(c, modals.stage('odeme_tahsilati'))}
                        onComplete={() => modals.completeStage(c, modals.stage('odeme_tahsilati'))}
                      />
                    </td>
                    
                    {/* Kargoya Verildi Stage */}
                    <td className="p-4">{truncateTextWithEllipsis(c.shipping_info, 30) || "—"}</td>
                    <td className="p-4">{c.tracking_number ?? "—"}</td>
                    <td className="p-4">{c.shipping_date ? formatTurkishDate(c.shipping_date) : "—"}</td>
                    <td className="p-4">
                      <StageActions
                        stage={modals.stage('kargoya_verildi')} status={c.status} user={user} isSelected={isSelected} variant="table"
                        onEdit={() => modals.editStage(c, modals.stage('kargoya_verildi'))}
                        onComplete={() => modals.completeStage(c, modals.stage('kargoya_verildi'))}
                      />
                    </td>
                    
                    {/* Actions */}
                    <td className="p-4">  
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => modals.view(c)}
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
                          onClick={() => modals.email(c)}
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
                          title={deleteHint(user, c.status)}
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
            const canDelete = canDeleteCase(user, c.status);
            const isDeleteButtonActive = isSelected && canDelete;
            const isViewButtonActive = isSelected;

            return (
              <div key={c.id} className={`bg-white rounded-2xl shadow border p-4 space-y-3 ${statusTone(c.status).row}`}>
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
                      onClick={() => modals.view(c)}
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
                      title={deleteHint(user, c.status)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <span className={`${statusTone(c.status).text} text-sm font-semibold`}>
                    {c.status}
                  </span>
                </div>

                {/* Each stage: where the case stands, and its buttons */}
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {STAGES.map((stage) => (
                    <div key={stage.key} className={`flex items-center justify-between p-2 rounded ${stage.tone.panel}`}>
                      <div className="flex items-center space-x-1">
                        <span className={`font-semibold ${stage.tone.label}`}>{stage.title}:</span>
                        <span>{isStageCompleted(c.status, stage) ? "✅" : isCurrentStage(c.status, stage) ? "🔄" : "❌"}</span>
                      </div>
                      <StageActions
                        stage={stage} status={c.status} user={user} isSelected={isSelected} variant="card"
                        onEdit={() => modals.editStage(c, stage)}
                        onComplete={() => modals.completeStage(c, stage)}
                      />
                    </div>
                  ))}
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
      {modals.modals}
    </div>
  );
}
