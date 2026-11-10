'use client';

/**
 * Pieces every chart on the statistics page uses: loading a report, loading
 * the choices for a filter, a filter dropdown, and date helpers.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { api, type QueryParams } from '@/lib/api';

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'overload', label: 'Aşırı Yük Sensörü' },
  { value: 'door_detector', label: 'Fotosel' },
  { value: 'control_unit', label: 'Kontrol Ünitesi' },
];

// --- Dates -------------------------------------------------------------------
// A chosen day is held as a Date at midnight UTC, so that turning it into
// "YYYY-MM-DD" gives the same day in every time zone.

/** Today, by the user's own calendar. */
export const today = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

/** The same day `months` earlier (the last day of that month if it is shorter). */
export const monthsBefore = (day: Date, months: number): Date => {
  const year = day.getUTCFullYear();
  const month = day.getUTCMonth() - months;
  const lastDayOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day.getUTCDate(), lastDayOfTarget)));
};

/** Date -> "YYYY-MM-DD" for the API and for <input type="date">. */
export const toDateParam = (day: Date | null): string => (day ? day.toISOString().split('T')[0] : '');

/** The value of an <input type="date"> -> Date. */
export const fromDateInput = (value: string): Date | null => (value ? new Date(value) : null);

// --- Loading -----------------------------------------------------------------

interface ReportState<T> {
  result: T | null;
  loading: boolean;
  /** What went wrong, as thrown by the API client; null when all is well. */
  failure: unknown;
}

/**
 * Load a report. Reloads when the query or `refreshKey` changes; pass a null
 * query to load nothing. If the query changes while a request is still
 * running, the late answer is ignored, so the chart never shows data for
 * filters that are no longer selected.
 */
export function useReport<T>(path: string, query: QueryParams | null, refreshKey = 0): ReportState<T> {
  const [state, setState] = useState<ReportState<T>>({ result: null, loading: false, failure: null });
  const queryKey = query ? JSON.stringify(query) : null;

  useEffect(() => {
    if (queryKey === null) {
      setState({ result: null, loading: false, failure: null });
      return;
    }
    let outdated = false;
    setState((previous) => ({ ...previous, loading: true, failure: null }));
    api.get<T>(path, JSON.parse(queryKey))
      .then((result) => { if (!outdated) setState({ result, loading: false, failure: null }); })
      .catch((failure) => { if (!outdated) setState({ result: null, loading: false, failure }); });
    return () => { outdated = true; };
  }, [path, queryKey, refreshKey]);

  return state;
}

/** The choices for a filter dropdown, e.g. the models of one product type. */
export function useOptions<T>(path: string, listKey: string, query: QueryParams | null): { options: T[]; loading: boolean } {
  const { result, loading } = useReport<Record<string, T[]>>(path, query);
  return { options: result?.[listKey] ?? [], loading };
}

// --- Display -----------------------------------------------------------------

interface SelectFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
  /** Shown under the dropdown, e.g. why it is disabled. */
  hint?: string;
}

export function SelectFilter({ label, value, onChange, options, disabled, hint }: SelectFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Tümü</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/**
 * What a chart shows instead of itself while loading, after a failure, or
 * when there is nothing to show. Returns null when the chart should render.
 */
export function chartNotice(loading: boolean, failure: unknown, empty: boolean): ReactNode {
  if (loading) return <ChartMessage>Yükleniyor...</ChartMessage>;
  if (failure) return <ChartMessage tone="error">Hata: Veri yüklenirken hata oluştu</ChartMessage>;
  if (empty) return <ChartMessage>Seçilen tarih aralığında veri bulunamadı</ChartMessage>;
  return null;
}

export function ChartMessage({ children, tone }: { children: ReactNode; tone?: 'error' }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className={tone === 'error' ? 'text-red-500' : 'text-gray-500'}>{children}</div>
    </div>
  );
}

export interface DateRangeProps {
  startDate: Date | null;
  endDate: Date | null;
  refreshKey: number;
}

/** The query every date-ranged report starts from; null until both dates are set. */
export const dateRangeQuery = (startDate: Date | null, endDate: Date | null): QueryParams | null =>
  startDate && endDate ? { start_date: toDateParam(startDate), end_date: toDateParam(endDate) } : null;
