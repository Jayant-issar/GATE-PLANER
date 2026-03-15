'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Edit2,
  Plus,
  Target,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useSyllabus } from '@/context/SyllabusContext';
import { apiRequest } from '@/lib/client-api';
import { toast, toastApiError, toastValidation } from '@/lib/toast';

interface TrackedTopic {
  id: string;
  topicId: string;
  subjectId: string;
  totalQuestions: number;
  solved: number;
  correct: number;
  incorrect: number;
  bookmarked: number;
}

export default function PYQsPage() {
  const { subjects, loading: syllabusLoading } = useSyllabus();
  const [trackedTopics, setTrackedTopics] = useState<TrackedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [newTopicTotal, setNewTopicTotal] = useState<number | ''>('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TrackedTopic | null>(null);

  useEffect(() => {
    apiRequest<{ topics: TrackedTopic[] }>('/api/pyqs')
      .then((data) => {
        setTrackedTopics(data.topics);
      })
      .catch((error) => {
        console.error('Failed to load tracked PYQs', error);
        toastApiError(error, 'Failed to load tracked PYQs.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const trackedSubjectIds = useMemo(
    () => Array.from(new Set(trackedTopics.map((topic) => topic.subjectId))),
    [trackedTopics]
  );

  const trackedSubjects = useMemo(
    () => subjects.filter((subject) => trackedSubjectIds.includes(subject.id)),
    [subjects, trackedSubjectIds]
  );

  const availableSubjects = useMemo(
    () => subjects.filter((subject) => subject.topics.some((topic) => !trackedTopics.some((entry) => entry.topicId === topic.id))),
    [subjects, trackedTopics]
  );

  const activeSubject = useMemo(
    () => subjects.find((subject) => subject.id === activeSubjectId),
    [subjects, activeSubjectId]
  );

  const availableTopics = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.topics.filter((topic) => !trackedTopics.some((entry) => entry.topicId === topic.id));
  }, [activeSubject, trackedTopics]);

  const overallMetrics = useMemo(() => {
    const totalQuestions = trackedTopics.reduce((sum, topic) => sum + topic.totalQuestions, 0);
    const totalSolved = trackedTopics.reduce((sum, topic) => sum + topic.solved, 0);
    const totalCorrect = trackedTopics.reduce((sum, topic) => sum + topic.correct, 0);
    const totalIncorrect = trackedTopics.reduce((sum, topic) => sum + topic.incorrect, 0);
    const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
    const progress = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;
    return { totalQuestions, totalSolved, totalCorrect, totalIncorrect, accuracy, progress };
  }, [trackedTopics]);

  const getSubjectMetrics = (subjectId: string) => {
    const items = trackedTopics.filter((topic) => topic.subjectId === subjectId);
    const solved = items.reduce((sum, topic) => sum + topic.solved, 0);
    const correct = items.reduce((sum, topic) => sum + topic.correct, 0);
    const incorrect = items.reduce((sum, topic) => sum + topic.incorrect, 0);
    const total = items.reduce((sum, topic) => sum + topic.totalQuestions, 0);
    const bookmarked = items.reduce((sum, topic) => sum + topic.bookmarked, 0);
    const accuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0;
    const progress = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { solved, correct, incorrect, total, bookmarked, accuracy, progress };
  };

  const handleAddTopic = async () => {
    if (!activeSubjectId || !selectedTopicId || newTopicTotal === '') {
      toastValidation('Select a subject, topic, and total question count first.');
      return;
    }

    try {
      const data = await apiRequest<{ topic: TrackedTopic }>('/api/pyqs', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: activeSubjectId,
          topicId: selectedTopicId,
          totalQuestions: Number(newTopicTotal),
          solved: 0,
          correct: 0,
          incorrect: 0,
          bookmarked: 0,
          totalTimeMinutes: 0,
        }),
      });

      setTrackedTopics((prev) => [...prev, data.topic]);
      setNewTopicTotal('');
      setIsTopicModalOpen(false);
      toast.success('PYQ topic tracking added');
    } catch (error) {
      toastApiError(error, 'Failed to add tracked topic.');
    }
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic) return;
    try {
      const data = await apiRequest<{ topic: TrackedTopic }>(`/api/pyqs/${editingTopic.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          totalQuestions: editingTopic.totalQuestions,
          solved: editingTopic.solved,
          correct: editingTopic.correct,
          incorrect: editingTopic.incorrect,
          bookmarked: editingTopic.bookmarked,
          totalTimeMinutes: 0,
        }),
      });
      setTrackedTopics((prev) => prev.map((topic) => (topic.id === editingTopic.id ? data.topic : topic)));
      setIsUpdateModalOpen(false);
      setEditingTopic(null);
      toast.success('PYQ topic updated');
    } catch (error) {
      toastApiError(error, 'Failed to update tracked topic.');
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Are you sure you want to stop tracking this topic?')) return;
    try {
      await apiRequest<{ deleted: boolean }>(`/api/pyqs/${id}`, { method: 'DELETE' });
      setTrackedTopics((prev) => prev.filter((topic) => topic.id !== id));
      toast.success('Tracked topic removed');
    } catch (error) {
      toastApiError(error, 'Failed to remove tracked topic.');
    }
  };

  if (loading || syllabusLoading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading PYQ tracker...</div>;
  }

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PYQ Tracker</h1>
          <p className="text-sm text-slate-500">Track previous year questions topic by topic</p>
        </div>
        <button
          onClick={() => {
            const firstSubject = availableSubjects[0];
            if (!firstSubject) return;
            setActiveSubjectId(firstSubject.id);
            setSelectedTopicId(firstSubject.topics[0]?.id ?? '');
            setIsTopicModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Track Topic</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 shrink-0">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Target className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">Total Solved</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{overallMetrics.totalSolved}</span>
            <span className="text-sm text-slate-500">/ {overallMetrics.totalQuestions}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Accuracy</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">{overallMetrics.accuracy}%</span>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Correct</span>
          </div>
          <span className="text-2xl font-bold text-emerald-600">{overallMetrics.totalCorrect}</span>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <XCircle className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-medium">Incorrect</span>
          </div>
          <span className="text-2xl font-bold text-rose-600">{overallMetrics.totalIncorrect}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-10">
        {trackedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-slate-300 bg-slate-50">
            <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No topics tracked yet</p>
          </div>
        ) : (
          trackedSubjects.map((subject) => {
            const metrics = getSubjectMetrics(subject.id);
            const subjectTopics = trackedTopics
              .filter((topic) => topic.subjectId === subject.id)
              .map((topic) => ({
                ...topic,
                name: subject.topics.find((item) => item.id === topic.topicId)?.name ?? 'Unknown Topic',
              }));

            return (
              <div key={subject.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50"
                >
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{subject.name}</h2>
                    <p className="text-xs text-slate-500">{subjectTopics.length} Topics • {metrics.progress}% Complete</p>
                  </div>
                  <div className="text-sm text-slate-600">{metrics.accuracy}% accuracy</div>
                </button>

                {expandedSubject === subject.id && (
                  <div className="p-4 border-t bg-white">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => {
                          setActiveSubjectId(subject.id);
                          setSelectedTopicId(subject.topics.find((topic) => !trackedTopics.some((entry) => entry.topicId === topic.id))?.id ?? '');
                          setIsTopicModalOpen(true);
                        }}
                        className="flex items-center space-x-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Track Topic</span>
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs text-slate-500 border-b">
                          <tr>
                            <th className="pb-3 font-medium">Topic</th>
                            <th className="pb-3 font-medium text-center">Solved</th>
                            <th className="pb-3 font-medium text-center">Correct</th>
                            <th className="pb-3 font-medium text-center">Incorrect</th>
                            <th className="pb-3 font-medium text-center">Bookmarked</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subjectTopics.map((topic) => (
                            <tr key={topic.id}>
                              <td className="py-3 font-medium text-slate-900">{topic.name}</td>
                              <td className="py-3 text-center">{topic.solved}/{topic.totalQuestions}</td>
                              <td className="py-3 text-center text-emerald-600">{topic.correct}</td>
                              <td className="py-3 text-center text-rose-600">{topic.incorrect}</td>
                              <td className="py-3 text-center">
                                <span className="inline-flex items-center gap-1 text-amber-600">
                                  <Bookmark className="h-3.5 w-3.5 fill-amber-100" />
                                  {topic.bookmarked}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingTopic(topic);
                                      setIsUpdateModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Track Topic</h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <select
                value={activeSubjectId}
                onChange={(event) => {
                  setActiveSubjectId(event.target.value);
                  const subject = subjects.find((item) => item.id === event.target.value);
                  setSelectedTopicId(subject?.topics.find((topic) => !trackedTopics.some((entry) => entry.topicId === topic.id))?.id ?? '');
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {availableTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newTopicTotal}
                onChange={(event) => setNewTopicTotal(Number(event.target.value))}
                placeholder="Total questions"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button onClick={handleAddTopic} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Track Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {isUpdateModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Update Topic Progress</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="number" value={editingTopic.totalQuestions} onChange={(event) => setEditingTopic({ ...editingTopic, totalQuestions: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Total questions" />
              <input type="number" value={editingTopic.solved} onChange={(event) => setEditingTopic({ ...editingTopic, solved: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Solved" />
              <input type="number" value={editingTopic.correct} onChange={(event) => setEditingTopic({ ...editingTopic, correct: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Correct" />
              <input type="number" value={editingTopic.incorrect} onChange={(event) => setEditingTopic({ ...editingTopic, incorrect: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Incorrect" />
              <input type="number" value={editingTopic.bookmarked} onChange={(event) => setEditingTopic({ ...editingTopic, bookmarked: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Bookmarked" />
              <button onClick={handleUpdateTopic} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
