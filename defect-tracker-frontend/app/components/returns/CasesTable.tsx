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
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Repaired': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
};

export default function CasesTable({ cases, isLoading, onEdit, onDelete }: CasesTableProps) {

    const getMainProduct = (c: ReturnCase) => {
        const mainItem = c.items.find(item => item.is_main_product);
        const accessoryCount = c.items.length - (mainItem ? 1 : 0);
        return (
            <div>
                <span className="font-medium text-gray-900">{mainItem ? mainItem.product_name : 'N/A'}</span>
                {accessoryCount > 0 && <span className="ml-2 text-xs text-gray-500">+{accessoryCount} parça</span>}
            </div>
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
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
                            <td className="p-4 whitespace-nowrap text-sm font-bold text-gray-600">#{c.id}</td>
                            <td className="p-4 whitespace-nowrap">
                                <span className={cn('px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getStatusClass(c.status))}>
                                {c.status}
                                </span>
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-900">{c.customer_name}</td>
                            <td className="p-4 whitespace-nowrap text-sm">{getMainProduct(c)}</td>
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