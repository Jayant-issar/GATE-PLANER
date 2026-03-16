'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';

export interface WeakTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  weaknessScore: number;
  accuracy: number;
  mistakeCount: number;
  averageTimePerQuestion: number;
}

export function useWeakTopicsQuery() {
  return useQuery({
    queryKey: queryKeys.weakTopics,
    queryFn: async () => {
      const data = await apiRequest<{ weakTopics: WeakTopic[] }>('/api/analytics/weak-topics');
      return data.weakTopics;
    },
  });
}
