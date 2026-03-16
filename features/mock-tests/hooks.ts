'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { createTempId, mutationError, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

export type TestType = 'full' | 'partial';

export interface MockTest {
  id: string;
  name: string;
  date: string;
  type: TestType;
  subjectIds: string[];
  topicIds: string[];
  totalMarks: number;
  marksObtained: number;
  totalQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  unattemptedQuestions: number;
  accuracy: number;
  durationMinutes: number;
}

export function useMockTestsQuery() {
  return useQuery({
    queryKey: queryKeys.mockTests,
    queryFn: async () => {
      const data = await apiRequest<{ tests: MockTest[] }>('/api/mock-tests');
      return data.tests;
    },
  });
}

export function useCreateMockTestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<MockTest, 'id'>) => {
      const data = await apiRequest<{ test: MockTest }>('/api/mock-tests', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data.test;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mockTests });
      const previous = queryClient.getQueryData<MockTest[]>(queryKeys.mockTests);
      queryClient.setQueryData<MockTest[]>(queryKeys.mockTests, (current = []) => [
        { ...input, id: createTempId('mock-test') },
        ...current,
      ]);
      return { rollback: [{ queryKey: queryKeys.mockTests, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to save mock test.');
    },
    onSuccess: () => mutationSuccess('Mock test saved'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mockTests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analyticsSummary }),
      ]);
    },
  });
}

export function useDeleteMockTestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await apiRequest<{ deleted: boolean }>(`/api/mock-tests/${id}`, { method: 'DELETE' });
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mockTests });
      const previous = queryClient.getQueryData<MockTest[]>(queryKeys.mockTests);
      queryClient.setQueryData<MockTest[]>(queryKeys.mockTests, (current = []) =>
        current.filter((test) => test.id !== id)
      );
      return { rollback: [{ queryKey: queryKeys.mockTests, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to delete mock test.');
    },
    onSuccess: () => mutationSuccess('Mock test deleted'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mockTests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analyticsSummary }),
      ]);
    },
  });
}
