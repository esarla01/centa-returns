// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://centa-returns-production.up.railway.app';

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    WHOAMI: '/auth/whoami',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VALIDATE_INVITATION: (token: string) => `/auth/validate-invitation/${token}`,
    ACCEPT_INVITATION: '/auth/accept-invitation',
  },
  ADMIN: {
    USERS: '/admin',
    INVITE_USER: '/admin/invite-user',
    TOGGLE_EMAIL_NOTIFICATIONS: '/admin/toggle-email-notifications',
  },
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  SERVICES: '/services',
  RETURNS: {
    BASE: '/returns',
    SIMPLE: '/returns/simple',
    BY_ID: (id: number | string) => `/returns/${id}`,
    /** Save the fields of one stage; `slug` is e.g. 'teknik-inceleme'. */
    STAGE: (id: number | string, slug: string) => `/returns/${id}/${slug}`,
    SEND_CUSTOMER_EMAIL: (id: number | string) => `/returns/${id}/send-customer-email`,
    SERVICE_DEFINITIONS: (productType: string) => `/returns/service-definitions/${productType}`,
  },
  REPORTS: {
    DEFECTS_BY_PRODUCTION_MONTH: '/reports/defects-by-production-month',
    ITEMS_BY_PRODUCT_MODEL: '/reports/items-by-product-model',
    RESOLUTION_METHOD_STATS: '/reports/resolution-method-stats',
    ITEMS_BY_CUSTOMER: '/reports/items-by-customer',
    PRODUCT_TYPE_STATS: '/reports/product-type-stats',
    FAULT_RESPONSIBILITY_STATS: '/reports/fault-responsibility-stats',
    TOP_DEFECTS: '/reports/top-defects',
    PRODUCTION_DATE_DISTRIBUTION: '/reports/production-date-distribution',
  },
  USER_ACTION_LOGS: '/user-action-logs',
};

// --- API client ---------------------------------------------------------------
// Every request to the backend goes through `api`. It sends the login cookie,
// encodes the body, decodes the JSON answer and turns any non-2xx answer into
// an ApiError that carries the message the backend sent.

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

const withQuery = (path: string, query?: QueryParams): string => {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  });
  const text = params.toString();
  return text ? `${path}?${text}` : path;
};

async function request<T>(method: string, path: string, options: { query?: QueryParams; body?: unknown } = {}): Promise<T> {
  const response = await fetch(buildApiUrl(withQuery(path, options.query)), {
    method,
    credentials: 'include',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // The backend always answers with JSON; anything else is treated as empty.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const sent = (data ?? {}) as { msg?: string; error?: string };
    throw new ApiError(sent.msg ?? sent.error ?? '', response.status, data);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, query?: QueryParams) => request<T>('GET', path, { query }),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = unknown>(path: string, body?: unknown) => request<T>('DELETE', path, { body }),
};

/** The message to show for a failed request: what the backend said, or
 *  `fallback` when it said nothing or could not be reached at all. */
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiError && error.message ? error.message : fallback;

