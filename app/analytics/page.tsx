'use client';

import { useMemo } from 'react';
import { AlertTriangle, BarChart3, Target, TimerReset } from 'lucide-react';
import { useWeakTopicsQuery } from '@/features/analytics/hooks';
import { useDashboardQuery } from '@/features/dashboard/hooks';

export default function AnalyticsPage() {
  const dashboardQuery = useDashboardQuery();
  const weakTopicsQuery = useWeakTopicsQuery();
  const data = dashboardQuery.data;
  const weakTopics = weakTopicsQuery.data ?? [];

  const metrics = useMemo(() => {
    if (!data) return null;
    const lectureCompletion =
      data.lectures.length > 0
        ? Math.round(
            (data.lectures.filter((lecture) => lecture.status === 'completed').length /
              data.lectures.length) *
              100
          )
        : 0;
    const totalQuestions = data.pyqTopics.reduce((sum, topic) => sum + topic.totalQuestions, 0);
    const solvedQuestions = data.pyqTopics.reduce((sum, topic) => sum + topic.solvedQuestions, 0);
    const pyqCoverage = totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;
    const avgMock =
      data.mockTests.length > 0
        ? (data.mockTests.reduce((sum, test) => sum + test.marksObtained, 0) / data.mockTests.length).toFixed(1)
        : '0.0';
    const reviewLoad =
      data.revisions.filter((revision) => revision.status === 'overdue').length ||
      data.mistakes.filter((mistake) => mistake.status === 'needs_review').length;

    return { lectureCompletion, pyqCoverage, avgMock, reviewLoad };
  }, [data]);

  if (dashboardQuery.isLoading || weakTopicsQuery.isLoading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading analytics...</div>;
  }

  if (!metrics || dashboardQuery.isError || weakTopicsQuery.isError) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-rose-600">Failed to load analytics.</div>;
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
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><TimerReset className="h-5 w-5 text-rose-500" /><h3 className="text-sm font-medium">Overdue Revisions</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{metrics.reviewLoad}</p></div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3 text-slate-500">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Weak Topics</h2>
        </div>
        {weakTopics.length === 0 ? (
          <p className="text-sm text-slate-500">Weak-topic analysis will appear after you track PYQs.</p>
        ) : (
          <div className="space-y-3">
            {weakTopics.map((topic) => (
              <div key={topic.topicId} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{topic.topicName}</p>
                    <p className="text-sm text-slate-500">{topic.subjectName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-600">{topic.weaknessScore}</p>
                    <p className="text-xs text-slate-500">weakness score</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Accuracy: {topic.accuracy}%</span>
                  <span>Mistakes: {topic.mistakeCount}</span>
                  <span>Time/Q: {topic.averageTimePerQuestion} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
