'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertCircle,
  Clock3,
  Coffee,
  MoonStar,
  Music4,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useSyllabus } from '@/context/SyllabusContext';
import { apiRequest, getClientErrorMessage } from '@/lib/client-api';

interface StudySession {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  notes: string;
  studyMinutes: number;
  breakMinutes: number;
  totalPeriods: number;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  subjectName?: string;
  topicName?: string;
}

interface StudySessionFormData {
  title: string;
  subjectId: string;
  topicId: string;
  notes: string;
  studyMinutes: number;
  breakMinutes: number;
  totalPeriods: number;
}

type FormErrors = Partial<
  Record<'subjectId' | 'topicId' | 'studyMinutes' | 'breakMinutes' | 'totalPeriods', string>
>;

type PomodoroPhase = 'focus' | 'break' | 'complete';

interface PomodoroState {
  phase: PomodoroPhase;
  periodNumber: number;
  secondsRemaining: number;
  progressPercent: number;
  focusedMinutes: number;
  cycleLabel: string;
}

const presets = [
  { label: 'Soft Focus', studyMinutes: 25, breakMinutes: 5, totalPeriods: 4 },
  { label: 'Deep Work', studyMinutes: 50, breakMinutes: 10, totalPeriods: 3 },
  { label: 'Night Library', studyMinutes: 90, breakMinutes: 20, totalPeriods: 2 },
] as const;

function validateStudySessionForm(formData: StudySessionFormData): FormErrors {
  const errors: FormErrors = {};

  if (!formData.subjectId) {
    errors.subjectId = 'Pick a subject before you start the timer.';
  }

  if (!formData.topicId) {
    errors.topicId = 'Pick a topic before you start the timer.';
  }

  if (formData.studyMinutes < 1) {
    errors.studyMinutes = 'Focus block must be at least 1 minute.';
  }

  if (formData.breakMinutes < 0) {
    errors.breakMinutes = 'Break time cannot be negative.';
  }

  if (formData.totalPeriods < 1) {
    errors.totalPeriods = 'Add at least one focus period.';
  }

  return errors;
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatHoursAndMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function getPomodoroState(session: StudySession | null, now: number): PomodoroState | null {
  if (!session) {
    return null;
  }

  const studySeconds = session.studyMinutes * 60;
  const breakSeconds = session.breakMinutes * 60;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - new Date(session.startedAt).getTime()) / 1000)
  );

  let remaining = elapsedSeconds;
  let focusedSeconds = 0;

  for (let index = 0; index < session.totalPeriods; index += 1) {
    if (remaining < studySeconds) {
      focusedSeconds += remaining;
      return {
        phase: 'focus',
        periodNumber: index + 1,
        secondsRemaining: studySeconds - remaining,
        progressPercent: Math.min(100, Math.round((remaining / studySeconds) * 100)),
        focusedMinutes: Math.floor(focusedSeconds / 60),
        cycleLabel: `Focus ${index + 1}/${session.totalPeriods}`,
      };
    }

    focusedSeconds += studySeconds;
    remaining -= studySeconds;

    if (index === session.totalPeriods - 1) {
      break;
    }

    if (remaining < breakSeconds) {
      return {
        phase: 'break',
        periodNumber: index + 1,
        secondsRemaining: breakSeconds - remaining,
        progressPercent: breakSeconds === 0 ? 100 : Math.min(100, Math.round((remaining / breakSeconds) * 100)),
        focusedMinutes: Math.floor(focusedSeconds / 60),
        cycleLabel: `Break after focus ${index + 1}`,
      };
    }

    remaining -= breakSeconds;
  }

  return {
    phase: 'complete',
    periodNumber: session.totalPeriods,
    secondsRemaining: 0,
    progressPercent: 100,
    focusedMinutes: session.totalPeriods * session.studyMinutes,
    cycleLabel: 'Planned cycles complete',
  };
}

function getSessionTitle(formData: StudySessionFormData, subjectName?: string, topicName?: string) {
  if (formData.title.trim()) {
    return formData.title.trim();
  }

  if (subjectName && topicName) {
    return `${subjectName} • ${topicName} Focus Session`;
  }

  return '';
}

export default function StudySessionsPage() {
  const { subjects, loading: syllabusLoading } = useSyllabus();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<StudySessionFormData>({
    title: '',
    subjectId: '',
    topicId: '',
    notes: '',
    studyMinutes: 25,
    breakMinutes: 5,
    totalPeriods: 4,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [pageError, setPageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());

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
    loadSessions()
      .catch((error) => {
        console.error('Failed to load study sessions', error);
        setPageError(getClientErrorMessage(error, 'Failed to load study sessions.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadSessions]);

  const selectedSubject = subjects.find((subject) => subject.id === formData.subjectId) ?? null;
  const activeSubjectTopics = selectedSubject?.topics ?? [];
  const selectedTopic =
    activeSubjectTopics.find((topic) => topic.id === formData.topicId) ?? null;

  const pomodoroState = useMemo(
    () => getPomodoroState(activeSession, now),
    [activeSession, now]
  );

  const todayMinutes = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return sessions
      .filter((session) => session.startedAt.slice(0, 10) === todayKey)
      .reduce((sum, session) => sum + session.durationMinutes, 0);
  }, [sessions]);

  const totalMinutes = useMemo(
    () => sessions.reduce((sum, session) => sum + session.durationMinutes, 0),
    [sessions]
  );

  const completedSessions = useMemo(
    () => sessions.filter((session) => session.endedAt).length,
    [sessions]
  );

  const selectedPlanMinutes =
    formData.studyMinutes * formData.totalPeriods +
    formData.breakMinutes * Math.max(0, formData.totalPeriods - 1);

  const sessionTitlePreview = getSessionTitle(
    formData,
    selectedSubject?.name,
    selectedTopic?.name
  );

  const applyPreset = (preset: (typeof presets)[number]) => {
    setFormData((prev) => ({
      ...prev,
      studyMinutes: preset.studyMinutes,
      breakMinutes: preset.breakMinutes,
      totalPeriods: preset.totalPeriods,
    }));
    setFormErrors((prev) => ({
      ...prev,
      studyMinutes: undefined,
      breakMinutes: undefined,
      totalPeriods: undefined,
    }));
  };

  const startSession = async () => {
    const validationErrors = validateStudySessionForm(formData);
    setFormErrors(validationErrors);
    setPageError('');

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiRequest<{ session: StudySession }>('/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title.trim() || undefined,
          subjectId: formData.subjectId,
          topicId: formData.topicId,
          notes: formData.notes || undefined,
          studyMinutes: formData.studyMinutes,
          breakMinutes: formData.breakMinutes,
          totalPeriods: formData.totalPeriods,
        }),
      });

      setActiveSession(data.session);
      setSessions((prev) => [data.session, ...prev]);
      setFormData({
        title: '',
        subjectId: '',
        topicId: '',
        notes: '',
        studyMinutes: 25,
        breakMinutes: 5,
        totalPeriods: 4,
      });
      setFormErrors({});
    } catch (error) {
      setPageError(getClientErrorMessage(error, 'Failed to start the study session.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopSession = async () => {
    if (!activeSession) {
      return;
    }

    try {
      setPageError('');
      const data = await apiRequest<{ session: StudySession }>(
        `/api/study-sessions/${activeSession.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'stop' }),
        }
      );

      setSessions((prev) =>
        prev.map((session) => (session.id === activeSession.id ? data.session : session))
      );
      setActiveSession(null);
    } catch (error) {
      setPageError(getClientErrorMessage(error, 'Failed to stop the active session.'));
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this study session?')) {
      return;
    }

    try {
      setPageError('');
      await apiRequest<{ deleted: boolean }>(`/api/study-sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((session) => session.id !== id));
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
    } catch (error) {
      setPageError(getClientErrorMessage(error, 'Failed to delete the study session.'));
    }
  };

  if (loading || syllabusLoading) {
    return (
      <div className="rounded-[2rem] border border-white/60 bg-white/70 p-8 text-sm text-slate-600 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        Tuning the room ambience and loading your focus sessions...
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-800">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(253,230,138,0.55),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(167,243,208,0.45),_transparent_24%),linear-gradient(135deg,_rgba(255,248,235,0.98),_rgba(239,246,255,0.92)_52%,_rgba(236,253,245,0.92))] p-8 shadow-[0_32px_90px_rgba(15,23,42,0.12)]">
        <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-600 backdrop-blur">
              <MoonStar className="h-4 w-4 text-amber-500" />
              Lofi Focus Room
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                Build a softer Pomodoro flow for long anime-night study blocks.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Pick your subject, lock a topic, choose the rhythm, and let the session move
                through focus and break phases without losing the mood.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm">
                <Music4 className="h-4 w-4 text-rose-500" />
                Chill session pacing
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm">
                <Sparkles className="h-4 w-4 text-sky-500" />
                Subject and topic locked in
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm">
                <Coffee className="h-4 w-4 text-emerald-500" />
                Planned break cycles
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/70 bg-white/65 p-5 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Today</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatHoursAndMinutes(todayMinutes)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Real focused minutes recorded today.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/70 bg-white/65 p-5 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Archive</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatHoursAndMinutes(totalMinutes)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Total focus time across all sessions.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/70 bg-white/65 p-5 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Finished</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{completedSessions}</p>
              <p className="mt-2 text-sm text-slate-500">Completed Pomodoro runs so far.</p>
            </div>
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{pageError}</p>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-[#f3e8ff]/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(255,250,245,0.94))] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Session Setup</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Compose the next focus loop</h2>
            </div>
            <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
              {formatHoursAndMinutes(selectedPlanMinutes)} planned
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Presets
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {presets.map((preset) => {
                  const isActive =
                    preset.studyMinutes === formData.studyMinutes &&
                    preset.breakMinutes === formData.breakMinutes &&
                    preset.totalPeriods === formData.totalPeriods;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                          : 'border-slate-200 bg-white/85 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <p className="text-sm font-semibold">{preset.label}</p>
                      <p className={`mt-1 text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                        {preset.studyMinutes}m focus • {preset.breakMinutes}m break • {preset.totalPeriods} rounds
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Subject
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, subjectId: event.target.value, topicId: '' }));
                    setFormErrors((prev) => ({ ...prev, subjectId: undefined, topicId: undefined }));
                  }}
                  className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400"
                >
                  <option value="">Choose a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {formErrors.subjectId ? (
                  <p className="mt-2 text-xs text-rose-600">{formErrors.subjectId}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Topic
                </label>
                <select
                  value={formData.topicId}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, topicId: event.target.value }));
                    setFormErrors((prev) => ({ ...prev, topicId: undefined }));
                  }}
                  disabled={!formData.subjectId}
                  className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Choose a topic</option>
                  {activeSubjectTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                {formErrors.topicId ? (
                  <p className="mt-2 text-xs text-rose-600">{formErrors.topicId}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Focus
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.studyMinutes}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, studyMinutes: Number(event.target.value) || 0 }));
                    setFormErrors((prev) => ({ ...prev, studyMinutes: undefined }));
                  }}
                  className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400"
                />
                {formErrors.studyMinutes ? (
                  <p className="mt-2 text-xs text-rose-600">{formErrors.studyMinutes}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Break
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.breakMinutes}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, breakMinutes: Number(event.target.value) || 0 }));
                    setFormErrors((prev) => ({ ...prev, breakMinutes: undefined }));
                  }}
                  className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400"
                />
                {formErrors.breakMinutes ? (
                  <p className="mt-2 text-xs text-rose-600">{formErrors.breakMinutes}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Periods
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.totalPeriods}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, totalPeriods: Number(event.target.value) || 0 }));
                    setFormErrors((prev) => ({ ...prev, totalPeriods: undefined }));
                  }}
                  className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400"
                />
                {formErrors.totalPeriods ? (
                  <p className="mt-2 text-xs text-rose-600">{formErrors.totalPeriods}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Scene Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Optional: Moonlight revision run"
                  className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Session Preview</p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {sessionTitlePreview || 'Pick a subject and topic to generate the session title.'}
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {formData.totalPeriods} focus block{formData.totalPeriods > 1 ? 's' : ''} with{' '}
                  {Math.max(0, formData.totalPeriods - 1)} break{formData.totalPeriods > 2 ? 's' : ''}.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                rows={4}
                placeholder="Optional: what this session is for, what to revise, what to finish."
                className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={startSession}
              disabled={Boolean(activeSession) || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <PlayCircle className="h-4 w-4" />
              {isSubmitting ? 'Opening focus room...' : 'Start Pomodoro Session'}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#dbeafe] bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96)_50%,_rgba(15,23,42,0.98))] p-6 text-slate-100 shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timer Deck</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Current room ambience</h2>
            </div>
            <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
              Live phase tracking
            </div>
          </div>

          {!activeSession || !pomodoroState ? (
            <div className="mt-8 rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <MoonStar className="mx-auto h-10 w-10 text-amber-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">No active session yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">
                Build a subject-topic Pomodoro plan on the left and start the timer. This panel
                will switch into a live focus and break guide.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.03))] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {pomodoroState.phase === 'focus'
                        ? 'Focus Phase'
                        : pomodoroState.phase === 'break'
                          ? 'Break Phase'
                          : 'Session Complete'}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">
                      {activeSession.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {activeSession.subjectName} • {activeSession.topicName}
                    </p>
                  </div>
                  <div
                    className={`rounded-full px-4 py-2 text-xs font-medium ${
                      pomodoroState.phase === 'focus'
                        ? 'bg-rose-400/20 text-rose-100'
                        : pomodoroState.phase === 'break'
                          ? 'bg-emerald-400/20 text-emerald-100'
                          : 'bg-sky-400/20 text-sky-100'
                    }`}
                  >
                    {pomodoroState.cycleLabel}
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-5">
                  <div
                    className="flex h-64 w-64 items-center justify-center rounded-full border-8 border-white/10 bg-slate-950/30 shadow-[inset_0_0_60px_rgba(255,255,255,0.05)]"
                    style={{
                      background: `conic-gradient(${
                        pomodoroState.phase === 'focus'
                          ? 'rgba(251,113,133,0.95)'
                          : pomodoroState.phase === 'break'
                            ? 'rgba(16,185,129,0.95)'
                            : 'rgba(96,165,250,0.95)'
                      } ${pomodoroState.progressPercent}%, rgba(255,255,255,0.08) ${pomodoroState.progressPercent}%)`,
                    }}
                  >
                    <div className="flex h-[13.5rem] w-[13.5rem] flex-col items-center justify-center rounded-full bg-slate-950/85 text-center">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        {pomodoroState.phase === 'focus'
                          ? 'Stay Locked In'
                          : pomodoroState.phase === 'break'
                            ? 'Breathe and Reset'
                            : 'Cycle Complete'}
                      </p>
                      <p className="mt-4 text-5xl font-semibold tracking-tight text-white">
                        {formatClock(pomodoroState.secondsRemaining)}
                      </p>
                      <p className="mt-3 text-sm text-slate-400">
                        {pomodoroState.progressPercent}% through this phase
                      </p>
                    </div>
                  </div>

                  <div className="grid w-full gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.2rem] bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Rhythm</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {activeSession.studyMinutes}/{activeSession.breakMinutes}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">focus / break minutes</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Periods</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {pomodoroState.periodNumber}/{activeSession.totalPeriods}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">current run position</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Focused</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatHoursAndMinutes(pomodoroState.focusedMinutes)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">confirmed focus time</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-white/5 p-4">
                  <div className="text-sm text-slate-300">
                    Started {format(new Date(activeSession.startedAt), 'MMM d, yyyy • hh:mm a')}
                  </div>
                  <button
                    type="button"
                    onClick={stopSession}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                  >
                    <PauseCircle className="h-4 w-4" />
                    End Session
                  </button>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock3 className="h-4 w-4 text-sky-300" />
                  <p className="text-sm font-medium">Lo-fi guidance</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {pomodoroState.phase === 'focus'
                    ? 'Keep the noise low, stay inside the selected topic, and push only this block. The break comes automatically.'
                    : pomodoroState.phase === 'break'
                      ? 'Step away for a minute, breathe, stretch, and come back before the next focus loop begins.'
                      : 'The planned focus loops are done. Stop the session when you are ready to store the focused minutes.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.92))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Session Archive</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent focus reels</h2>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
            {sessions.length} recorded session{sessions.length === 1 ? '' : 's'}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-6 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
            No study sessions yet. Start a Pomodoro run to build your lofi archive.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:border-slate-300 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">{session.title}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                      {session.endedAt ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {session.subjectName} • {session.topicName}
                  </p>
                  <p className="text-xs leading-6 text-slate-500">
                    {session.studyMinutes}m focus • {session.breakMinutes}m break •{' '}
                    {session.totalPeriods} periods
                  </p>
                  <p className="text-xs leading-6 text-slate-400">
                    {format(new Date(session.startedAt), 'MMM d, yyyy • hh:mm a')}
                    {session.endedAt
                      ? ` to ${format(new Date(session.endedAt), 'hh:mm a')}`
                      : ' • currently running'}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Focused</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {session.endedAt ? formatHoursAndMinutes(session.durationMinutes) : 'Live'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    className="rounded-full p-3 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${session.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
