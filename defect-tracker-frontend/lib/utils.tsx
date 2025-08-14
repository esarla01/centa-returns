// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Stage completion API utility
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
    const response = await fetch(`http://localhost:5000${endpoint}`, {
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
  } catch (error) {
    return { success: false, error: 'Bağlantı hatası' };
  }
};