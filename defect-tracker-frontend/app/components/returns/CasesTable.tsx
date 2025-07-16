'use client';

import { ReturnCase } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Package, Settings, Zap } from "lucide-react";

interface CasesTableProps {
    cases: ReturnCase[];
    isLoading: boolean;
    onEdit: (returnCase: ReturnCase) => void;
    onDelete: (returnCase: ReturnCase) => void;
}

const getStatusClass = (status: string) => {
    switch (status) {
      case 'Açık': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Repaired': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
};

const getProductIcon = (productType: string) => {
    switch (productType) {
        case 'Aşırı Yük Sensörü':
            return <Zap className="h-3 w-3" />;
        case 'Kapı Dedektörü':
            return <Package className="h-3 w-3" />;
        case 'Kontrol Ünitesi':
            return <Settings className="h-3 w-3" />;
        default:
            return <Package className="h-3 w-3" />;
    }
};

const getProductColor = (productType: string) => {
    switch (productType) {
        case 'Aşırı Yük Sensörü':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Kapı Dedektörü':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Kontrol Ünitesi':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export default function CasesTable({ cases, isLoading, onEdit, onDelete }: CasesTableProps) {

    const getMainProducts = (c: ReturnCase) => {
        const mainItems = c.items.filter(item => item.is_main_product);
        const accessoryItems = c.items.filter(item => !item.is_main_product);
      
        if (mainItems.length === 0) {
            return <span className="text-gray-400 italic">Ürün yok</span>;
        }

        return (
            <div className="flex flex-col gap-2">
                {mainItems.map((mainItem) => {
                    const count = mainItem.product_count;
                    const productName = mainItem.product_name;
                    const productType = mainItem.product_type;
                    
                    const attachedControlUnit = accessoryItems.find(
                        acc => acc.attached_to_item_id === mainItem.id
                    );

                    return (
                        <div key={mainItem.id} className="flex flex-col gap-1">
                            <div className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium",
                                getProductColor(productType)
                            )}>
                                {getProductIcon(productType)}
                                <span>{productName}</span>
                                {count > 1 && (
                                    <span className="bg-white/50 px-1 rounded text-xs">
                                        ×{count}
                                    </span>
                                )}
                            </div>
                            {attachedControlUnit && (
                                <div className="flex items-center gap-1 ml-3 text-xs text-gray-600">
                                    <span className="text-gray-400">└─</span>
                                    <Settings className="h-3 w-3 text-gray-500" />
                                    <span>Kontrol Ünitesi ile</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teslim Yöntemi</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün(ler)</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Geliş Tarihi</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atanan</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eylemler</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                    <tr><td colSpan={8} className="p-4 text-center text-gray-500">Yükleniyor...</td></tr>
                ) : cases.length === 0 ? (
                    <tr><td colSpan={8} className="p-4 text-center text-gray-500">Vaka bulunamadı.</td></tr>
                ) : (
                    cases.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                            <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.id}</td>
                            <td className="p-4 whitespace-nowrap">
                                <span className={cn('px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getStatusClass(c.status))}>
                                {c.status}
                                </span>
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-900">{c.customer_name}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">{c.receipt_method}</td>
                            <td className="p-4 text-sm">{getMainProducts(c)}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.arrival_date).toLocaleDateString()}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">{c.assigned_user}</td>
                            <td className="p-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-3">
                                <button onClick={() => onEdit(c)} className="text-blue-600 hover:text-blue-800"><Pencil className="h-5 w-5" /></button>
                                <button onClick={() => onDelete(c)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5" /></button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}