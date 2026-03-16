'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { createTempId, mutationError, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

export type WeeklyTaskType = 'lecture' | 'pyq' | 'revision' | 'mock_test';

export interface WeeklyTask {
  id: string;
  title: string;
  type: WeeklyTaskType;
  completed: boolean;
  date: string;
}

function isWithinWindow(date: string, filters?: { from?: string; to?: string }) {
  const taskDate = date.slice(0, 10);
  if (filters?.from && taskDate < filters.from) return false;
  if (filters?.to && taskDate > filters.to) return false;
  return true;
}

export function useWeeklyTasksQuery(filters: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.weeklyTasks(filters),
    queryFn: async () => {
      const data = await apiRequest<{ tasks: WeeklyTask[] }>(
        `/api/weekly-tasks?from=${filters.from}&to=${filters.to}`
      );
      return data.tasks;
    },
  });
}

export function useCreateWeeklyTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; type: WeeklyTaskType; date: string }) => {
      const data = await apiRequest<{ task: WeeklyTask }>('/api/weekly-tasks', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data.task;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['weeklyTasks'] });
      const previous = queryClient.getQueriesData<WeeklyTask[]>({ queryKey: ['weeklyTasks'] });
      const optimisticTask: WeeklyTask = {
        id: createTempId('weekly-task'),
        title: input.title,
        type: input.type,
        completed: false,
        date: new Date(input.date).toISOString(),
      };

      previous.forEach(([key]) => {
        const [, filters] = key as ReturnType<typeof queryKeys.weeklyTasks>;
        if (isWithinWindow(optimisticTask.date, filters)) {
          queryClient.setQueryData<WeeklyTask[]>(key, (current = []) => [...current, optimisticTask]);
        }
      });

      return {
        rollback: previous.map(([queryKey, previousData]) => ({ queryKey, previousData })),
      };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to add task.');
    },
    onSuccess: () => {
      mutationSuccess('Task added');
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['weeklyTasks'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}

export function useUpdateWeeklyTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Pick<WeeklyTask, 'id' | 'date'> & { completed: boolean }) => {
      const data = await apiRequest<{ task: WeeklyTask }>(`/api/weekly-tasks/${input.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          completed: input.completed,
          date: input.date,
        }),
      });
      return data.task;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['weeklyTasks'] });
      const previous = queryClient.getQueriesData<WeeklyTask[]>({ queryKey: ['weeklyTasks'] });

      previous.forEach(([key]) => {
        queryClient.setQueryData<WeeklyTask[]>(key, (current = []) =>
          current.map((task) =>
            task.id === input.id ? { ...task, completed: input.completed } : task
          )
        );
      });

      return {
        rollback: previous.map(([queryKey, previousData]) => ({ queryKey, previousData })),
      };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to update task.');
    },
    onSuccess: (task) => {
      mutationSuccess(task.completed ? 'Task completed' : 'Task marked pending');
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['weeklyTasks'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}

export function useDeleteWeeklyTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await apiRequest<{ deleted: boolean }>(`/api/weekly-tasks/${id}`, { method: 'DELETE' });
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['weeklyTasks'] });
      const previous = queryClient.getQueriesData<WeeklyTask[]>({ queryKey: ['weeklyTasks'] });

      previous.forEach(([key]) => {
        queryClient.setQueryData<WeeklyTask[]>(key, (current = []) =>
          current.filter((task) => task.id !== id)
        );
      });

      return {
        rollback: previous.map(([queryKey, previousData]) => ({ queryKey, previousData })),
      };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to delete task.');
    },
    onSuccess: () => {
      mutationSuccess('Task deleted');
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['weeklyTasks'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}
