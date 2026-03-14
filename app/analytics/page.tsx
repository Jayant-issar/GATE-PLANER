'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Target } from 'lucide-react';
import { apiRequest } from '@/lib/client-api';

interface DashboardData {
  lectures: { status: string; needsRevision: boolean }[];
  pyqTopics: { totalQuestions: number; solvedQuestions: number }[];
  mistakes: { status: string }[];
  mockTests: { marksObtained: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiRequest<DashboardData>('/api/dashboard').then(setData);
  }, []);

  const metrics = useMemo(() => {
    if (!data) return null;
    const lectureCompletion =
      data.lectures.length > 0
        ? Math.round((data.lectures.filter((lecture) => lecture.status === 'completed').length / data.lectures.length) * 100)
        : 0;
    const pyqCoverage =
      data.pyqTopics.reduce((sum, topic) => sum + topic.totalQuestions, 0) > 0
        ? Math.round(
            (data.pyqTopics.reduce((sum, topic) => sum + topic.solvedQuestions, 0) /
              data.pyqTopics.reduce((sum, topic) => sum + topic.totalQuestions, 0)) *
              100
          )
        : 0;
    const avgMock =
      data.mockTests.length > 0
        ? (data.mockTests.reduce((sum, test) => sum + test.marksObtained, 0) / data.mockTests.length).toFixed(1)
        : '0.0';
    const reviewLoad = data.mistakes.filter((mistake) => mistake.status === 'needs_review').length;
    return { lectureCompletion, pyqCoverage, avgMock, reviewLoad };
  }, [data]);

  if (!metrics) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Live backend summary metrics</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><BarChart3 className="h-5 w-5 text-indigo-500" /><h3 className="text-sm font-medium">Lecture Completion</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{metrics.lectureCompletion}%</p></div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><Target className="h-5 w-5 text-emerald-500" /><h3 className="text-sm font-medium">PYQ Coverage</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{metrics.pyqCoverage}%</p></div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><BarChart3 className="h-5 w-5 text-blue-500" /><h3 className="text-sm font-medium">Avg Mock Score</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{metrics.avgMock}</p></div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><AlertTriangle className="h-5 w-5 text-rose-500" /><h3 className="text-sm font-medium">Needs Review</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{metrics.reviewLoad}</p></div>
      </div>
    </div>
  );
}
