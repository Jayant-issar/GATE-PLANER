'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flag, RefreshCw } from 'lucide-react';
import { useSyllabus } from '@/context/SyllabusContext';
import { apiRequest } from '@/lib/client-api';

interface Lecture {
  id: string;
  subjectId: string;
  title: string;
  duration: number;
  status: 'completed' | 'in-progress' | 'pending';
  needsRevision: boolean;
}

export default function RevisionPage() {
  const { subjects } = useSyllabus();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ lectures: Lecture[] }>('/api/lectures')
      .then((data) => setLectures(data.lectures))
      .finally(() => setLoading(false));
  }, []);

  const revisionLectures = useMemo(
    () => lectures.filter((lecture) => lecture.needsRevision),
    [lectures]
  );

  const toggleRevision = async (lecture: Lecture) => {
    const data = await apiRequest<{ lecture: Lecture }>(`/api/lectures/${lecture.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ needsRevision: !lecture.needsRevision }),
    });
    setLectures((prev) => prev.map((item) => (item.id === lecture.id ? data.lecture : item)));
  };

  if (loading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading revision queue...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revision Queue</h1>
        <p className="text-sm text-slate-500">Lectures currently marked for revision</p>
      </div>
      <div className="rounded-xl border bg-white shadow-sm divide-y divide-slate-100">
        {revisionLectures.length === 0 ? (
          <div className="p-6 text-slate-500">No lectures need revision right now.</div>
        ) : (
          revisionLectures.map((lecture) => (
            <div key={lecture.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{lecture.title}</p>
                <p className="text-sm text-slate-500">{subjects.find((subject) => subject.id === lecture.subjectId)?.name ?? 'Unknown Subject'}</p>
              </div>
              <button onClick={() => toggleRevision(lecture)} className="inline-flex items-center gap-2 rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200">
                <RefreshCw className="h-4 w-4" />
                Mark Reviewed
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
