'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Filter, 
  Plus, 
  Search,
  BookOpen,
  MoreVertical,
  Flag,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { useSyllabus } from '@/context/SyllabusContext';

interface Lecture {
  id: string;
  subjectId: string;
  title: string;
  duration: number; // in minutes
  status: 'completed' | 'in-progress' | 'pending';
  needsRevision: boolean;
}

export default function LecturesPage() {
  const { subjects } = useSyllabus();
  
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRevisionOnly, setShowRevisionOnly] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  
  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formDuration, setFormDuration] = useState<number | ''>('');
  const [formStatus, setFormStatus] = useState<'completed' | 'in-progress' | 'pending'>('pending');
  const [formNeedsRevision, setFormNeedsRevision] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedLectures = localStorage.getItem('lectures_data');
    if (savedLectures) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLectures(JSON.parse(savedLectures));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('lectures_data', JSON.stringify(lectures));
  }, [lectures]);

  // Calculate progress for subject cards
  const subjectProgress = useMemo(() => {
    return subjects.map(subject => {
      const subjectLectures = lectures.filter(l => l.subjectId === subject.id);
      const completed = subjectLectures.filter(l => l.status === 'completed').length;
      const total = subjectLectures.length;
      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      
      return { ...subject, completed, total, percentage };
    });
  }, [subjects, lectures]);

  // Filter lectures
  const filteredLectures = useMemo(() => {
    return lectures.filter(lecture => {
      const matchSubject = selectedSubject === 'all' || lecture.subjectId === selectedSubject;
      const matchStatus = statusFilter === 'all' || lecture.status === statusFilter;
      const matchRevision = !showRevisionOnly || lecture.needsRevision;
      
      const subjectName = subjects.find(s => s.id === lecture.subjectId)?.name || '';
      const matchSearch = lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          subjectName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchSubject && matchStatus && matchRevision && matchSearch;
    });
  }, [lectures, selectedSubject, statusFilter, searchQuery, showRevisionOnly, subjects]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</span>;
      case 'in-progress':
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"><PlayCircle className="mr-1 h-3 w-3" /> In Progress</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800"><Circle className="mr-1 h-3 w-3" /> Pending</span>;
    }
  };

  const handleOpenModal = (lecture?: Lecture) => {
    if (lecture) {
      setEditingLecture(lecture);
      setFormTitle(lecture.title);
      setFormSubjectId(lecture.subjectId);
      setFormDuration(lecture.duration);
      setFormStatus(lecture.status);
      setFormNeedsRevision(lecture.needsRevision);
    } else {
      setEditingLecture(null);
      setFormTitle('');
      setFormSubjectId(subjects.length > 0 ? subjects[0].id : '');
      setFormDuration('');
      setFormStatus('pending');
      setFormNeedsRevision(false);
    }
    setIsModalOpen(true);
  };

  const handleSaveLecture = () => {
    if (!formTitle.trim() || !formSubjectId || formDuration === '') return;

    if (editingLecture) {
      setLectures(lectures.map(l => l.id === editingLecture.id ? {
        ...l,
        title: formTitle.trim(),
        subjectId: formSubjectId,
        duration: Number(formDuration),
        status: formStatus,
        needsRevision: formNeedsRevision
      } : l));
    } else {
      const newLecture: Lecture = {
        id: crypto.randomUUID(),
        title: formTitle.trim(),
        subjectId: formSubjectId,
        duration: Number(formDuration),
        status: formStatus,
        needsRevision: formNeedsRevision
      };
      setLectures([...lectures, newLecture]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteLecture = (id: string) => {
    if (confirm('Are you sure you want to delete this lecture?')) {
      setLectures(lectures.filter(l => l.id !== id));
    }
  };

  const toggleRevision = (id: string) => {
    setLectures(lectures.map(l => l.id === id ? { ...l, needsRevision: !l.needsRevision } : l));
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lectures Tracker</h1>
          <p className="text-sm text-slate-500">Track your coaching lectures and revision status</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lecture</span>
        </button>
      </div>

      {/* Subject Progress Cards */}
      {subjectProgress.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
          <div 
            onClick={() => setSelectedSubject('all')}
            className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md flex flex-col justify-between ${
              selectedSubject === 'all' ? 'bg-indigo-50 border-indigo-200' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className={`h-4 w-4 ${selectedSubject === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <h3 className={`font-semibold ${selectedSubject === 'all' ? 'text-indigo-900' : 'text-slate-700'}`}>
                  All Subjects
                </h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>{lectures.filter(l => l.status === 'completed').length} / {lectures.length} Lectures</span>
                <span className={selectedSubject === 'all' ? 'text-indigo-600' : ''}>
                  {lectures.length > 0 ? Math.round((lectures.filter(l => l.status === 'completed').length / lectures.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${selectedSubject === 'all' ? 'bg-indigo-500' : 'bg-slate-300'}`}
                  style={{ width: `${lectures.length > 0 ? Math.round((lectures.filter(l => l.status === 'completed').length / lectures.length) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
          {subjectProgress.map(subject => (
            <div 
              key={subject.id} 
              onClick={() => setSelectedSubject(subject.id)}
              className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md flex flex-col justify-between ${
                selectedSubject === subject.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className={`h-4 w-4 ${selectedSubject === subject.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <h3 className={`font-semibold ${selectedSubject === subject.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {subject.name}
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>{subject.completed} / {subject.total} Lectures</span>
                  <span className={selectedSubject === subject.id ? 'text-indigo-600' : ''}>{subject.percentage}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${selectedSubject === subject.id ? 'bg-indigo-500' : 'bg-slate-300'}`}
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center shrink-0">
          <p className="text-sm text-slate-500">No subjects found in syllabus. Please add subjects in the Syllabus page first.</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search lectures..."
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
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-md border-0 bg-transparent py-1.5 pl-2 pr-7 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-0 bg-transparent py-1.5 pl-2 pr-7 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={() => setShowRevisionOnly(!showRevisionOnly)}
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              showRevisionOnly 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flag className={`h-4 w-4 ${showRevisionOnly ? 'fill-amber-700' : ''}`} />
            <span>Needs Revision</span>
          </button>
        </div>
      </div>

      {/* Lectures List */}
      <div className="flex-1 overflow-hidden rounded-xl border bg-white shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">Lecture Details</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Revision</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                      <p>No lectures found matching your filters.</p>
                      <button 
                        onClick={() => { setSelectedSubject('all'); setStatusFilter('all'); setSearchQuery(''); setShowRevisionOnly(false); }}
                        className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLectures.map((lecture) => (
                  <tr key={lecture.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{lecture.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">ID: {lecture.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {subjects.find(s => s.id === lecture.subjectId)?.name || 'Unknown Subject'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-500">
                        <Clock className="mr-1.5 h-4 w-4" />
                        {Math.floor(lecture.duration / 60)}h {lecture.duration % 60}m
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lecture.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleRevision(lecture.id)}
                        className={`p-1.5 rounded-full transition-colors ${
                          lecture.needsRevision 
                            ? 'text-amber-500 hover:bg-amber-50' 
                            : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                        }`}
                        title={lecture.needsRevision ? "Mark as revised" : "Mark for revision"}
                      >
                        <Flag className={`h-4 w-4 ${lecture.needsRevision ? 'fill-amber-500' : ''}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(lecture)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                          title="Edit Lecture"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLecture(lecture.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Delete Lecture"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Lecture Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingLecture ? 'Edit Lecture' : 'Add New Lecture'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {subjects.length === 0 ? (
                <p className="text-sm text-slate-500">The syllabus is empty. Please add subjects in the Syllabus page first before adding a lecture.</p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lecture Title</label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g., ER Model Basics"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select 
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g., 120"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select 
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      id="needs-revision"
                      type="checkbox"
                      checked={formNeedsRevision}
                      onChange={(e) => setFormNeedsRevision(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label htmlFor="needs-revision" className="ml-2 block text-sm text-slate-700">
                      Mark as needs revision
                    </label>
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
                  onClick={handleSaveLecture}
                  disabled={!formTitle.trim() || !formSubjectId || formDuration === '' || subjects.length === 0}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {editingLecture ? 'Save Changes' : 'Add Lecture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
