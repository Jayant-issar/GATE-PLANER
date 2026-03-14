'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';
import { useSyllabus } from '@/context/SyllabusContext';

type MistakeType = 'calculation' | 'conceptual' | 'silly' | 'formula' | 'misread' | 'time';

interface Mistake {
  id: string;
  date: string;
  source: string; // e.g., "Made Easy FLT 1", "PYQ 2021"
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
  const [mounted, setMounted] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMistake, setEditingMistake] = useState<Mistake | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form States
  const [formData, setFormData] = useState({
    date: '',
    source: '',
    subjectId: '',
    topicId: '',
    questionDescription: '',
    mistakeType: 'conceptual' as MistakeType,
    whatWentWrong: '',
    learning: '',
    isRepeated: false,
    status: 'needs_review' as 'needs_review' | 'resolved'
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('mistakes_data');
    if (saved) {
      setMistakes(JSON.parse(saved));
    }
    setFormData(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('mistakes_data', JSON.stringify(mistakes));
    }
  }, [mistakes, mounted]);

  const handleOpenModal = (mistake?: Mistake) => {
    if (mistake) {
      setEditingMistake(mistake);
      setFormData({
        date: mistake.date,
        source: mistake.source,
        subjectId: mistake.subjectId,
        topicId: mistake.topicId,
        questionDescription: mistake.questionDescription,
        mistakeType: mistake.mistakeType,
        whatWentWrong: mistake.whatWentWrong,
        learning: mistake.learning,
        isRepeated: mistake.isRepeated,
        status: mistake.status
      });
    } else {
      setEditingMistake(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        source: '',
        subjectId: subjects.length > 0 ? subjects[0].id : '',
        topicId: '',
        questionDescription: '',
        mistakeType: 'conceptual',
        whatWentWrong: '',
        learning: '',
        isRepeated: false,
        status: 'needs_review'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.source || !formData.subjectId || !formData.whatWentWrong || !formData.learning) return;

    if (editingMistake) {
      setMistakes(mistakes.map(m => m.id === editingMistake.id ? { ...formData, id: m.id } as Mistake : m));
    } else {
      const newMistake: Mistake = {
        ...formData,
        id: crypto.randomUUID()
      };
      setMistakes([newMistake, ...mistakes]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this mistake log?')) {
      setMistakes(mistakes.filter(m => m.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setMistakes(mistakes.map(m => {
      if (m.id === id) {
        return { ...m, status: m.status === 'resolved' ? 'needs_review' : 'resolved' };
      }
      return m;
    }));
  };

  // Derived Data & Stats
  const stats = useMemo(() => {
    const total = mistakes.length;
    const needsReview = mistakes.filter(m => m.status === 'needs_review').length;
    const repeated = mistakes.filter(m => m.isRepeated).length;
    
    // Find most common mistake type
    const typeCounts = mistakes.reduce((acc, m) => {
      acc[m.mistakeType] = (acc[m.mistakeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let topType = 'None';
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topType = MISTAKE_TYPES.find(t => t.value === type)?.label || type;
      }
    });

    return { total, needsReview, repeated, topType };
  }, [mistakes]);

  const filteredMistakes = useMemo(() => {
    return mistakes.filter(m => {
      const matchSubject = subjectFilter === 'all' || m.subjectId === subjectFilter;
      const matchType = typeFilter === 'all' || m.mistakeType === typeFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        m.source.toLowerCase().includes(searchLower) ||
        m.questionDescription.toLowerCase().includes(searchLower) ||
        m.whatWentWrong.toLowerCase().includes(searchLower) ||
        m.learning.toLowerCase().includes(searchLower);

      return matchSubject && matchType && matchStatus && matchSearch;
    });
  }, [mistakes, subjectFilter, typeFilter, statusFilter, searchQuery]);

  const activeSubjectTopics = useMemo(() => {
    return subjects.find(s => s.id === formData.subjectId)?.topics || [];
  }, [subjects, formData.subjectId]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mistake Notebook</h1>
          <p className="text-sm text-slate-500">Track your errors, analyze them, and never repeat them.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Log Mistake</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h3 className="text-sm font-medium">Total Mistakes</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-medium">Needs Review</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.needsReview}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-medium">Repeated Mistakes</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.repeated}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <BrainCircuit className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-medium">Top Weakness</h3>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 truncate" title={stats.topType}>{stats.topType}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search mistakes, learnings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 border-r pr-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-md border-0 bg-transparent py-1.5 pl-2 pr-7 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border-0 bg-transparent py-1.5 pl-2 pr-7 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer border-r"
          >
            <option value="all">All Types</option>
            {MISTAKE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-0 bg-transparent py-1.5 pl-2 pr-7 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="needs_review">Needs Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Mistakes Grid */}
      <div className="flex-1 overflow-y-auto pb-6">
        {filteredMistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No mistakes found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              {mistakes.length === 0 
                ? "You haven't logged any mistakes yet. Keep taking mock tests and log your errors here to improve!" 
                : "No mistakes match your current filters."}
            </p>
            {mistakes.length > 0 && (
              <button 
                onClick={() => { setSubjectFilter('all'); setTypeFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMistakes.map(mistake => {
              const subject = subjects.find(s => s.id === mistake.subjectId);
              const topic = subject?.topics.find(t => t.id === mistake.topicId);
              const typeInfo = MISTAKE_TYPES.find(t => t.value === mistake.mistakeType)!;

              return (
                <div key={mistake.id} className={`flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${mistake.status === 'resolved' ? 'opacity-75' : ''}`}>
                  {/* Card Header */}
                  <div className="p-4 border-b bg-slate-50 flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                          {subject?.name || 'Unknown Subject'}
                        </span>
                        {topic && (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 truncate max-w-[120px]">
                            {topic.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center">
                        <span className="font-medium text-slate-700">{mistake.source}</span>
                        <span className="mx-1.5">•</span>
                        {format(new Date(mistake.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleOpenModal(mistake)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(mistake.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {mistake.isRepeated && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                          <RefreshCw className="mr-1 h-3 w-3" /> Repeated
                        </span>
                      )}
                    </div>

                    {mistake.questionDescription && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Context / Question</h4>
                        <p className="text-sm text-slate-700 line-clamp-2">{mistake.questionDescription}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> What went wrong
                      </h4>
                      <p className="text-sm text-slate-700 bg-rose-50/50 p-2 rounded-md border border-rose-100/50">{mistake.whatWentWrong}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1 flex items-center">
                        <Lightbulb className="h-3 w-3 mr-1" /> Learning / Fix
                      </h4>
                      <p className="text-sm text-slate-700 bg-emerald-50/50 p-2 rounded-md border border-emerald-100/50">{mistake.learning}</p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                    <button
                      onClick={() => toggleStatus(mistake.id)}
                      className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        mistake.status === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {mistake.status === 'resolved' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Resolved</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>Needs Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingMistake ? 'Edit Mistake Log' : 'Log New Mistake'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-5">
              {subjects.length === 0 ? (
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">No subjects available</h3>
                      <p className="mt-2 text-sm text-amber-700">
                        Please add subjects in the Syllabus page first before logging mistakes.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Source (Test/PYQ Name) *</label>
                      <input 
                        type="text" 
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        placeholder="e.g., Made Easy FLT 3, Gate 2021"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                      <select 
                        value={formData.subjectId}
                        onChange={(e) => setFormData({...formData, subjectId: e.target.value, topicId: ''})}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Topic (Optional)</label>
                      <select 
                        value={formData.topicId}
                        onChange={(e) => setFormData({...formData, topicId: e.target.value})}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={activeSubjectTopics.length === 0}
                      >
                        <option value="">Select Topic</option>
                        {activeSubjectTopics.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mistake Type *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MISTAKE_TYPES.map(type => (
                        <label 
                          key={type.value}
                          className={`flex items-center justify-center px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors ${
                            formData.mistakeType === type.value 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="mistakeType" 
                            value={type.value}
                            checked={formData.mistakeType === type.value}
                            onChange={() => setFormData({...formData, mistakeType: type.value as MistakeType})}
                            className="sr-only"
                          />
                          {type.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Context (Optional)</label>
                    <textarea 
                      value={formData.questionDescription}
                      onChange={(e) => setFormData({...formData, questionDescription: e.target.value})}
                      placeholder="Briefly describe the question or context..."
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-rose-600 mb-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> What went wrong? *
                    </label>
                    <textarea 
                      value={formData.whatWentWrong}
                      onChange={(e) => setFormData({...formData, whatWentWrong: e.target.value})}
                      placeholder="e.g., I forgot the formula for average waiting time and used turnaround time instead."
                      rows={3}
                      className="w-full rounded-lg border border-rose-200 bg-rose-50/30 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-600 mb-1 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-1" /> Learning / Fix *
                    </label>
                    <textarea 
                      value={formData.learning}
                      onChange={(e) => setFormData({...formData, learning: e.target.value})}
                      placeholder="e.g., Average Waiting Time = Turnaround Time - Burst Time. Need to revise CPU scheduling formulas."
                      rows={3}
                      className="w-full rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center">
                      <input
                        id="is-repeated"
                        type="checkbox"
                        checked={formData.isRepeated}
                        onChange={(e) => setFormData({...formData, isRepeated: e.target.checked})}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <label htmlFor="is-repeated" className="ml-2 block text-sm font-medium text-slate-700">
                        I have made this mistake before
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="radio" 
                          name="status" 
                          value="needs_review"
                          checked={formData.status === 'needs_review'}
                          onChange={() => setFormData({...formData, status: 'needs_review'})}
                          className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        <span className="ml-2 text-sm font-medium text-amber-700">Needs Review</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="radio" 
                          name="status" 
                          value="resolved"
                          checked={formData.status === 'resolved'}
                          onChange={() => setFormData({...formData, status: 'resolved'})}
                          className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span className="ml-2 text-sm font-medium text-emerald-700">Resolved</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formData.source || !formData.subjectId || !formData.whatWentWrong || !formData.learning || subjects.length === 0}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {editingMistake ? 'Save Changes' : 'Log Mistake'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
