'use client';

import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { getClientErrorMessage } from '@/lib/client-api';

export function createTempId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function mutationSuccess(message: string) {
  toast.success(message);
}

export function mutationInfo(message: string) {
  toast.info(message);
}

export function mutationError(error: unknown, fallback: string) {
  toast.error(getClientErrorMessage(error, fallback));
}

export function rollbackOnError<T>(
  queryClient: QueryClient,
  rollback: Array<{ queryKey: readonly unknown[]; previousData: T | undefined }>
) {
  rollback.forEach(({ queryKey, previousData }) => {
    queryClient.setQueryData(queryKey, previousData);
  });
}
