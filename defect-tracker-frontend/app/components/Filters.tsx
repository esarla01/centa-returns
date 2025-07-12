import { useState } from "react";

interface FilterProps {
    onApply: (filters: {
        name: string;
        status: string;
        dateFrom: string;
        dateTo: string;
    }) => void;
}
  
export default function CaseFilter({ 
    onApply,
}: FilterProps) {
    const [tempFilters, setTempFilters] = useState({
        name: '',
        status: '',
        dateFrom: '',
        dateTo: '',
    });
    const [error, setError] = useState<string | null>(null);
    
    const clearDate = () => {
        setTimeout(() => {   
            setError(null);
            setTempFilters({
                name: '',
                status: '',
                dateFrom: '',
                dateTo: '',
            });
        }, 3000);
    }

    const handleOnApply = () => {
        if (
          tempFilters.dateFrom &&
          tempFilters.dateTo &&
          new Date(tempFilters.dateFrom) > new Date(tempFilters.dateTo)
        ) {
          setError('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
          clearDate();
          return;
        }   
        onApply(tempFilters);
      };
      
    const handleOnReset = () => {
        const emptyFilters = {
            name: '',
            status: '',
            dateFrom: '',
            dateTo: '',
        };     
        setTempFilters(emptyFilters);
        onApply(emptyFilters);
    };
      
    return (
        <div className="w-full max-w-xs md:max-w-sm lg:max-w-md space-y-8">
            <h3 className="text-2xl font-semibold text-blue-800">Filtreler</h3>
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Şirket İsmi</label>
                <input
                    type="text"
                    className="w-full border border-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={tempFilters.name}
                    onChange={(e) => setTempFilters({ ...tempFilters, name: e.target.value })}
                    placeholder="Şirket ismi ara..."
                />
            </div>
  
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                    className="w-full border border-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={tempFilters.status}
                    onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
                >
                <option value="All">Hepsi</option>
                <option value="Open">Açık</option>
                <option value="Closed">Kapalı</option>
                </select>
            </div>
  
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Geliş Tarihi (Başlangıç)</label>
                <input
                    type="date"
                    className="w-full border border-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={tempFilters.dateFrom}
                    onChange={(e) => setTempFilters({ ...tempFilters, dateFrom: e.target.value })}
                />
            </div>
  
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Geliş Tarihi (Bitiş)</label>
                <input
                    type="date"
                    className="w-full border border-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={tempFilters.dateTo}
                    onChange={(e) => setTempFilters({ ...tempFilters, dateTo: e.target.value })}
                />
            </div>

            {error && (
                <div className="text-red-600 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="flex justify-between pt-2">
                <button
                onClick={handleOnApply}
                className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
                >
                Uygula
                </button>
                <button
                onClick={handleOnReset}
                className="text-sm text-gray-800 font-medium hover:underline"
                >
                Temizle
                </button>
            </div>
        </div>
    );
}
