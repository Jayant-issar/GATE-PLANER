'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';

export interface DashboardTask {
  id: string;
  title: string;
  type: string;
  completed: boolean;
}

export interface DashboardLecture {
  id: string;
  status: string;
  needsRevision: boolean;
}

export interface DashboardPYQ {
  id: string;
  totalQuestions: number;
  solvedQuestions: number;
}

export interface DashboardMistake {
  id: string;
  source: string;
  status: string;
  subjectId: string;
  mistakeType: string;
}

export interface DashboardMockTest {
  id: string;
  name: string;
  marksObtained: number;
}

export interface DashboardRevision {
  id: string;
  nextRevisionDate: string;
  status: string;
}

export interface DashboardWeakTopic {
  topicId: string;
  topicName: string;
  subjectName: string;
  weaknessScore: number;
}

export interface DashboardStudySession {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
}

export interface HeatmapEntry {
  date: string;
  hours: number;
}

export interface DashboardData {
  todayTasks: DashboardTask[];
  lectures: DashboardLecture[];
  pyqTopics: DashboardPYQ[];
  mistakes: DashboardMistake[];
  mockTests: DashboardMockTest[];
  revisions: DashboardRevision[];
  studySessions: DashboardStudySession[];
  todayStudyHours: number;
  activeStudySession: { id: string; title: string; startedAt: string } | null;
  weakTopics: DashboardWeakTopic[];
  heatmap: HeatmapEntry[];
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => apiRequest<DashboardData>('/api/dashboard'),
  });
}
