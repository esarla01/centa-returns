'use client';

import { ReturnCase } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";

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

export default function CasesTable({ cases, isLoading, onEdit, onDelete }: CasesTableProps) {

    const getMainProducts = (c: ReturnCase) => {
        const mainItems = c.items.filter(item => item.is_main_product);
        const accessoryItems = c.items.filter(item => !item.is_main_product);
      
        return (
          <div className="flex flex-col gap-1">
            {mainItems.length > 0 ? (
              mainItems.map((mainItem, index) => {
                const count = mainItem.product_count;
                const productName = mainItem.product_name;
                
                const hasControlUnit = accessoryItems.some(
                  acc => acc.attached_to_item_id === mainItem.id
                );
      
                const suffix = [
                  hasControlUnit ? "kontrol ünitesi ile" : null,
                  count >= 1 ? `x${count}` : null
                ]
                  .filter(Boolean)
                  .join(', ');
      
                return (
                  <div key={mainItem.id}>
                    {index + 1} - {productName} {suffix && `(${suffix})`}
                  </div>
                );
              })
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
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
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün(ler)</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Geliş Tarihi</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atanan</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eylemler</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">Yükleniyor...</td></tr>
                ) : cases.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">Vaka bulunamadı.</td></tr>
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
                            <td className="p-4 whitespace-nowrap text-sm">{getMainProducts(c)}</td>
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