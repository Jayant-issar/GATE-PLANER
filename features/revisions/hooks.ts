'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { mutationError, mutationSuccess } from '@/lib/query/mutation-toast';

export interface RevisionItem {
  id: string;
  lectureId: string;
  subjectId: string;
  topicId: string;
  lectureTitle: string;
  subjectName: string;
  topicName: string;
  nextRevisionDate: string;
  intervalLevel: number;
  status: 'pending' | 'completed' | 'overdue';
}

export function useRevisionsQuery() {
  return useQuery({
    queryKey: queryKeys.revisions,
    queryFn: async () => {
      const data = await apiRequest<{ revisions: RevisionItem[] }>('/api/revisions');
      return data.revisions;
    },
  });
}

export function useCompleteRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const data = await apiRequest<{ revision: { id: string; nextRevisionDate: string; intervalLevel: number; status: string } }>(
        `/api/revisions/${id}/complete`,
        {
          method: 'POST',
        }
      );
      return data.revision;
    },
    onError: (error) => {
      mutationError(error, 'Failed to complete revision.');
    },
    onSuccess: () => {
      mutationSuccess('Revision completed');
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.revisions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}
