'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { createTempId, mutationError, mutationInfo, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

export interface Lecture {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  duration: number;
  status: 'completed' | 'in-progress' | 'pending';
  needsRevision: boolean;
}

export function useLecturesQuery() {
  return useQuery({
    queryKey: queryKeys.lectures,
    queryFn: async () => {
      const data = await apiRequest<{ lectures: Lecture[] }>('/api/lectures');
      return data.lectures;
    },
  });
}

export function useCreateLectureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Lecture, 'id'>) => {
      const data = await apiRequest<{ lecture: Lecture }>('/api/lectures', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data.lecture;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lectures });
      const previous = queryClient.getQueryData<Lecture[]>(queryKeys.lectures);
      const optimisticLecture: Lecture = { ...input, id: createTempId('lecture') };
      queryClient.setQueryData<Lecture[]>(queryKeys.lectures, (current = []) => [
        optimisticLecture,
        ...current,
      ]);
      return { rollback: [{ queryKey: queryKeys.lectures, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to add lecture.');
    },
    onSuccess: () => mutationSuccess('Lecture added'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.lectures }),
        queryClient.invalidateQueries({ queryKey: queryKeys.revisions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}

export function useUpdateLectureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Omit<Lecture, 'id'>> & { id: string }) => {
      const data = await apiRequest<{ lecture: Lecture }>(`/api/lectures/${input.id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return data.lecture;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lectures });
      const previous = queryClient.getQueryData<Lecture[]>(queryKeys.lectures);
      queryClient.setQueryData<Lecture[]>(queryKeys.lectures, (current = []) =>
        current.map((lecture) =>
          lecture.id === input.id ? { ...lecture, ...input } : lecture
        )
      );
      return { rollback: [{ queryKey: queryKeys.lectures, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to update lecture.');
    },
    onSuccess: (_data, variables) => {
      if (variables.needsRevision !== undefined && Object.keys(variables).length === 2) {
        mutationInfo(variables.needsRevision ? 'Marked for revision' : 'Removed from revision list');
      } else {
        mutationSuccess('Lecture updated');
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.lectures }),
        queryClient.invalidateQueries({ queryKey: queryKeys.revisions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weakTopics }),
      ]);
    },
  });
}

export function useDeleteLectureMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await apiRequest<{ deleted: boolean }>(`/api/lectures/${id}`, { method: 'DELETE' });
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lectures });
      const previous = queryClient.getQueryData<Lecture[]>(queryKeys.lectures);
      queryClient.setQueryData<Lecture[]>(queryKeys.lectures, (current = []) =>
        current.filter((lecture) => lecture.id !== id)
      );
      return { rollback: [{ queryKey: queryKeys.lectures, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to delete lecture.');
    },
    onSuccess: () => mutationSuccess('Lecture deleted'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.lectures }),
        queryClient.invalidateQueries({ queryKey: queryKeys.revisions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}
