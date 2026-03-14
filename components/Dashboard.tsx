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
    return <div className="animate-pulse h-full w-full bg-slate-50 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Here&apos;s your backend-synced study overview.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-slate-200">
            <Target className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">{todayProgress}% Daily Goal</span>
          </div>
          <div className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-slate-200">
            <Timer className="h-5 w-5 text-indigo-500" />
            <span className="text-sm font-medium text-slate-600">{todayStudyHours}h Studied Today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Plan</h2>
            <span className="text-sm text-slate-500">
              {todayTasks.filter((task) => !task.completed).length} Tasks Remaining
            </span>
          </div>
          {todayTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-slate-500 text-sm">No tasks scheduled for today.</p>
              <p className="text-slate-400 text-xs mt-1">Add tasks in the Weekly Planner.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    task.completed ? 'bg-slate-50' : 'bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                    )}
                    <span className={task.completed ? 'text-slate-500 line-through text-sm' : 'text-slate-700 text-sm'}>
                      {task.title}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                    {task.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Overall Progress</h2>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-700 flex items-center">
                  <Video className="h-4 w-4 mr-2 text-indigo-500" />
                  Lectures ({lectureStats.completed}/{lectureStats.total})
                </span>
                <span className="text-slate-500">{lectureStats.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${lectureStats.percentage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-700 flex items-center">
                  <FileQuestion className="h-4 w-4 mr-2 text-emerald-500" />
                  PYQs Solved ({pyqStats.solved}/{pyqStats.total})
                </span>
                <span className="text-slate-500">{pyqStats.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pyqStats.percentage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-700 flex items-center">
                  <Repeat className="h-4 w-4 mr-2 text-amber-500" />
                  Pending Revisions
                </span>
                <span className="text-slate-500">{revisionStats.total} Topics</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-500" style={{ width: revisionStats.total > 0 ? '100%' : '0%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">Weak Topics</h2>
            </div>
          </div>
          {weakTopics.length === 0 ? (
            <div className="text-sm text-slate-500">No weak topics computed yet.</div>
          ) : (
            <div className="space-y-3">
              {weakTopics.map((topic) => (
                <div key={topic.topicId} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{topic.topicName}</p>
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

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PlayCircle className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-900">Study Sessions</h2>
            </div>
          </div>
          {activeStudySession ? (
            <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-sm font-medium text-indigo-900">{activeStudySession.title}</p>
              <p className="text-xs text-indigo-700">
                Active since {new Date(activeStudySession.startedAt).toLocaleTimeString()}
              </p>
            </div>
          ) : null}
          {studySessions.length === 0 ? (
            <div className="text-sm text-slate-500">No study sessions recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {studySessions.slice(0, 4).map((session) => (
                <div key={session.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{session.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {session.durationMinutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-slate-900">Needs Review</h2>
            </div>
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              {needsReviewMistakes.length} Pending
            </span>
          </div>
          {needsReviewMistakes.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">No mistakes pending review.</div>
          ) : (
            <div className="space-y-4">
              {needsReviewMistakes.map((mistake) => {
                const subject = subjects.find((item) => item.id === mistake.subjectId);
                return (
                  <div key={mistake.id} className="flex flex-col border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-slate-800 text-sm line-clamp-1">{mistake.source}</p>
                      <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded capitalize">
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

        <div className="col-span-1 rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Recent Mock Scores</h2>
          </div>
          {chartData.length === 0 ? (
            <div className="h-48 w-full flex items-center justify-center text-slate-500 text-sm">
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
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
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
