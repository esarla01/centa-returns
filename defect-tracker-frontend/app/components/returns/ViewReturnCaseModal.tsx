"use client";

import { FullReturnCase } from "@/lib/types";
import { X } from "lucide-react";

interface ViewReturnCaseModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
}

export default function ViewReturnCaseModal({ returnCase, onClose }: ViewReturnCaseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[98vh] sm:max-h-[95vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Vaka #{returnCase.id} Detayları</h2>
            <p className="text-sm text-gray-600 mt-0.5">Durum: {returnCase.status}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
          {/* Case Information Section */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Vaka Bilgileri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Müşteri</span>
                <p className="font-medium text-gray-900">{returnCase.customer?.name || "—"}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Geliş Tarihi</span>
                <p className="font-medium text-gray-900">{returnCase.arrival_date || "—"}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Teslim Yöntemi</span>
                <p className="font-medium text-gray-900">{returnCase.receipt_method || "—"}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Ödeme Durumu</span>
                <p className="font-medium text-gray-900">{returnCase.payment_status || "—"}</p>
              </div>
            </div>
          </div>

          {/* Cost Information Section */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Maliyet Bilgileri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                              <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Yedek Parça</span>
                  <p className="font-medium text-gray-900">
                    {returnCase.yedek_parca !== null && returnCase.yedek_parca !== undefined ? `₺${returnCase.yedek_parca}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Bakım</span>
                  <p className="font-medium text-gray-900">
                    {returnCase.bakim !== null && returnCase.bakim !== undefined ? `₺${returnCase.bakim}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">İşçilik</span>
                  <p className="font-medium text-gray-900">
                    {returnCase.iscilik !== null && returnCase.iscilik !== undefined ? `₺${returnCase.iscilik}` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Toplam Tutar</span>
                  <p className="font-medium text-gray-900">
                    {returnCase.cost !== null && returnCase.cost !== undefined ? `₺${returnCase.cost}` : "—"}
                  </p>
                </div>
            </div>
          </div>

          {/* Shipping Information Section */}
          {(returnCase.shipping_info || returnCase.tracking_number || returnCase.shipping_date) && (
            <div className="bg-green-50 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Kargo Bilgileri
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Kargo Bilgisi</span>
                  <p className="font-medium text-gray-900">{returnCase.shipping_info || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Kargo Numarası</span>
                  <p className="font-medium text-gray-900">{returnCase.tracking_number || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Kargoya Verilme Tarihi</span>
                  <p className="font-medium text-gray-900">{returnCase.shipping_date || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes Section */}
          {(returnCase.notes || returnCase.performed_services) && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                Notlar ve Açıklamalar
              </h3>
              <div className="space-y-4">
                {returnCase.notes && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wide block mb-2">Genel Notlar</span>
                    <p className="font-medium text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">{returnCase.notes}</p>
                  </div>
                )}
                {returnCase.performed_services && (
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wide block mb-2">Teknik Servis Notu</span>
                    <p className="font-medium text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">{returnCase.performed_services}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Ürünler ({returnCase.items?.length || 0})
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {returnCase.items?.map((item, index) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  {/* Product Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-gray-900">{item.product_model?.name || "Bilinmeyen Ürün"}</span>
                    </div>
                    {item.product_model?.product_type && (
                      <span className="px-3 py-1 rounded-full text-xs bg-purple-100 border border-purple-200 text-purple-700 font-medium">
                        {item.product_model.product_type}
                      </span>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Adet: <span className="font-semibold text-gray-900">{item.product_count}</span></span>
                      <span>Üretim Tarihi: <span className="font-semibold text-gray-900">{item.production_date || "—"}</span></span>
                    </div>
                    {item.has_control_unit && (
                      <span className="px-3 py-1 rounded-full text-xs bg-blue-100 border border-blue-200 text-blue-700 font-medium">
                        Kontrol Ünitesi Dahil
                      </span>
                    )}
                  </div>

                  {/* Product Details - Two Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Status Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Durum Bilgileri</h4>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500">Garanti Durumu:</span>
                          <span className="font-medium text-gray-900">{item.warranty_status || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500">Hata Sorumluluğu:</span>
                          <span className="font-medium text-gray-900">{item.fault_responsibility || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500">Çözüm Yöntemi:</span>
                          <span className="font-medium text-gray-900">{item.resolution_method || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500">Hizmet:</span>
                          <span className="font-medium text-gray-900">{item.service_type || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Quality Controls */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Kalite Kontrolleri</h4>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500">Kablo Kontrol:</span>
                          <span className={`font-medium ${item.cable_check ? 'text-green-600' : 'text-red-600'}`}>
                            {item.cable_check ? "✓ Tamamlandı" : "✗ Yapılmadı"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500">Mekanik Kontrol:</span>
                          <span className={`font-medium ${item.profile_check ? 'text-green-600' : 'text-red-600'}`}>
                            {item.profile_check ? "✓ Tamamlandı" : "✗ Yapılmadı"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500">Paketleme:</span>
                          <span className={`font-medium ${item.packaging ? 'text-green-600' : 'text-red-600'}`}>
                            {item.packaging ? "✓ Tamamlandı" : "✗ Yapılmadı"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yapılan İşlemler - Full Width */}
                  {item.yapilan_islemler && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Yapılan İşlemler</h4>
                      <div className="bg-white p-4 rounded border border-gray-200">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.yapilan_islemler}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
