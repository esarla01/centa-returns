// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { buildApiUrl } from './api';
import { useEffect, useState } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const completeStage = async (caseId: number, stage: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  const stageEndpoints = {
    'teslim_alindi': `/returns/${caseId}/complete-teslim-alindi`,
    'teknik_inceleme': `/returns/${caseId}/complete-teknik-inceleme`,
    'odeme_tahsilati': `/returns/${caseId}/complete-odeme-tahsilati`,
    'kargoya_verildi': `/returns/${caseId}/complete-kargoya-verildi`,
    'tamamlandi': `/returns/${caseId}/complete-tamamlandi`
  };

  const endpoint = stageEndpoints[stage as keyof typeof stageEndpoints];
  if (!endpoint) {
    return { success: false, error: 'Geçersiz aşama' };
  }

  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error || 'Bir hata oluştu' };
    }
  } catch (e: unknown) {
    return { success: false, error: 'Bağlantı hatası' };
  }
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
  MANAGER: 'Yönetici',
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