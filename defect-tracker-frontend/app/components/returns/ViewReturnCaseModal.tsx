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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vaka Bilgileri</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Müşteri</label>
                <p className="text-sm text-gray-900">{returnCase.customer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Geliş Tarihi</label>
                <p className="text-sm text-gray-900">{returnCase.arrival_date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Teslim Alma Yöntemi</label>
                <p className="text-sm text-gray-900">{returnCase.receipt_method}</p>
              </div>
              {returnCase.customer.contact_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">İletişim Bilgisi</label>
                  <p className="text-sm text-gray-900">{returnCase.customer.contact_info}</p>
                </div>
              )}
              {returnCase.customer.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Adres</label>
                  <p className="text-sm text-gray-900">{returnCase.customer.address}</p>
                </div>
              )}
            </div>
            {returnCase.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600">Notlar</label>
                <p className="text-sm text-gray-900 mt-1">{returnCase.notes}</p>
              </div>
            )}
          </div>

          {/* Cost Information Section */}
          {(returnCase.yedek_parca > 0 || returnCase.bakim > 0 || returnCase.iscilik > 0) && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Maliyet Bilgileri</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Yedek Parça</label>
                  <p className="text-sm text-gray-900">{returnCase.yedek_parca} ₺</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Bakım</label>
                  <p className="text-sm text-gray-900">{returnCase.bakim} ₺</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">İşçilik</label>
                  <p className="text-sm text-gray-900">{returnCase.iscilik} ₺</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-600">Toplam Tutar</label>
                <p className="text-lg font-semibold text-gray-900">{returnCase.cost} ₺</p>
              </div>
            </div>
          )}

          {/* Performed Services Section */}
          {returnCase.performed_services && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Genel Yapılan İşlemler</h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{returnCase.performed_services}</p>
            </div>
          )}

          {/* Products Section */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ürün Bilgileri</h3>
            <div className="space-y-6">
              {returnCase.items.map((item, index) => (
                <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-800">Ürün {index + 1}</h4>
                    <span className="text-sm text-gray-500">ID: {item.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Ürün Modeli</label>
                      <p className="text-sm text-gray-900">{item.product_model.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Ürün Tipi</label>
                      <p className="text-sm text-gray-900">{item.product_model.product_type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Adet</label>
                      <p className="text-sm text-gray-900">{item.product_count}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Üretim Tarihi</label>
                      <p className="text-sm text-gray-900">{item.production_date || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Garanti Durumu</label>
                      <p className="text-sm text-gray-900">{item.warranty_status || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Hata Sorumluluğu</label>
                      <p className="text-sm text-gray-900">{item.fault_responsibility || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Çözüm Yöntemi</label>
                      <p className="text-sm text-gray-900">{item.resolution_method || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Hizmet Tipi</label>
                      <p className="text-sm text-gray-900">{item.service_type || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Kontrol Ünitesi</label>
                      <p className="text-sm text-gray-900">{item.has_control_unit ? 'Var' : 'Yok'}</p>
                    </div>
                  </div>

                  {/* Controls Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Kontroller</h5>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.cable_check ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700">Kablo Kontrol</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.profile_check ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700">Mekanik Kontrol</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.packaging ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700">Paketleme</span>
                      </div>
                    </div>
                  </div>

                  {/* Services Section - Replace yapilan_islemler */}
                  {item.services && item.services.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Arza Tespiti/Hizmetleri</h4>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="space-y-2">
                          {item.services.map((service) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${service.is_performed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className={`text-sm ${service.is_performed ? 'text-gray-900' : 'text-gray-500'}`}>
                                {service.service_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information Section */}
          {(returnCase.shipping_info || returnCase.tracking_number || returnCase.shipping_date) && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Kargo Bilgileri</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {returnCase.shipping_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Kargo Bilgisi</label>
                    <p className="text-sm text-gray-900">{returnCase.shipping_info}</p>
                  </div>
                )}
                {returnCase.tracking_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Takip Numarası</label>
                    <p className="text-sm text-gray-900">{returnCase.tracking_number}</p>
                  </div>
                )}
                {returnCase.shipping_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Kargo Tarihi</label>
                    <p className="text-sm text-gray-900">{returnCase.shipping_date}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information Section */}
          {returnCase.payment_status && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ödeme Bilgileri</h3>
              <div>
                <label className="block text-sm font-medium text-gray-600">Ödeme Durumu</label>
                <p className="text-sm text-gray-900">{returnCase.payment_status}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
