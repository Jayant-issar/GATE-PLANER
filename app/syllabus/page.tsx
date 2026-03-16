'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Layers, Plus, Trash2 } from 'lucide-react';
import {
  useCreateSubjectMutation,
  useCreateTopicMutation,
  useDeleteSubjectMutation,
  useDeleteTopicMutation,
  useSubjectsQuery,
} from '@/features/syllabus/hooks';
import { toastValidation } from '@/lib/toast';

export default function SyllabusPage() {
  const subjectsQuery = useSubjectsQuery();
  const createSubjectMutation = useCreateSubjectMutation();
  const deleteSubjectMutation = useDeleteSubjectMutation();
  const createTopicMutation = useCreateTopicMutation();
  const deleteTopicMutation = useDeleteTopicMutation();

  const subjects = subjectsQuery.data ?? [];
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicNames, setNewTopicNames] = useState<Record<string, string>>({});

  const handleAddSubject = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newSubjectName.trim();
    if (!name) {
      toastValidation('Enter a subject name first.');
      return;
    }

    createSubjectMutation.mutate(
      { name },
      {
        onSuccess: () => {
          setNewSubjectName('');
        },
      }
    );
  };

  const handleAddTopic = (event: React.FormEvent, subjectId: string) => {
    event.preventDefault();
    const name = newTopicNames[subjectId]?.trim();
    if (!name) {
      toastValidation('Enter a topic name first.');
      return;
    }

    createTopicMutation.mutate(
      { subjectId, name },
      {
        onSuccess: () => {
          setNewTopicNames((current) => ({ ...current, [subjectId]: '' }));
        },
      }
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Syllabus Manager</h1>
          <p className="text-sm text-slate-500">Manage your subjects and topics across the app</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white p-5 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              Add New Subject
            </h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(event) => setNewSubjectName(event.target.value)}
                  placeholder="e.g., Computer Networks"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newSubjectName.trim() || createSubjectMutation.isPending}
                className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {subjectsQuery.isLoading ? (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm text-slate-500">
              Loading syllabus...
            </div>
          ) : subjectsQuery.isError ? (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm text-rose-600">
              Failed to load syllabus.
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No subjects added</h3>
              <p className="text-slate-500 mt-1">Add a subject to start building your syllabus.</p>
            </div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="rounded-xl border bg-white shadow-sm overflow-hidden transition-all">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedSubject((current) => (current === subject.id ? null : subject.id))}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-slate-600">
                      {expandedSubject === subject.id ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    <h3 className="font-semibold text-slate-900">{subject.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {subject.topics.length} topics
                    </span>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      if (confirm('Are you sure you want to delete this subject?')) {
                        deleteSubjectMutation.mutate({ id: subject.id });
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {expandedSubject === subject.id ? (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2 mb-4">
                      {subject.topics.length === 0 ? (
                        <p className="text-sm text-slate-500 italic px-2">No topics added yet.</p>
                      ) : (
                        subject.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3"
                          >
                            <span className="text-sm font-medium text-slate-700">{topic.name}</span>
                            <button
                              onClick={() =>
                                deleteTopicMutation.mutate({ subjectId: subject.id, topicId: topic.id })
                              }
                              className="text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete Topic"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={(event) => handleAddTopic(event, subject.id)}
                      className="flex items-center gap-2 mt-4"
                    >
                      <input
                        type="text"
                        value={newTopicNames[subject.id] || ''}
                        onChange={(event) =>
                          setNewTopicNames((current) => ({
                            ...current,
                            [subject.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a new topic..."
                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!newTopicNames[subject.id]?.trim() || createTopicMutation.isPending}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
