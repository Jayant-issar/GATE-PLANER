'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { createTempId, mutationError, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

export interface TrackedTopic {
  id: string;
  topicId: string;
  subjectId: string;
  totalQuestions: number;
  solved: number;
  correct: number;
  incorrect: number;
  bookmarked: number;
}

export function usePyqsQuery() {
  return useQuery({
    queryKey: queryKeys.pyqs,
    queryFn: async () => {
      const data = await apiRequest<{ topics: TrackedTopic[] }>('/api/pyqs');
      return data.topics;
    },
  });
}

export function useCreatePyqMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TrackedTopic, 'id'> & { totalTimeMinutes?: number }) => {
      const data = await apiRequest<{ topic: TrackedTopic }>('/api/pyqs', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data.topic;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pyqs });
      const previous = queryClient.getQueryData<TrackedTopic[]>(queryKeys.pyqs);
      queryClient.setQueryData<TrackedTopic[]>(queryKeys.pyqs, (current = []) => [
        ...current,
        { ...input, id: createTempId('pyq') },
      ]);
      return { rollback: [{ queryKey: queryKeys.pyqs, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to add tracked topic.');
    },
    onSuccess: () => mutationSuccess('PYQ topic tracking added'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pyqs }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weakTopics }),
      ]);
    },
  });
}

export function useUpdatePyqMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TrackedTopic & { totalTimeMinutes?: number }) => {
      const data = await apiRequest<{ topic: TrackedTopic }>(`/api/pyqs/${input.id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return data.topic;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pyqs });
      const previous = queryClient.getQueryData<TrackedTopic[]>(queryKeys.pyqs);
      queryClient.setQueryData<TrackedTopic[]>(queryKeys.pyqs, (current = []) =>
        current.map((topic) => (topic.id === input.id ? input : topic))
      );
      return { rollback: [{ queryKey: queryKeys.pyqs, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to update tracked topic.');
    },
    onSuccess: () => mutationSuccess('PYQ topic updated'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pyqs }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weakTopics }),
      ]);
    },
  });
}

export function useDeletePyqMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await apiRequest<{ deleted: boolean }>(`/api/pyqs/${id}`, { method: 'DELETE' });
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pyqs });
      const previous = queryClient.getQueryData<TrackedTopic[]>(queryKeys.pyqs);
      queryClient.setQueryData<TrackedTopic[]>(queryKeys.pyqs, (current = []) =>
        current.filter((topic) => topic.id !== id)
      );
      return { rollback: [{ queryKey: queryKeys.pyqs, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to remove tracked topic.');
    },
    onSuccess: () => mutationSuccess('Tracked topic removed'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pyqs }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weakTopics }),
      ]);
    },
  });
}
