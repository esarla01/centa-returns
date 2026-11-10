import { useState } from 'react';
import { API_ENDPOINTS, api, errorMessage } from '@/lib/api';

/**
 * What every stage form does when its Save button is pressed: send the
 * stage's fields, show the result, and on success refresh the list and close
 * shortly after (long enough to read the confirmation).
 */
export function useStageSave(
  caseId: number,
  /** The stage's URL part, e.g. 'teknik-inceleme'. */
  slug: string,
  successMessage: string,
  onSuccess: () => void,
  onClose: () => void,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /** Pass `problem` to refuse the save with that message instead of sending it. */
  const save = async (fields: unknown, problem?: string | null) => {
    setError(null);
    setSuccess(null);
    if (problem) {
      setError(problem);
      return;
    }
    setIsLoading(true);
    try {
      await api.put(API_ENDPOINTS.RETURNS.STAGE(caseId, slug), fields);
      setSuccess(successMessage);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(errorMessage(err, 'Sunucu hatası'));
    } finally {
      setIsLoading(false);
    }
  };

  // setError lets a form report a problem of its own, outside saving.
  return { isLoading, error, success, save, setError };
}
