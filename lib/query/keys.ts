export const queryKeys = {
  subjects: ['subjects'] as const,
  weeklyTasks: (filters?: { from?: string; to?: string }) =>
    ['weeklyTasks', { from: filters?.from ?? '', to: filters?.to ?? '' }] as const,
  lectures: ['lectures'] as const,
  pyqs: ['pyqs'] as const,
  mockTests: ['mockTests'] as const,
  mistakes: ['mistakes'] as const,
  revisions: ['revisions'] as const,
  studySessions: (filters?: { from?: string; to?: string }) =>
    ['studySessions', { from: filters?.from ?? '', to: filters?.to ?? '' }] as const,
  dashboard: ['dashboard'] as const,
  settings: ['settings'] as const,
  weakTopics: ['weakTopics'] as const,
  analyticsSummary: ['analyticsSummary'] as const,
};
