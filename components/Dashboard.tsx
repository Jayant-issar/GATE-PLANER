'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Circle,
  FileQuestion,
  PlayCircle,
  Repeat,
  Target,
  Timer,
  Video,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSyllabus } from '@/context/SyllabusContext';
import { apiRequest } from '@/lib/client-api';
import { toastApiError } from '@/lib/toast';
import { StudyHeatmap } from './StudyHeatmap';

interface DashboardTask {
  id: string;
  title: string;
  type: string;
  completed: boolean;
}

interface DashboardLecture {
  id: string;
  status: string;
  needsRevision: boolean;
}

interface DashboardPYQ {
  id: string;
  totalQuestions: number;
  solvedQuestions: number;
}

interface DashboardMistake {
  id: string;
  source: string;
  status: string;
  subjectId: string;
  mistakeType: string;
}

interface DashboardMockTest {
  id: string;
  name: string;
  marksObtained: number;
}

interface DashboardRevision {
  id: string;
  nextRevisionDate: string;
  status: string;
}

interface DashboardWeakTopic {
  topicId: string;
  topicName: string;
  subjectName: string;
  weaknessScore: number;
}

interface DashboardStudySession {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
}

interface HeatmapEntry {
  date: string;
  hours: number;
}

export function Dashboard() {
  const { subjects } = useSyllabus();
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<DashboardTask[]>([]);
  const [lectures, setLectures] = useState<DashboardLecture[]>([]);
  const [pyqTopics, setPyqTopics] = useState<DashboardPYQ[]>([]);
  const [mistakes, setMistakes] = useState<DashboardMistake[]>([]);
  const [mockTests, setMockTests] = useState<DashboardMockTest[]>([]);
  const [revisions, setRevisions] = useState<DashboardRevision[]>([]);
  const [weakTopics, setWeakTopics] = useState<DashboardWeakTopic[]>([]);
  const [studySessions, setStudySessions] = useState<DashboardStudySession[]>([]);
  const [todayStudyHours, setTodayStudyHours] = useState(0);
  const [activeStudySession, setActiveStudySession] = useState<{
    id: string;
    title: string;
    startedAt: string;
  } | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);

  useEffect(() => {
    apiRequest<{
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
    }>('/api/dashboard')
      .then((data) => {
        setTodayTasks(data.todayTasks);
        setLectures(data.lectures);
        setPyqTopics(data.pyqTopics);
        setMistakes(data.mistakes);
        setMockTests(data.mockTests);
        setRevisions(data.revisions);
        setStudySessions(data.studySessions);
        setTodayStudyHours(data.todayStudyHours);
        setActiveStudySession(data.activeStudySession);
        setWeakTopics(data.weakTopics);
        setHeatmap(data.heatmap);
      })
      .catch((error) => {
        console.error('Failed to load dashboard', error);
        toastApiError(error, 'Failed to load dashboard.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const lectureStats = useMemo(() => {
    const total = lectures.length;
    const completed = lectures.filter((lecture) => lecture.status === 'completed').length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [lectures]);

  const pyqStats = useMemo(() => {
    const total = pyqTopics.reduce((sum, topic) => sum + topic.totalQuestions, 0);
    const solved = pyqTopics.reduce((sum, topic) => sum + topic.solvedQuestions, 0);
    return { total, solved, percentage: total > 0 ? Math.round((solved / total) * 100) : 0 };
  }, [pyqTopics]);

  const revisionStats = useMemo(() => {
    const total = lectures.filter((lecture) => lecture.needsRevision).length;
    const scheduled = revisions.filter((revision) => revision.status === 'pending' || revision.status === 'overdue').length;
    return { total: Math.max(total, scheduled) };
  }, [lectures, revisions]);

  const needsReviewMistakes = useMemo(
    () => mistakes.filter((mistake) => mistake.status === 'needs_review').slice(0, 4),
    [mistakes]
  );

  const chartData = useMemo(
    () =>
      mockTests
        .slice()
        .reverse()
        .slice(-10)
        .map((test, index) => ({
          name: test.name || `Test ${index + 1}`,
          score: test.marksObtained,
        })),
    [mockTests]
  );

  const todayProgress = useMemo(() => {
    const total = todayTasks.length;
    const completed = todayTasks.filter((task) => task.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [todayTasks]);

  if (loading) {
    return <div className="lofi-panel h-full w-full animate-pulse rounded-[2rem]" />;
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(253,230,138,0.42),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.26),_transparent_26%),linear-gradient(135deg,_rgba(255,252,247,0.95),_rgba(240,249,255,0.92)_52%,_rgba(236,253,245,0.9))] p-8 shadow-[0_28px_80px_rgba(15,23,42,0.1)]">
        <div className="absolute -left-8 top-8 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute right-8 top-0 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Daily Broadcast
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Your synced study room: tasks, focused time, revision load, weak spots, and recent momentum.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="lofi-chip flex items-center space-x-2 rounded-full px-4 py-2">
              <Target className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">{todayProgress}% Daily Goal</span>
            </div>
            <div className="lofi-chip flex items-center space-x-2 rounded-full px-4 py-2">
              <Timer className="h-5 w-5 text-sky-600" />
              <span className="text-sm font-medium text-slate-700">{todayStudyHours}h Studied Today</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="lofi-panel rounded-[1.6rem] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Focus Time</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{todayStudyHours}h</p>
          <p className="mt-2 text-sm text-slate-500">Today&apos;s logged study time.</p>
        </div>
        <div className="lofi-panel rounded-[1.6rem] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Open Tasks</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {todayTasks.filter((task) => !task.completed).length}
          </p>
          <p className="mt-2 text-sm text-slate-500">Tasks still waiting for today.</p>
        </div>
        <div className="lofi-panel rounded-[1.6rem] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending Review</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{needsReviewMistakes.length}</p>
          <p className="mt-2 text-sm text-slate-500">Mistakes currently marked for review.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lofi-panel flex flex-col rounded-[1.8rem] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Plan</h2>
            <span className="text-sm text-slate-500">
              {todayTasks.filter((task) => !task.completed).length} Tasks Remaining
            </span>
          </div>
          {todayTasks.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-slate-200" />
              <p className="text-sm text-slate-500">No tasks scheduled for today.</p>
              <p className="mt-1 text-xs text-slate-400">Add tasks in the Weekly Planner.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-[1rem] border p-3 transition ${
                    task.completed ? 'border-slate-100 bg-slate-50/80' : 'bg-white/85 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                    )}
                    <span className={task.completed ? 'text-sm text-slate-500 line-through' : 'text-sm text-slate-700'}>
                      {task.title}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                    {task.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lofi-panel rounded-[1.8rem] p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Overall Progress</h2>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="flex items-center font-medium text-slate-700">
                  <Video className="mr-2 h-4 w-4 text-slate-800" />
                  Lectures ({lectureStats.completed}/{lectureStats.total})
                </span>
                <span className="text-slate-500">{lectureStats.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${lectureStats.percentage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="flex items-center font-medium text-slate-700">
                  <FileQuestion className="mr-2 h-4 w-4 text-emerald-500" />
                  PYQs Solved ({pyqStats.solved}/{pyqStats.total})
                </span>
                <span className="text-slate-500">{pyqStats.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pyqStats.percentage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="flex items-center font-medium text-slate-700">
                  <Repeat className="mr-2 h-4 w-4 text-amber-400" />
                  Pending Revisions
                </span>
                <span className="text-slate-500">{revisionStats.total} Topics</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-300" style={{ width: revisionStats.total > 0 ? '100%' : '0%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="lofi-panel rounded-[1.8rem] p-6">
          <div className="mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Weak Topics</h2>
          </div>
          {weakTopics.length === 0 ? (
            <div className="text-sm text-slate-500">No weak topics computed yet.</div>
          ) : (
            <div className="space-y-3">
              {weakTopics.map((topic) => (
                <div key={topic.topicId} className="rounded-[1rem] border border-slate-100 bg-white/75 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{topic.topicName}</p>
                      <p className="text-xs text-slate-500">{topic.subjectName}</p>
                    </div>
                    <span className="text-sm font-semibold text-rose-600">{topic.weaknessScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-3">
          <StudyHeatmap data={heatmap} />
        </div>

        <div className="lofi-panel rounded-[1.8rem] p-6">
          <div className="mb-4 flex items-center space-x-2">
            <PlayCircle className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-slate-900">Study Sessions</h2>
          </div>
          {activeStudySession ? (
            <div className="mb-4 rounded-[1rem] border border-sky-100 bg-sky-50/90 p-3">
              <p className="text-sm font-medium text-sky-950">{activeStudySession.title}</p>
              <p className="text-xs text-sky-700">
                Active since {new Date(activeStudySession.startedAt).toLocaleTimeString()}
              </p>
            </div>
          ) : null}
          {studySessions.length === 0 ? (
            <div className="text-sm text-slate-500">No study sessions recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {studySessions.slice(0, 4).map((session) => (
                <div key={session.id} className="rounded-[1rem] border border-slate-100 bg-white/75 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{session.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{session.durationMinutes}m</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lofi-panel rounded-[1.8rem] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-slate-900">Needs Review</h2>
            </div>
            <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">
              {needsReviewMistakes.length} Pending
            </span>
          </div>
          {needsReviewMistakes.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">No mistakes pending review.</div>
          ) : (
            <div className="space-y-4">
              {needsReviewMistakes.map((mistake) => {
                const subject = subjects.find((item) => item.id === mistake.subjectId);
                return (
                  <div key={mistake.id} className="flex flex-col border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="mb-1 flex items-start justify-between">
                      <p className="line-clamp-1 text-sm font-medium text-slate-800">{mistake.source}</p>
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-rose-600">
                        {mistake.mistakeType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{subject?.name ?? 'Unknown Subject'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lofi-panel col-span-1 rounded-[1.8rem] p-6 lg:col-span-2">
          <div className="mb-4 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Recent Mock Scores</h2>
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-48 w-full items-center justify-center text-sm text-slate-500">
              No mock test data available yet.
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0f172a"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
