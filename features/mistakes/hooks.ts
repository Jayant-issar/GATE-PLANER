'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { createTempId, mutationError, mutationInfo, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

export type MistakeType = 'calculation' | 'conceptual' | 'silly' | 'formula' | 'misread' | 'time';

export interface Mistake {
  id: string;
  date: string;
  source: string;
  subjectId: string;
  topicId: string;
  questionDescription: string;
  mistakeType: MistakeType;
  whatWentWrong: string;
  learning: string;
  isRepeated: boolean;
  status: 'needs_review' | 'resolved';
}

export function useMistakesQuery() {
  return useQuery({
    queryKey: queryKeys.mistakes,
    queryFn: async () => {
      const data = await apiRequest<{ mistakes: Mistake[] }>('/api/mistakes');
      return data.mistakes;
    },
  });
}

export function useCreateMistakeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Mistake, 'id'>) => {
      const data = await apiRequest<{ mistake: Mistake }>('/api/mistakes', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data.mistake;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mistakes });
      const previous = queryClient.getQueryData<Mistake[]>(queryKeys.mistakes);
      queryClient.setQueryData<Mistake[]>(queryKeys.mistakes, (current = []) => [
        { ...input, id: createTempId('mistake') },
        ...current,
      ]);
      return { rollback: [{ queryKey: queryKeys.mistakes, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to log mistake.');
    },
    onSuccess: () => mutationSuccess('Mistake logged'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mistakes }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weakTopics }),
      ]);
    },
  });
}

export function useUpdateMistakeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Mistake) => {
      const data = await apiRequest<{ mistake: Mistake }>(`/api/mistakes/${input.id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return data.mistake;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mistakes });
      const previous = queryClient.getQueryData<Mistake[]>(queryKeys.mistakes);
      queryClient.setQueryData<Mistake[]>(queryKeys.mistakes, (current = []) =>
        current.map((mistake) => (mistake.id === input.id ? input : mistake))
      );
      return { rollback: [{ queryKey: queryKeys.mistakes, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to update mistake.');
    },
    onSuccess: (_data, variables) => {
      if (variables.status) {
        mutationInfo(variables.status === 'resolved' ? 'Mistake marked resolved' : 'Mistake marked for review');
      } else {
        mutationSuccess('Mistake updated');
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mistakes }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weakTopics }),
      ]);
    },
  });
}

export function useDeleteMistakeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await apiRequest<{ deleted: boolean }>(`/api/mistakes/${id}`, { method: 'DELETE' });
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mistakes });
      const previous = queryClient.getQueryData<Mistake[]>(queryKeys.mistakes);
      queryClient.setQueryData<Mistake[]>(queryKeys.mistakes, (current = []) =>
        current.filter((mistake) => mistake.id !== id)
      );
      return { rollback: [{ queryKey: queryKeys.mistakes, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to delete mistake.');
    },
    onSuccess: () => mutationSuccess('Mistake deleted'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mistakes }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weakTopics }),
      ]);
    },
  });
}
