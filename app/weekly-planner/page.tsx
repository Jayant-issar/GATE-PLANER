'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addWeeks,
  differenceInWeeks,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import {
  WeeklyTask,
  WeeklyTaskType,
  useCreateWeeklyTaskMutation,
  useDeleteWeeklyTaskMutation,
  useUpdateWeeklyTaskMutation,
  useWeeklyTasksQuery,
} from '@/features/weekly-planner/hooks';
import { toastValidation } from '@/lib/toast';

const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export default function WeeklyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [newTaskTypes, setNewTaskTypes] = useState<Record<string, WeeklyTaskType>>({});

  const createTaskMutation = useCreateWeeklyTaskMutation();
  const updateTaskMutation = useUpdateWeeklyTaskMutation();
  const deleteTaskMutation = useDeleteWeeklyTaskMutation();

  const gateDate = new Date('2027-02-01');
  const weeksToGate = differenceInWeeks(gateDate, new Date());

  const { weekStart, weekEnd, weekStartKey, weekEndKey } = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    return {
      weekStart: start,
      weekEnd: end,
      weekStartKey: formatDateKey(start),
      weekEndKey: formatDateKey(end),
    };
  }, [currentDate]);

  const tasksQuery = useWeeklyTasksQuery({ from: weekStartKey, to: weekEndKey });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const tasksByDate = useMemo(
    () =>
      (tasksQuery.data ?? []).reduce<Record<string, WeeklyTask[]>>((accumulator, task) => {
        const key = task.date.slice(0, 10);
        accumulator[key] = [...(accumulator[key] ?? []), task];
        return accumulator;
      }, {}),
    [tasksQuery.data]
  );

  const weekProgress = useMemo(() => {
    const allTasks = weekDays.flatMap((day) => tasksByDate[formatDateKey(day)] ?? []);
    const total = allTasks.length;
    const completed = allTasks.filter((task) => task.completed).length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }, [tasksByDate, weekDays]);

  const addTask = (dateKey: string) => {
    const title = newTaskInputs[dateKey]?.trim();
    if (!title) {
      toastValidation('Enter a task title first.');
      return;
    }

    createTaskMutation.mutate(
      {
        title,
        type: newTaskTypes[dateKey] ?? 'lecture',
        date: dateKey,
      },
      {
        onSuccess: () => {
          setNewTaskInputs((current) => ({ ...current, [dateKey]: '' }));
        },
      }
    );
  };

  const getTypeColor = (type: WeeklyTaskType) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-700';
      case 'pyq':
        return 'bg-emerald-100 text-emerald-700';
      case 'revision':
        return 'bg-amber-100 text-amber-700';
      case 'mock_test':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (tasksQuery.isLoading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading weekly tasks...</div>;
  }

  if (tasksQuery.isError) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-rose-600">Failed to load weekly tasks.</div>;
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly Planner</h1>
          <p className="text-sm text-slate-500">Plan your week with backend-synced tasks</p>
        </div>
        <div className="flex items-center space-x-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <Target className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GATE 2027</span>
            <span className="text-sm font-bold text-slate-900">{weeksToGate} Weeks Remaining</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="rounded-md p-2 hover:bg-slate-100 text-slate-600">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-indigo-500" />
            <span className="font-semibold text-slate-700">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="rounded-md p-2 hover:bg-slate-100 text-slate-600">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="ml-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
            Today
          </button>
        </div>

        <div className="flex items-center space-x-4 sm:w-1/3">
          <div className="flex-1">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500">
              <span>Weekly Progress</span>
              <span className="text-indigo-600">{weekProgress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${weekProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const dayTasks = tasksByDate[dateKey] ?? [];
            const isCurrentDay = isToday(day);

            return (
              <div
                key={dateKey}
                className={`flex flex-col w-72 rounded-xl border bg-white shadow-sm overflow-hidden shrink-0 ${
                  isCurrentDay ? 'ring-2 ring-indigo-500 border-transparent' : ''
                }`}
              >
                <div className={`border-b px-4 py-3 flex justify-between items-center ${isCurrentDay ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                  <div>
                    <h3 className={`font-bold ${isCurrentDay ? 'text-indigo-700' : 'text-slate-700'}`}>{format(day, 'EEEE')}</h3>
                    <p className={`text-xs font-medium ${isCurrentDay ? 'text-indigo-500' : 'text-slate-500'}`}>{format(day, 'MMM d')}</p>
                  </div>
                  {isCurrentDay ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">TODAY</span> : null}
                </div>

                <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                  <div className="space-y-2 flex-1">
                    {dayTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-24 text-slate-400">
                        <p className="text-sm italic">No tasks planned</p>
                      </div>
                    ) : (
                      dayTasks.map((task) => (
                        <div key={task.id} className={`group flex flex-col gap-2 rounded-lg border p-2.5 ${task.completed ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white hover:border-indigo-200 shadow-sm'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() =>
                                updateTaskMutation.mutate({
                                  id: task.id,
                                  completed: !task.completed,
                                  date: task.date,
                                })
                              }
                              className="mt-0.5 flex-shrink-0"
                            >
                              {task.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300 hover:text-indigo-500" />}
                            </button>
                            <span className={`flex-1 text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {task.title}
                            </span>
                            <button
                              onClick={() => deleteTaskMutation.mutate({ id: task.id })}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="pl-6">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getTypeColor(task.type)}`}>
                              {task.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 shrink-0">
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Add a task..."
                        value={newTaskInputs[dateKey] ?? ''}
                        onChange={(event) => setNewTaskInputs((current) => ({ ...current, [dateKey]: event.target.value }))}
                        onKeyDown={(event) => event.key === 'Enter' && addTask(dateKey)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newTaskTypes[dateKey] ?? 'lecture'}
                          onChange={(event) => setNewTaskTypes((current) => ({ ...current, [dateKey]: event.target.value as WeeklyTaskType }))}
                          className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600"
                        >
                          <option value="lecture">Lecture</option>
                          <option value="pyq">PYQ</option>
                          <option value="revision">Revision</option>
                          <option value="mock_test">Mock Test</option>
                        </select>
                        <button
                          onClick={() => addTask(dateKey)}
                          disabled={!newTaskInputs[dateKey]?.trim() || createTaskMutation.isPending}
                          className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
