'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  Target, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { useSyllabus } from '@/context/SyllabusContext';

type TestType = 'full' | 'partial';

interface MockTest {
  id: string;
  name: string;
  date: string;
  type: TestType;
  subjects: string[];
  topics: string[];
  totalMarks: number;
  marksObtained: number;
  totalQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  unattemptedQuestions: number;
  accuracy: number;
  durationMinutes: number;
}

const MOCK_DATA: MockTest[] = [
  {
    id: '1',
    name: 'Made Easy FLT 1',
    date: '2026-03-01',
    type: 'full',
    subjects: ['Computer Networks', 'Databases', 'Operating Systems'],
    topics: [],
    totalMarks: 100,
    marksObtained: 65.33,
    totalQuestions: 65,
    correctQuestions: 42,
    wrongQuestions: 12,
    unattemptedQuestions: 11,
    accuracy: 77.7,
    durationMinutes: 180,
  },
  {
    id: '2',
    name: 'DBMS Subject Test',
    date: '2026-03-10',
    type: 'partial',
    subjects: ['Databases'],
    topics: ['Normalization', 'SQL', 'Transactions'],
    totalMarks: 50,
    marksObtained: 42.66,
    totalQuestions: 33,
    correctQuestions: 25,
    wrongQuestions: 4,
    unattemptedQuestions: 4,
    accuracy: 86.2,
    durationMinutes: 90,
  }
];

export default function MockTestsPage() {
  const { subjects: syllabusSubjects } = useSyllabus();
  const [mounted, setMounted] = useState(false);
  const [tests, setTests] = useState<MockTest[]>(MOCK_DATA);
  const [showForm, setShowForm] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'full' as TestType,
    subjects: [] as string[],
    topics: [] as string[],
    totalMarks: 100,
    marksObtained: 0,
    totalQuestions: 65,
    correctQuestions: 0,
    wrongQuestions: 0,
    durationMinutes: 180,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('mock_tests_data');
    if (saved) {
      setTests(JSON.parse(saved));
    }
    setFormData(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('mock_tests_data', JSON.stringify(tests));
    }
  }, [tests, mounted]);

  const handleSubjectToggle = (subjectName: string) => {
    setFormData(prev => {
      const current = prev.subjects;
      if (current.includes(subjectName)) {
        return { ...prev, subjects: current.filter(s => s !== subjectName), topics: [] };
      } else {
        return { ...prev, subjects: [...current, subjectName], topics: [] };
      }
    });
  };

  const handleTopicToggle = (topicName: string) => {
    setFormData(prev => {
      const current = prev.topics;
      if (current.includes(topicName)) {
        return { ...prev, topics: current.filter(t => t !== topicName) };
      } else {
        return { ...prev, topics: [...current, topicName] };
      }
    });
  };

  const handleSaveTest = () => {
    const correct = Number(formData.correctQuestions);
    const wrong = Number(formData.wrongQuestions);
    const totalQ = Number(formData.totalQuestions);
    const unattempted = totalQ - correct - wrong;
    
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

    const newTest: MockTest = {
      id: crypto.randomUUID(),
      name: formData.name,
      date: formData.date,
      type: formData.type,
      subjects: formData.type === 'full' ? syllabusSubjects.map(s => s.name) : formData.subjects,
      topics: formData.type === 'partial' && formData.subjects.length === 1 
        ? formData.topics
        : [],
      totalMarks: Number(formData.totalMarks),
      marksObtained: Number(formData.marksObtained),
      totalQuestions: totalQ,
      correctQuestions: correct,
      wrongQuestions: wrong,
      unattemptedQuestions: unattempted,
      accuracy: Number(accuracy.toFixed(1)),
      durationMinutes: Number(formData.durationMinutes),
    };

    setTests([newTest, ...tests]);
    setShowForm(false);
    // Reset form
    setFormData({
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'full',
      subjects: [],
      topics: [],
      totalMarks: 100,
      marksObtained: 0,
      totalQuestions: 65,
      correctQuestions: 0,
      wrongQuestions: 0,
      durationMinutes: 180,
    });
  };

  const stats = useMemo(() => {
    if (tests.length === 0) return { avgScore: 0, avgAccuracy: 0, totalTests: 0, highestScore: 0 };
    
    const fullLengthTests = tests.filter(t => t.type === 'full');
    const avgScore = fullLengthTests.length > 0 
      ? fullLengthTests.reduce((acc, t) => acc + t.marksObtained, 0) / fullLengthTests.length 
      : 0;
      
    const avgAccuracy = tests.reduce((acc, t) => acc + t.accuracy, 0) / tests.length;
    const highestScore = fullLengthTests.length > 0 
      ? Math.max(...fullLengthTests.map(t => t.marksObtained))
      : 0;

    return {
      avgScore: avgScore.toFixed(1),
      avgAccuracy: avgAccuracy.toFixed(1),
      totalTests: tests.length,
      highestScore: highestScore.toFixed(1)
    };
  }, [tests]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mock Tests</h1>
          <p className="text-sm text-slate-500">Track your performance, accuracy, and weak areas</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {showForm ? <XCircle className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add New Test'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <Target className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-medium">Total Tests</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalTests}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <Award className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-medium">Highest FLT Score</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.highestScore} <span className="text-sm font-normal text-slate-500">/ 100</span></p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-medium">Avg FLT Score</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.avgScore} <span className="text-sm font-normal text-slate-500">/ 100</span></p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <CheckCircle2 className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-medium">Avg Accuracy</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.avgAccuracy}%</p>
        </div>
      </div>

      {/* Add Test Form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Record Test Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Made Easy FLT 3"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (mins)</label>
                  <input 
                    type="number" 
                    value={formData.durationMinutes}
                    onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="testType" 
                      value="full"
                      checked={formData.type === 'full'}
                      onChange={() => setFormData({...formData, type: 'full', totalMarks: 100, totalQuestions: 65})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Full Length (FLT)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="testType" 
                      value="partial"
                      checked={formData.type === 'partial'}
                      onChange={() => setFormData({...formData, type: 'partial', totalMarks: 50, totalQuestions: 33})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Subject/Topic Wise</span>
                  </label>
                </div>
              </div>

              {formData.type === 'partial' && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700">Select Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {syllabusSubjects.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectToggle(subject.name)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          formData.subjects.includes(subject.name)
                            ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {subject.name}
                      </button>
                    ))}
                  </div>

                  {formData.subjects.length === 1 && (
                    <div className="pt-3 border-t border-slate-100 mt-3">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Topics (Optional)</label>
                      <div className="flex flex-wrap gap-2">
                        {syllabusSubjects.find(s => s.name === formData.subjects[0])?.topics.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => handleTopicToggle(topic.name)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              formData.topics.includes(topic.name)
                                ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {topic.name}
                          </button>
                        ))}
                        {syllabusSubjects.find(s => s.name === formData.subjects[0])?.topics.length === 0 && (
                          <span className="text-xs text-slate-500 italic">No topics added for this subject in Syllabus.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Marks</label>
                  <input 
                    type="number" 
                    value={formData.totalMarks}
                    onChange={e => setFormData({...formData, totalMarks: Number(e.target.value)})}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marks Obtained</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.marksObtained}
                    onChange={e => setFormData({...formData, marksObtained: Number(e.target.value)})}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Questions</label>
                  <input 
                    type="number" 
                    value={formData.totalQuestions}
                    onChange={e => setFormData({...formData, totalQuestions: Number(e.target.value)})}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-600 mb-1">Correct</label>
                  <input 
                    type="number" 
                    value={formData.correctQuestions}
                    onChange={e => setFormData({...formData, correctQuestions: Number(e.target.value)})}
                    className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-rose-600 mb-1">Wrong</label>
                  <input 
                    type="number" 
                    value={formData.wrongQuestions}
                    onChange={e => setFormData({...formData, wrongQuestions: Number(e.target.value)})}
                    className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Unattempted</label>
                  <div className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                    {Math.max(0, formData.totalQuestions - formData.correctQuestions - formData.wrongQuestions)}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTest}
                  disabled={!formData.name || (formData.type === 'partial' && formData.subjects.length === 0)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Test Results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test History List */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">Test History</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tests..." 
                className="rounded-md border border-slate-300 pl-9 pr-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </div>
            <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="divide-y">
          {tests.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No mock tests recorded yet.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-2 text-indigo-600 hover:underline font-medium text-sm"
              >
                Add your first test
              </button>
            </div>
          ) : (
            tests.map(test => (
              <div key={test.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedTestId(expandedTestId === test.id ? null : test.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900">{test.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        test.type === 'full' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {test.type === 'full' ? 'Full Length' : 'Subject Wise'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(test.date), 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {test.durationMinutes} mins</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Score</p>
                      <p className="text-xl font-bold text-slate-900">{test.marksObtained} <span className="text-sm font-medium text-slate-400">/ {test.totalMarks}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Accuracy</p>
                      <p className={`text-xl font-bold ${
                        test.accuracy >= 85 ? 'text-emerald-600' : 
                        test.accuracy >= 70 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {test.accuracy}%
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      {expandedTestId === test.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTestId === test.id && (
                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Question Breakdown</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase">Correct</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">{test.correctQuestions}</p>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex items-center gap-2 text-rose-500 mb-1">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase">Wrong</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">{test.wrongQuestions}</p>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <MinusCircle className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase">Skipped</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">{test.unattemptedQuestions}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Total Questions: {test.totalQuestions}</span>
                        <span>Attempted: {test.correctQuestions + test.wrongQuestions}</span>
                      </div>
                    </div>

                    {test.type === 'partial' && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Syllabus Covered</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Subjects</p>
                            <div className="flex flex-wrap gap-1.5">
                              {test.subjects.map(sub => (
                                <span key={sub} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {test.topics && test.topics.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" /> Topics
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {test.topics.map(topic => (
                                  <span key={topic} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
