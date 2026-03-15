'use client';

import { toast } from 'sonner';
import { getClientErrorMessage } from '@/lib/client-api';

export { toast };

export function toastApiError(error: unknown, fallback = 'Something went wrong') {
  toast.error(getClientErrorMessage(error, fallback));
}

export function toastValidation(message: string) {
  toast.warning(message);
}
