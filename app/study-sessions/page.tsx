'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { PauseCircle, PlayCircle, Timer, Trash2 } from 'lucide-react';
import { useSyllabus } from '@/context/SyllabusContext';
import { apiRequest } from '@/lib/client-api';

interface StudySession {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  notes: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  subjectName?: string;
  topicName?: string;
}

export default function StudySessionsPage() {
  const { subjects, loading: syllabusLoading } = useSyllabus();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    topicId: '',
    notes: '',
  });
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadSessions = useCallback(async () => {
    const data = await apiRequest<{ sessions: StudySession[]; activeSession: StudySession | null }>(
      '/api/study-sessions'
    );
    setSessions(data.sessions);
    setActiveSession(data.activeSession);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions()
      .catch((error) => {
        console.error('Failed to load study sessions', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadSessions]);

  const activeSubjectTopics = subjects.find((subject) => subject.id === formData.subjectId)?.topics ?? [];

  const startSession = async () => {
    if (!formData.title.trim()) return;

    const data = await apiRequest<{ session: StudySession }>('/api/study-sessions', {
      method: 'POST',
      body: JSON.stringify({
        title: formData.title.trim(),
        subjectId: formData.subjectId || undefined,
        topicId: formData.topicId || undefined,
        notes: formData.notes || undefined,
      }),
    });

    setActiveSession(data.session);
    setSessions((prev) => [data.session, ...prev]);
    setFormData({ title: '', subjectId: '', topicId: '', notes: '' });
  };

  const stopSession = async () => {
    if (!activeSession) return;
    const data = await apiRequest<{ session: StudySession }>(
      `/api/study-sessions/${activeSession.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ action: 'stop' }),
      }
    );
    setSessions((prev) => prev.map((session) => (session.id === activeSession.id ? data.session : session)));
    setActiveSession(null);
  };

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this study session?')) return;
    await apiRequest<{ deleted: boolean }>(`/api/study-sessions/${id}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((session) => session.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  };

  const todayMinutes = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return sessions
      .filter((session) => session.startedAt.slice(0, 10) === todayKey)
      .reduce((sum, session) => sum + session.durationMinutes, 0);
  }, [sessions]);

  const weekMinutes = useMemo(() => sessions.reduce((sum, session) => sum + session.durationMinutes, 0), [sessions]);

  const activeDurationMinutes = useMemo(() => {
    if (!activeSession) return 0;
    const startedAt = new Date(activeSession.startedAt).getTime();
    return Math.max(1, Math.round((now - startedAt) / 60000));
  }, [activeSession, now]);

  if (loading || syllabusLoading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading study sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Study Sessions</h1>
        <p className="text-sm text-slate-500">Record actual study time and drive the heatmap from real sessions</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Today</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{todayMinutes}m</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Recorded Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{weekMinutes}m</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Session</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{activeSession ? `${activeDurationMinutes}m` : 'None'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Start Session</h2>
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="e.g. Revise DBMS normalization"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={formData.subjectId}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, subjectId: event.target.value, topicId: '' }))
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select subject (optional)</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select
            value={formData.topicId}
            onChange={(event) => setFormData((prev) => ({ ...prev, topicId: event.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            disabled={!formData.subjectId}
          >
            <option value="">Select topic (optional)</option>
            {activeSubjectTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <textarea
            value={formData.notes}
            onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Notes"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={startSession}
            disabled={!formData.title.trim() || !!activeSession}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            Start Session
          </button>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Active Session</h2>
          </div>
          {!activeSession ? (
            <p className="text-sm text-slate-500">No active study session.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-900">{activeSession.title}</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Started at {format(new Date(activeSession.startedAt), 'MMM d, yyyy hh:mm a')}
                </p>
                <p className="mt-3 text-3xl font-bold text-indigo-600">{activeDurationMinutes}m</p>
              </div>
              <button
                onClick={stopSession}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                <PauseCircle className="h-4 w-4" />
                Stop Session
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm divide-y divide-slate-100">
        {sessions.length === 0 ? (
          <div className="p-6 text-slate-500">No sessions recorded yet.</div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{session.title}</p>
                <p className="text-sm text-slate-500">
                  {session.subjectName || 'General'}
                  {session.topicName ? ` • ${session.topicName}` : ''}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(session.startedAt), 'MMM d, yyyy hh:mm a')}
                  {session.endedAt ? ` - ${format(new Date(session.endedAt), 'hh:mm a')}` : ' • Active'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-700">
                  {session.endedAt ? `${session.durationMinutes}m` : 'In progress'}
                </span>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
