'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  TrendingUp,
  Clock,
  BookOpen,
  Target,
  Video,
  FileQuestion,
  Repeat
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useSyllabus } from '@/context/SyllabusContext';
import { StudyHeatmap } from './StudyHeatmap';

export function Dashboard() {
  const { subjects } = useSyllabus();
  const [mounted, setMounted] = useState(false);

  // Data states
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [pyqTopics, setPyqTopics] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Fetch Weekly Tasks for today
    const savedTasks = localStorage.getItem('weekly_tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      setTodayTasks(parsedTasks[todayKey] || []);
    }

    // Fetch Lectures
    const savedLectures = localStorage.getItem('lectures_data');
    if (savedLectures) {
      setLectures(JSON.parse(savedLectures));
    }

    // Fetch PYQs
    const savedPyqs = localStorage.getItem('pyq_tracked_topics');
    if (savedPyqs) {
      setPyqTopics(JSON.parse(savedPyqs));
    }

    // Fetch Mistakes
    const savedMistakes = localStorage.getItem('mistakes_data');
    if (savedMistakes) {
      setMistakes(JSON.parse(savedMistakes));
    }

    // Fetch Mock Tests
    const savedMockTests = localStorage.getItem('mock_tests_data');
    if (savedMockTests) {
      setMockTests(JSON.parse(savedMockTests));
    } else {
      // Fallback to some mock data if empty just to show the chart
      setMockTests([
        { name: 'Test 1', marksObtained: 45 },
        { name: 'Test 2', marksObtained: 52 },
        { name: 'Test 3', marksObtained: 48 },
        { name: 'Test 4', marksObtained: 61 },
        { name: 'Test 5', marksObtained: 65 },
      ]);
    }
  }, []);

  // Derived Stats
  const lectureStats = useMemo(() => {
    const total = lectures.length;
    const completed = lectures.filter(l => l.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [lectures]);

  const pyqStats = useMemo(() => {
    const total = pyqTopics.reduce((acc, t) => acc + (t.totalQuestions || 0), 0);
    const completed = pyqTopics.reduce((acc, t) => acc + (t.completedQuestions || 0), 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [pyqTopics]);

  const revisionStats = useMemo(() => {
    const total = lectures.filter(l => l.needsRevision).length;
    return { total };
  }, [lectures]);

  const needsReviewMistakes = useMemo(() => {
    return mistakes
      .filter(m => m.status === 'needs_review')
      .slice(0, 4); // Top 4
  }, [mistakes]);

  const chartData = useMemo(() => {
    return mockTests
      .slice()
      .reverse() // Assuming newest first, we want oldest first for chart
      .slice(-10) // Last 10 tests
      .map((t, i) => ({
        name: t.name || `Test ${i + 1}`,
        score: t.marksObtained || 0
      }));
  }, [mockTests]);

  const todayProgress = useMemo(() => {
    const total = todayTasks.length;
    const completed = todayTasks.filter(t => t.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [todayTasks]);

  if (!mounted) {
    return <div className="animate-pulse h-full w-full bg-slate-50 rounded-xl"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back! Here&apos;s your study overview.</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 rounded-lg bg-white px-4 py-2 shadow-sm border border-slate-200">
            <Target className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">{todayProgress}% Daily Goal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Study Plan */}
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Plan</h2>
            <span className="text-sm text-slate-500">{todayTasks.filter(t => !t.completed).length} Tasks Remaining</span>
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
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    task.completed ? 'bg-slate-50' : 'bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                    )}
                    <span
                      className={`font-medium text-sm ${
                        task.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                      {task.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overall Progress */}
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
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${lectureStats.percentage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-700 flex items-center">
                  <FileQuestion className="h-4 w-4 mr-2 text-emerald-500" />
                  PYQs Solved ({pyqStats.completed}/{pyqStats.total})
                </span>
                <span className="text-slate-500">{pyqStats.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pyqStats.percentage}%` }} />
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
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: revisionStats.total > 0 ? '100%' : '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Study Heatmap */}
        <div className="col-span-1 lg:col-span-3">
          <StudyHeatmap />
        </div>

        {/* Mistakes to Review */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-slate-900">Needs Review</h2>
            </div>
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">{needsReviewMistakes.length} Pending</span>
          </div>
          
          {needsReviewMistakes.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              No mistakes pending review. Great job!
            </div>
          ) : (
            <div className="space-y-4">
              {needsReviewMistakes.map((mistake) => {
                const subject = subjects.find(s => s.id === mistake.subjectId);
                return (
                  <div key={mistake.id} className="flex flex-col border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-slate-800 text-sm line-clamp-1">{mistake.source}</p>
                      <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded capitalize whitespace-nowrap ml-2">
                        {mistake.mistakeType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{subject?.name || 'Unknown Subject'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Test Scores */}
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
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
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
