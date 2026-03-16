'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { createTempId, mutationError, mutationInfo, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

export interface StudySession {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  notes: string;
  studyMinutes: number;
  breakMinutes: number;
  totalPeriods: number;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  subjectName?: string;
  topicName?: string;
}

interface StudySessionListResult {
  sessions: StudySession[];
  activeSession: StudySession | null;
}

export function useStudySessionsQuery(filters?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: queryKeys.studySessions(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);
      const data = await apiRequest<StudySessionListResult>(
        `/api/study-sessions${params.size > 0 ? `?${params.toString()}` : ''}`
      );
      return data;
    },
  });
}

export function useStartStudySessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<StudySession, 'id' | 'endedAt' | 'durationMinutes'>) => {
      const data = await apiRequest<{ session: StudySession }>('/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data.session;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['studySessions'] });
      const previous = queryClient.getQueriesData<StudySessionListResult>({ queryKey: ['studySessions'] });
      const optimisticSession: StudySession = {
        ...input,
        id: createTempId('study-session'),
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationMinutes: 0,
      };
      previous.forEach(([key]) => {
        queryClient.setQueryData<StudySessionListResult>(key, (current) => ({
          sessions: [optimisticSession, ...(current?.sessions ?? [])],
          activeSession: optimisticSession,
        }));
      });
      return { rollback: previous.map(([queryKey, previousData]) => ({ queryKey, previousData })) };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to start the study session.');
    },
    onSuccess: () => mutationSuccess('Pomodoro session started'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['studySessions'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}

export function useStopStudySessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const data = await apiRequest<{ session: StudySession }>(`/api/study-sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'stop' }),
      });
      return data.session;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['studySessions'] });
      const previous = queryClient.getQueriesData<StudySessionListResult>({ queryKey: ['studySessions'] });
      previous.forEach(([key]) => {
        queryClient.setQueryData<StudySessionListResult>(key, (current) => {
          if (!current) return current;
          return {
            sessions: current.sessions.map((session) =>
              session.id === id ? { ...session, endedAt: new Date().toISOString() } : session
            ),
            activeSession: current.activeSession?.id === id ? null : current.activeSession,
          };
        });
      });
      return { rollback: previous.map(([queryKey, previousData]) => ({ queryKey, previousData })) };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to stop the active session.');
    },
    onSuccess: () => mutationInfo('Study session ended'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['studySessions'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}

export function useDeleteStudySessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await apiRequest<{ deleted: boolean }>(`/api/study-sessions/${id}`, { method: 'DELETE' });
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['studySessions'] });
      const previous = queryClient.getQueriesData<StudySessionListResult>({ queryKey: ['studySessions'] });
      previous.forEach(([key]) => {
        queryClient.setQueryData<StudySessionListResult>(key, (current) => {
          if (!current) return current;
          return {
            sessions: current.sessions.filter((session) => session.id !== id),
            activeSession: current.activeSession?.id === id ? null : current.activeSession,
          };
        });
      });
      return { rollback: previous.map(([queryKey, previousData]) => ({ queryKey, previousData })) };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to delete the study session.');
    },
    onSuccess: () => mutationSuccess('Study session deleted'),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['studySessions'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}
