// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/** "2024-05-20" -> "20 Mayıs 2024" */
export const formatTurkishDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return `${day} ${TURKISH_MONTHS[month - 1]} ${year}`;
};

export const truncateTextWithEllipsis = (text: string | null, maxCharacters: number): string => {
  if (!text) return "—";
  const normalized = text.trim();
  if (normalized.length <= maxCharacters) return normalized;
  return normalized.slice(0, maxCharacters) + '…';
};

export const getRoleNameInTurkish: Record<string, string> = {
  SALES: 'Satış',
  LOGISTICS: 'Lojistik',
  SUPPORT: 'Destek',
  TECHNICIAN: 'Teknisyen',
  MANAGER: 'Şef',
  ADMIN: 'Yönetici'
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};