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
  },
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  SERVICES: '/services',
  RETURNS: {
    BASE: '/returns',
    SIMPLE: '/returns/simple',
    TAMAMLANDI: (id: string) => `/returns/${id}/tamamlandi`,
    KARGOYA_VERILDI: (id: string) => `/returns/${id}/kargoya-verildi`,
    TEKNIK_INCELEME: (id: string) => `/returns/${id}/teknik-inceleme`,
    DOKUMANTASYON: (id: string) => `/returns/${id}/dokumantasyon`,
    ODEME_TAHSILATI: (id: string) => `/returns/${id}/odeme-tahsilati`,
    SEND_CUSTOMER_EMAIL: (id: string) => `/returns/${id}/send-customer-email`,
    TESLIM_ALINDI: (id: string) => `/returns/${id}/teslim-alindi`,
  },
  REPORTS: {
    DEFECTS_BY_PRODUCTION_MONTH: '/reports/defects-by-production-month',
    ITEMS_BY_PRODUCT_MODEL: '/reports/items-by-product-model',
    SERVICE_TYPE_STATS: '/reports/service-type-stats',
    RESOLUTION_METHOD_STATS: '/reports/resolution-method-stats',
    ITEMS_BY_CUSTOMER: '/reports/items-by-customer',
    RETURNS_BREAKDOWN: '/reports/returns-breakdown',
    PRODUCT_TYPE_STATS: '/reports/product-type-stats',
    FAULT_RESPONSIBILITY_STATS: '/reports/fault-responsibility-stats',
    TOP_DEFECTS: '/reports/top-defects',
  },
  USER_ACTION_LOGS: '/user-action-logs',
};
