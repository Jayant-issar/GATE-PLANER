'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Edit2,
  Lightbulb,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useSyllabus } from '@/context/SyllabusContext';
import { apiRequest } from '@/lib/client-api';

type MistakeType = 'calculation' | 'conceptual' | 'silly' | 'formula' | 'misread' | 'time';

interface Mistake {
  id: string;
  date: string;
  source: string;
  subjectId: string;
  topicId: string;
  questionDescription: string;
  mistakeType: MistakeType;
  whatWentWrong: string;
  learning: string;
  isRepeated: boolean;
  status: 'needs_review' | 'resolved';
}

const MISTAKE_TYPES: { value: MistakeType; label: string; color: string }[] = [
  { value: 'conceptual', label: 'Conceptual Gap', color: 'bg-rose-100 text-rose-700' },
  { value: 'formula', label: 'Formula Forgotten', color: 'bg-orange-100 text-orange-700' },
  { value: 'calculation', label: 'Calculation Error', color: 'bg-amber-100 text-amber-700' },
  { value: 'silly', label: 'Silly Mistake', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'misread', label: 'Misread Question', color: 'bg-blue-100 text-blue-700' },
  { value: 'time', label: 'Time Management', color: 'bg-purple-100 text-purple-700' },
];

export default function MistakesPage() {
  const { subjects } = useSyllabus();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMistake, setEditingMistake] = useState<Mistake | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    source: '',
    subjectId: '',
    topicId: '',
    questionDescription: '',
    mistakeType: 'conceptual' as MistakeType,
    whatWentWrong: '',
    learning: '',
    isRepeated: false,
    status: 'needs_review' as 'needs_review' | 'resolved',
  });

  useEffect(() => {
    apiRequest<{ mistakes: Mistake[] }>('/api/mistakes')
      .then((data) => {
        setMistakes(data.mistakes);
      })
      .catch((error) => {
        console.error('Failed to load mistakes', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const total = mistakes.length;
    const needsReview = mistakes.filter((mistake) => mistake.status === 'needs_review').length;
    const repeated = mistakes.filter((mistake) => mistake.isRepeated).length;
    const counts = mistakes.reduce<Record<string, number>>((accumulator, mistake) => {
      accumulator[mistake.mistakeType] = (accumulator[mistake.mistakeType] ?? 0) + 1;
      return accumulator;
    }, {});
    const topType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None';
    return {
      total,
      needsReview,
      repeated,
      topType: MISTAKE_TYPES.find((item) => item.value === topType)?.label ?? topType,
    };
  }, [mistakes]);

  const filteredMistakes = useMemo(
    () =>
      mistakes.filter((mistake) => {
        const search = searchQuery.toLowerCase();
        return (
          mistake.source.toLowerCase().includes(search) ||
          mistake.whatWentWrong.toLowerCase().includes(search) ||
          mistake.learning.toLowerCase().includes(search)
        );
      }),
    [mistakes, searchQuery]
  );

  const handleOpenModal = (mistake?: Mistake) => {
    if (mistake) {
      setEditingMistake(mistake);
      setFormData({
        date: mistake.date.slice(0, 10),
        source: mistake.source,
        subjectId: mistake.subjectId,
        topicId: mistake.topicId,
        questionDescription: mistake.questionDescription,
        mistakeType: mistake.mistakeType,
        whatWentWrong: mistake.whatWentWrong,
        learning: mistake.learning,
        isRepeated: mistake.isRepeated,
        status: mistake.status,
      });
    } else {
      setEditingMistake(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        source: '',
        subjectId: subjects[0]?.id ?? '',
        topicId: '',
        questionDescription: '',
        mistakeType: 'conceptual',
        whatWentWrong: '',
        learning: '',
        isRepeated: false,
        status: 'needs_review',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.source || !formData.subjectId || !formData.whatWentWrong || !formData.learning) return;

    if (editingMistake) {
      const data = await apiRequest<{ mistake: Mistake }>(`/api/mistakes/${editingMistake.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      setMistakes((prev) => prev.map((mistake) => (mistake.id === editingMistake.id ? data.mistake : mistake)));
    } else {
      const data = await apiRequest<{ mistake: Mistake }>('/api/mistakes', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setMistakes((prev) => [data.mistake, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mistake log?')) return;
    await apiRequest<{ deleted: boolean }>(`/api/mistakes/${id}`, { method: 'DELETE' });
    setMistakes((prev) => prev.filter((mistake) => mistake.id !== id));
  };

  const toggleStatus = async (mistake: Mistake) => {
    const data = await apiRequest<{ mistake: Mistake }>(`/api/mistakes/${mistake.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...mistake,
        status: mistake.status === 'resolved' ? 'needs_review' : 'resolved',
      }),
    });
    setMistakes((prev) => prev.map((item) => (item.id === mistake.id ? data.mistake : item)));
  };

  const activeSubjectTopics = subjects.find((subject) => subject.id === formData.subjectId)?.topics ?? [];

  if (loading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading mistakes...</div>;
  }

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mistake Notebook</h1>
          <p className="text-sm text-slate-500">Track and review mistakes from the backend</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Log Mistake</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><AlertTriangle className="h-5 w-5 text-rose-500" /><h3 className="text-sm font-medium">Total Mistakes</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p></div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><Clock className="h-5 w-5 text-amber-500" /><h3 className="text-sm font-medium">Needs Review</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{stats.needsReview}</p></div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><RefreshCw className="h-5 w-5 text-indigo-500" /><h3 className="text-sm font-medium">Repeated Mistakes</h3></div><p className="mt-2 text-3xl font-bold text-slate-900">{stats.repeated}</p></div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><BrainCircuit className="h-5 w-5 text-emerald-500" /><h3 className="text-sm font-medium">Top Weakness</h3></div><p className="mt-2 text-lg font-bold text-slate-900">{stats.topType}</p></div>
      </div>

      <div className="flex items-center rounded-xl border bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search mistakes..." className="w-full rounded-md border border-slate-200 pl-9 pr-4 py-2 text-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {filteredMistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No mistakes found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMistakes.map((mistake) => {
              const subject = subjects.find((item) => item.id === mistake.subjectId);
              const topic = subject?.topics.find((item) => item.id === mistake.topicId);
              const typeInfo = MISTAKE_TYPES.find((item) => item.value === mistake.mistakeType)!;

              return (
                <div key={mistake.id} className="flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-slate-50 flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">{subject?.name ?? 'Unknown Subject'}</span>
                        {topic && <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{topic.name}</span>}
                      </div>
                      <div className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{mistake.source}</span> • {format(new Date(mistake.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleOpenModal(mistake)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(mistake.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      {mistake.isRepeated && <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">Repeated</span>}
                    </div>
                    {mistake.questionDescription && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Question</h4>
                        <p className="text-sm text-slate-700">{mistake.questionDescription}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1 flex items-center"><AlertCircle className="h-3 w-3 mr-1" /> What went wrong</h4>
                      <p className="text-sm text-slate-700 bg-rose-50/50 p-2 rounded-md border border-rose-100/50">{mistake.whatWentWrong}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1 flex items-center"><Lightbulb className="h-3 w-3 mr-1" /> Learning</h4>
                      <p className="text-sm text-slate-700 bg-emerald-50/50 p-2 rounded-md border border-emerald-100/50">{mistake.learning}</p>
                    </div>
                  </div>
                  <div className="p-4 border-t bg-slate-50">
                    <button onClick={() => toggleStatus(mistake)} className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${mistake.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {mistake.status === 'resolved' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      <span>{mistake.status === 'resolved' ? 'Resolved' : 'Needs Review'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingMistake ? 'Edit Mistake' : 'Log Mistake'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input type="text" value={formData.source} onChange={(event) => setFormData({ ...formData, source: event.target.value })} placeholder="Source" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <select value={formData.subjectId} onChange={(event) => setFormData({ ...formData, subjectId: event.target.value, topicId: '' })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
              <select value={formData.topicId} onChange={(event) => setFormData({ ...formData, topicId: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select topic</option>
                {activeSubjectTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
              <select value={formData.mistakeType} onChange={(event) => setFormData({ ...formData, mistakeType: event.target.value as MistakeType })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {MISTAKE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as 'needs_review' | 'resolved' })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="needs_review">Needs Review</option>
                <option value="resolved">Resolved</option>
              </select>
              <textarea value={formData.questionDescription} onChange={(event) => setFormData({ ...formData, questionDescription: event.target.value })} placeholder="Question or context" className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} />
              <textarea value={formData.whatWentWrong} onChange={(event) => setFormData({ ...formData, whatWentWrong: event.target.value })} placeholder="What went wrong?" className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} />
              <textarea value={formData.learning} onChange={(event) => setFormData({ ...formData, learning: event.target.value })} placeholder="Learning / fix" className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} />
              <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={formData.isRepeated} onChange={(event) => setFormData({ ...formData, isRepeated: event.target.checked })} />
                Repeated mistake
              </label>
            </div>
            <button onClick={handleSave} className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Save Mistake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
