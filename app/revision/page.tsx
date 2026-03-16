'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Clock3, RefreshCw } from 'lucide-react';
import { type RevisionItem, useCompleteRevisionMutation, useRevisionsQuery } from '@/features/revisions/hooks';

const EMPTY_REVISIONS: RevisionItem[] = [];

export default function RevisionPage() {
  const revisionsQuery = useRevisionsQuery();
  const completeRevisionMutation = useCompleteRevisionMutation();
  const revisions = revisionsQuery.data ?? EMPTY_REVISIONS;

  const dueTodayCount = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return revisions.filter((revision) => new Date(revision.nextRevisionDate) <= today).length;
  }, [revisions]);

  const overdueCount = useMemo(
    () => revisions.filter((revision) => revision.status === 'overdue').length,
    [revisions]
  );

  const sortedRevisions = useMemo(
    () =>
      revisions.slice().sort((a, b) => {
        const overdueDiff = Number(b.status === 'overdue') - Number(a.status === 'overdue');
        if (overdueDiff !== 0) return overdueDiff;
        return new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime();
      }),
    [revisions]
  );

  if (revisionsQuery.isLoading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading revision queue...</div>;
  }

  if (revisionsQuery.isError) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-rose-600">Failed to load revision queue.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revision Queue</h1>
        <p className="text-sm text-slate-500">Scheduled revisions with interval progression</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Scheduled</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{revisions.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Due Today</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{dueTodayCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{overdueCount}</p>
        </div>
      </div>
      <div className="rounded-xl border bg-white shadow-sm divide-y divide-slate-100">
        {sortedRevisions.length === 0 ? (
          <div className="p-6 text-slate-500">No revision items scheduled right now.</div>
        ) : (
          sortedRevisions.map((revision) => (
            <div key={revision.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{revision.lectureTitle}</p>
                <p className="text-sm text-slate-500">
                  {revision.subjectName}
                  {revision.topicName ? ` • ${revision.topicName}` : ''}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {format(new Date(revision.nextRevisionDate), 'MMM d, yyyy')}
                  </span>
                  <span>Interval Level {revision.intervalLevel}</span>
                  <span className={revision.status === 'overdue' ? 'text-rose-600 font-medium' : 'text-slate-500'}>
                    {revision.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => completeRevisionMutation.mutate({ id: revision.id })}
                disabled={completeRevisionMutation.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Complete Revision
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
