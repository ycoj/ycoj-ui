import type { Errorable, HydroError } from '@/shared/types/error';
import type { PasteExpire, PasteFormOptions } from '@/shared/types/paste';

export type PasteBackendFormFields = {
  expiryOptions: Record<string, string>;
  languageOptions: Record<string, string>;
  defaultExpire: PasteExpire;
  defaultLanguage: string;
};

export function normalizePasteOptionsResponse<T extends PasteBackendFormFields>(
  data: unknown
): Errorable<Omit<T, 'expiryOptions' | 'languageOptions'> & PasteFormOptions> {
  if (typeof data === 'object' && data !== null && 'error' in data) {
    return data as { error: HydroError };
  }
  const backend = data as T;
  const rest: Partial<T> & PasteFormOptions = {
    ...backend,
    languageNames: backend.languageOptions,
  };
  delete rest.expiryOptions;
  delete rest.languageOptions;
  return rest as Omit<T, 'expiryOptions' | 'languageOptions'> &
    PasteFormOptions;
}
