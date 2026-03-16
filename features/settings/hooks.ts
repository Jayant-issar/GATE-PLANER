'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { mutationError, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

export interface Settings {
  targetYear: number;
  dailyStudyHoursGoal: number;
  timezone: string;
  weekStartsOn: number;
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const data = await apiRequest<{ settings: Settings }>('/api/settings');
      return data.settings;
    },
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Settings) => {
      const data = await apiRequest<{ settings: Settings }>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return data.settings;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings });
      const previous = queryClient.getQueryData<Settings>(queryKeys.settings);
      queryClient.setQueryData<Settings>(queryKeys.settings, input);
      return { rollback: [{ queryKey: queryKeys.settings, previousData: previous }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to save settings.');
    },
    onSuccess: () => mutationSuccess('Settings saved'),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
