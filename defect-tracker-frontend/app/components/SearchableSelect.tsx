'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  id: number;
  name: string;
  [key: string]: any; // Allow additional properties
}

interface SearchableSelectProps {
  options: Option[];
  value: number | string;
  onChange: (value: number | string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  searchPlaceholder?: string;
  displayKey?: string; // Which property to display (default: 'name')
  valueKey?: string; // Which property to use as value (default: 'id')
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  label,
  required = false,
  disabled = false,
  className = "",
  searchPlaceholder = "Ara...",
  displayKey = "name",
  valueKey = "id"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => 
        option[displayKey].toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options, displayKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected option display text
  const getSelectedText = () => {
    if (!value) return placeholder;
    const selectedOption = options.find(option => option[valueKey] === value);
    return selectedOption ? selectedOption[displayKey] : placeholder;
  };

  const handleSelect = (option: Option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        ref={dropdownRef}
        className="relative"
      >
        {/* Main Select Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            ${disabled ? 'bg-gray-50' : 'bg-white hover:border-gray-400'}
            flex items-center justify-between
          `}
        >
          <span className={`truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
            {getSelectedText()}
          </span>
          <div className="flex items-center space-x-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  Sonuç bulunamadı
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option[valueKey]}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                      ${option[valueKey] === value ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                    `}
                  >
                    {option[displayKey]}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
