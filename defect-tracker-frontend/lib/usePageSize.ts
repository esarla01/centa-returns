'use client';

import { useState } from 'react';

/**
 * How many rows each list shows per page: fewer on a phone, where a row is a
 * tall card, than on a wider screen.
 */
export const PAGE_SIZES = {
  returns: { phone: 3, wide: 4 },
  customers: { phone: 3, wide: 5 },
  products: { phone: 5, wide: 5 },
  users: { phone: 4, wide: 5 },
  logs: { phone: 3, wide: 5 },
} as const;

/** Below this width the lists switch to their phone layout (Tailwind's `md`). */
const PHONE_QUERY = '(max-width: 767px)';

/** The page size for a list, decided once when the page opens. */
export function usePageSize(list: keyof typeof PAGE_SIZES): number {
  const [size] = useState(() => {
    const onPhone = typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches;
    return onPhone ? PAGE_SIZES[list].phone : PAGE_SIZES[list].wide;
  });
  return size;
}
