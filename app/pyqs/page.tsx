'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Bookmark,
  BookOpen,
  Edit2,
  Trash2,
  BarChart3,
  X
} from 'lucide-react';
import { useSyllabus } from '@/context/SyllabusContext';

interface TrackedTopic {
  id: string; // The topic ID from the syllabus
  subjectId: string; // The subject ID from the syllabus
  totalQuestions: number;
  solved: number;
  correct: number;
  incorrect: number;
  bookmarked: number;
}

export default function PYQsPage() {
  const { subjects } = useSyllabus();
  
  const [trackedSubjectIds, setTrackedSubjectIds] = useState<string[]>([]);
  const [trackedTopics, setTrackedTopics] = useState<TrackedTopic[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedSubjects = localStorage.getItem('pyq_tracked_subjects');
    const savedTopics = localStorage.getItem('pyq_tracked_topics');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedSubjects) setTrackedSubjectIds(JSON.parse(savedSubjects));
    if (savedTopics) setTrackedTopics(JSON.parse(savedTopics));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('pyq_tracked_subjects', JSON.stringify(trackedSubjectIds));
    localStorage.setItem('pyq_tracked_topics', JSON.stringify(trackedTopics));
  }, [trackedSubjectIds, trackedTopics]);

  // Modal States
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [newTopicTotal, setNewTopicTotal] = useState<number | ''>('');

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TrackedTopic | null>(null);

  // Derived Data
  const trackedSubjects = useMemo(() => {
    return subjects.filter(s => trackedSubjectIds.includes(s.id));
  }, [subjects, trackedSubjectIds]);

  const availableSubjects = useMemo(() => {
    return subjects.filter(s => !trackedSubjectIds.includes(s.id));
  }, [subjects, trackedSubjectIds]);

  const activeSubject = useMemo(() => {
    return subjects.find(s => s.id === activeSubjectId);
  }, [subjects, activeSubjectId]);

  const availableTopics = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.topics.filter(t => !trackedTopics.some(tt => tt.id === t.id));
  }, [activeSubject, trackedTopics]);

  // Derived Metrics
  const overallMetrics = useMemo(() => {
    let totalSolved = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalQuestions = 0;

    trackedTopics.forEach(t => {
      totalSolved += t.solved;
      totalCorrect += t.correct;
      totalIncorrect += t.incorrect;
      totalQuestions += t.totalQuestions;
    });

    const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
    const progress = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

    return { totalSolved, totalCorrect, totalIncorrect, totalQuestions, accuracy, progress };
  }, [trackedTopics]);

  const getSubjectMetrics = (subjectId: string) => {
    const subTopics = trackedTopics.filter(t => t.subjectId === subjectId);
    let solved = 0, correct = 0, incorrect = 0, total = 0, bookmarked = 0;
    
    subTopics.forEach(t => {
      solved += t.solved;
      correct += t.correct;
      incorrect += t.incorrect;
      total += t.totalQuestions;
      bookmarked += t.bookmarked;
    });

    const accuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0;
    const progress = total > 0 ? Math.round((solved / total) * 100) : 0;

    return { solved, correct, incorrect, total, bookmarked, accuracy, progress, topicCount: subTopics.length };
  };

  // Handlers
  const handleAddSubject = () => {
    if (!selectedSubjectId) return;
    setTrackedSubjectIds([...trackedSubjectIds, selectedSubjectId]);
    setSelectedSubjectId('');
    setIsSubjectModalOpen(false);
    setExpandedSubject(selectedSubjectId);
  };

  const handleAddTopic = () => {
    if (!selectedTopicId || !activeSubjectId || newTopicTotal === '') return;
    const newTopic: TrackedTopic = {
      id: selectedTopicId,
      subjectId: activeSubjectId,
      totalQuestions: Number(newTopicTotal),
      solved: 0,
      correct: 0,
      incorrect: 0,
      bookmarked: 0
    };
    setTrackedTopics([...trackedTopics, newTopic]);
    setSelectedTopicId('');
    setNewTopicTotal('');
    setIsTopicModalOpen(false);
  };

  const handleUpdateTopic = () => {
    if (!editingTopic) return;
    setTrackedTopics(trackedTopics.map(t => t.id === editingTopic.id ? editingTopic : t));
    setIsUpdateModalOpen(false);
    setEditingTopic(null);
  };

  const handleDeleteTopic = (topicId: string) => {
    if (confirm('Are you sure you want to stop tracking this topic?')) {
      setTrackedTopics(trackedTopics.filter(t => t.id !== topicId));
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (confirm('Are you sure you want to stop tracking this subject and all its topics?')) {
      setTrackedSubjectIds(trackedSubjectIds.filter(id => id !== subjectId));
      setTrackedTopics(trackedTopics.filter(t => t.subjectId !== subjectId));
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PYQ Tracker</h1>
          <p className="text-sm text-slate-500">Track your Previous Year Questions progress and accuracy</p>
        </div>
        <button 
          onClick={() => {
            setSelectedSubjectId(availableSubjects.length > 0 ? availableSubjects[0].id : '');
            setIsSubjectModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Track Subject</span>
        </button>
      </div>

      {/* Overall Metrics Cards */}
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
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${overallMetrics.progress}%` }} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Accuracy</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{overallMetrics.accuracy}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${overallMetrics.accuracy}%` }} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Correct</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600">{overallMetrics.totalCorrect}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <XCircle className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-medium">Incorrect</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-600">{overallMetrics.totalIncorrect}</span>
          </div>
        </div>
      </div>

      {/* Subjects List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-10">
        {trackedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-slate-300 bg-slate-50">
            <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No subjects tracked yet</p>
            <button 
              onClick={() => {
                setSelectedSubjectId(availableSubjects.length > 0 ? availableSubjects[0].id : '');
                setIsSubjectModalOpen(true);
              }}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Track your first subject
            </button>
          </div>
        ) : (
          trackedSubjects.map(subject => {
            const isExpanded = expandedSubject === subject.id;
            const metrics = getSubjectMetrics(subject.id);
            const subjectTopics = trackedTopics.filter(t => t.subjectId === subject.id).map(tt => {
              const topicDetails = subject.topics.find(t => t.id === tt.id);
              return { ...tt, name: topicDetails?.name || 'Unknown Topic' };
            });

            return (
              <div key={subject.id} className="rounded-xl border bg-white shadow-sm overflow-hidden transition-all">
                {/* Subject Header */}
                <div 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'border-b bg-slate-50' : ''}`}
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                >
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                    <div className={`p-1 rounded-md ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}>
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{subject.name}</h2>
                      <p className="text-xs text-slate-500">{metrics.topicCount} Topics • {metrics.progress}% Completed</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-500 text-xs">Accuracy</span>
                      <span className="font-bold text-slate-700">{metrics.accuracy}%</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-slate-500 text-xs">Solved</span>
                      <span className="font-bold text-slate-700">{metrics.solved}/{metrics.total}</span>
                    </div>
                    <div className="flex space-x-3">
                      <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        <span className="font-semibold text-xs">{metrics.correct}</span>
                      </div>
                      <div className="flex items-center text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        <span className="font-semibold text-xs">{metrics.incorrect}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Topics List (Expanded) */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Topics</h3>
                      <button 
                        onClick={() => { 
                          setActiveSubjectId(subject.id); 
                          const availTopics = subject.topics.filter(t => !trackedTopics.some(tt => tt.id === t.id));
                          setSelectedTopicId(availTopics.length > 0 ? availTopics[0].id : '');
                          setIsTopicModalOpen(true); 
                        }}
                        className="flex items-center space-x-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Track Topic</span>
                      </button>
                    </div>

                    {subjectTopics.length === 0 ? (
                      <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                        No topics tracked yet. Track a topic to start logging PYQs.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-xs text-slate-500 border-b">
                            <tr>
                              <th className="pb-3 font-medium">Topic Name</th>
                              <th className="pb-3 font-medium text-center">Progress</th>
                              <th className="pb-3 font-medium text-center">Correct</th>
                              <th className="pb-3 font-medium text-center">Incorrect</th>
                              <th className="pb-3 font-medium text-center">Bookmarked</th>
                              <th className="pb-3 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {subjectTopics.map(topic => {
                              const topicProgress = topic.totalQuestions > 0 ? Math.round((topic.solved / topic.totalQuestions) * 100) : 0;
                              return (
                                <tr key={topic.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 font-medium text-slate-900">{topic.name}</td>
                                  <td className="py-3">
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-semibold text-slate-700">{topic.solved}/{topic.totalQuestions}</span>
                                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${topicProgress}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 text-center font-medium text-emerald-600">{topic.correct}</td>
                                  <td className="py-3 text-center font-medium text-rose-600">{topic.incorrect}</td>
                                  <td className="py-3 text-center">
                                    <div className="flex items-center justify-center space-x-1 text-amber-600">
                                      <Bookmark className="h-3.5 w-3.5 fill-amber-100" />
                                      <span className="font-medium">{topic.bookmarked}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button 
                                        onClick={() => { setEditingTopic({...topic}); setIsUpdateModalOpen(true); }}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                        title="Update Progress"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteTopic(topic.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                        title="Stop Tracking"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      
      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Track Subject</h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {availableSubjects.length === 0 ? (
                <p className="text-sm text-slate-500">All subjects from the syllabus are already being tracked, or the syllabus is empty. Add subjects in the Syllabus page first.</p>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Subject</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSubject}
                  disabled={!selectedSubjectId || availableSubjects.length === 0}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Track Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
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
              {availableTopics.length === 0 ? (
                <p className="text-sm text-slate-500">All topics for this subject are already being tracked, or the subject has no topics. Add topics in the Syllabus page first.</p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Topic</label>
                    <select 
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {availableTopics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total PYQs Available</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newTopicTotal}
                      onChange={(e) => setNewTopicTotal(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g., 50"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  onClick={() => setIsTopicModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTopic}
                  disabled={!selectedTopicId || newTopicTotal === '' || availableTopics.length === 0}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Track Topic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {isUpdateModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Update Progress</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-semibold text-slate-800">
                {subjects.find(s => s.id === editingTopic.subjectId)?.topics.find(t => t.id === editingTopic.id)?.name || 'Unknown Topic'}
              </p>
              <p className="text-xs text-slate-500">Total Available PYQs: {editingTopic.totalQuestions}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Solved</label>
                  <input 
                    type="number" 
                    min="0"
                    max={editingTopic.totalQuestions}
                    value={editingTopic.solved}
                    onChange={(e) => setEditingTopic({...editingTopic, solved: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bookmarked</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editingTopic.bookmarked}
                    onChange={(e) => setEditingTopic({...editingTopic, bookmarked: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correct</label>
                  <input 
                    type="number" 
                    min="0"
                    max={editingTopic.solved}
                    value={editingTopic.correct}
                    onChange={(e) => setEditingTopic({...editingTopic, correct: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Incorrect</label>
                  <input 
                    type="number" 
                    min="0"
                    max={editingTopic.solved - editingTopic.correct}
                    value={editingTopic.incorrect}
                    onChange={(e) => setEditingTopic({...editingTopic, incorrect: Number(e.target.value)})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateTopic}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
