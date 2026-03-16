'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Plus,
  Target,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  type MockTest,
  type TestType,
  useCreateMockTestMutation,
  useDeleteMockTestMutation,
  useMockTestsQuery,
} from '@/features/mock-tests/hooks';
import { type Subject, useSubjectsQuery } from '@/features/syllabus/hooks';
import { toastValidation } from '@/lib/toast';

const EMPTY_SUBJECTS: Subject[] = [];
const EMPTY_TESTS: MockTest[] = [];

export default function MockTestsPage() {
  const subjectsQuery = useSubjectsQuery();
  const mockTestsQuery = useMockTestsQuery();
  const createMockTestMutation = useCreateMockTestMutation();
  const deleteMockTestMutation = useDeleteMockTestMutation();
  const subjects = subjectsQuery.data ?? EMPTY_SUBJECTS;
  const tests = mockTestsQuery.data ?? EMPTY_TESTS;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'full' as TestType,
    subjectIds: [] as string[],
    topicIds: [] as string[],
    totalMarks: 100,
    marksObtained: 0,
    totalQuestions: 65,
    correctQuestions: 0,
    wrongQuestions: 0,
    durationMinutes: 180,
  });

  const stats = useMemo(() => {
    if (tests.length === 0) return { avgScore: '0.0', avgAccuracy: '0.0', totalTests: 0, highestScore: '0.0' };
    const fullTests = tests.filter((test) => test.type === 'full');
    const avgScore =
      fullTests.length > 0 ? fullTests.reduce((sum, test) => sum + test.marksObtained, 0) / fullTests.length : 0;
    const avgAccuracy = tests.reduce((sum, test) => sum + test.accuracy, 0) / tests.length;
    const highestScore = fullTests.length > 0 ? Math.max(...fullTests.map((test) => test.marksObtained)) : 0;
    return {
      avgScore: avgScore.toFixed(1),
      avgAccuracy: avgAccuracy.toFixed(1),
      totalTests: tests.length,
      highestScore: highestScore.toFixed(1),
    };
  }, [tests]);

  const activeSubject = subjects.find((subject) => subject.id === formData.subjectIds[0]);
  const availableTopics = formData.type === 'partial' && formData.subjectIds.length === 1 ? activeSubject?.topics ?? [] : [];

  const handleSaveTest = async () => {
    if (!formData.name.trim()) {
      toastValidation('Enter a test name first.');
      return;
    }

    const correct = Number(formData.correctQuestions);
    const wrong = Number(formData.wrongQuestions);
    const totalQ = Number(formData.totalQuestions);
    const unattempted = totalQ - correct - wrong;
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0;

    createMockTestMutation.mutate(
      {
        ...formData,
        unattemptedQuestions: unattempted,
        accuracy,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setFormData({
            name: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            type: 'full',
            subjectIds: [],
            topicIds: [],
            totalMarks: 100,
            marksObtained: 0,
            totalQuestions: 65,
            correctQuestions: 0,
            wrongQuestions: 0,
            durationMinutes: 180,
          });
        },
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this test record?')) return;
    deleteMockTestMutation.mutate({ id });
  };

  if (mockTestsQuery.isLoading || subjectsQuery.isLoading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading mock tests...</div>;
  }

  if (mockTestsQuery.isError || subjectsQuery.isError) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-rose-600">Failed to load mock tests.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mock Tests</h1>
          <p className="text-sm text-slate-500">Track real test history from MongoDB</p>
        </div>
        <button onClick={() => setShowForm((prev) => !prev)} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add New Test'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500"><Target className="h-5 w-5 text-indigo-500" /><h3 className="text-sm font-medium">Total Tests</h3></div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalTests}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500"><Award className="h-5 w-5 text-emerald-500" /><h3 className="text-sm font-medium">Highest FLT Score</h3></div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.highestScore}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500"><BarChart3 className="h-5 w-5 text-blue-500" /><h3 className="text-sm font-medium">Avg FLT Score</h3></div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.avgScore}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500"><CheckCircle2 className="h-5 w-5 text-purple-500" /><h3 className="text-sm font-medium">Avg Accuracy</h3></div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.avgAccuracy}%</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Record Test Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input type="text" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Test name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={formData.type === 'full'} onChange={() => setFormData({ ...formData, type: 'full', subjectIds: [], topicIds: [], totalMarks: 100, totalQuestions: 65 })} />
                  Full
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={formData.type === 'partial'} onChange={() => setFormData({ ...formData, type: 'partial', totalMarks: 50, totalQuestions: 33 })} />
                  Partial
                </label>
              </div>
              {formData.type === 'partial' && (
                <>
                  <select value={formData.subjectIds[0] ?? ''} onChange={(event) => setFormData({ ...formData, subjectIds: event.target.value ? [event.target.value] : [], topicIds: [] })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                  {availableTopics.length > 0 && (
                    <select multiple value={formData.topicIds} onChange={(event) => setFormData({ ...formData, topicIds: Array.from(event.target.selectedOptions).map((option) => option.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-32">
                      {availableTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>{topic.name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
            <div className="space-y-4">
              <input type="number" value={formData.totalMarks} onChange={(event) => setFormData({ ...formData, totalMarks: Number(event.target.value) })} placeholder="Total marks" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input type="number" value={formData.marksObtained} onChange={(event) => setFormData({ ...formData, marksObtained: Number(event.target.value) })} placeholder="Marks obtained" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input type="number" value={formData.totalQuestions} onChange={(event) => setFormData({ ...formData, totalQuestions: Number(event.target.value) })} placeholder="Total questions" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input type="number" value={formData.correctQuestions} onChange={(event) => setFormData({ ...formData, correctQuestions: Number(event.target.value) })} placeholder="Correct questions" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input type="number" value={formData.wrongQuestions} onChange={(event) => setFormData({ ...formData, wrongQuestions: Number(event.target.value) })} placeholder="Wrong questions" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input type="number" value={formData.durationMinutes} onChange={(event) => setFormData({ ...formData, durationMinutes: Number(event.target.value) })} placeholder="Duration in minutes" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={handleSaveTest} className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Test Result
          </button>
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {tests.length === 0 ? (
            <div className="p-6 text-slate-500">No tests recorded yet.</div>
          ) : (
            tests.map((test) => (
              <div key={test.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{test.name}</p>
                  <p className="text-sm text-slate-500">
                    {format(new Date(test.date), 'MMM d, yyyy')} • {test.type.toUpperCase()} • {test.marksObtained}/{test.totalMarks}
                  </p>
                </div>
                <button onClick={() => handleDelete(test.id)} className="rounded-md px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
