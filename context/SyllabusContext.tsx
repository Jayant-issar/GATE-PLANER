'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/client-api';

export interface Topic {
  id: string;
  name: string;
  status?: string;
}

export interface Subject {
  id: string;
  name: string;
  color?: string | null;
  topics: Topic[];
}

interface SyllabusContextType {
  subjects: Subject[];
  loading: boolean;
  refreshSubjects: () => Promise<void>;
  addSubject: (name: string) => Promise<void>;
  removeSubject: (id: string) => Promise<void>;
  addTopic: (subjectId: string, topicName: string) => Promise<void>;
  removeTopic: (subjectId: string, topicId: string) => Promise<void>;
}

const SyllabusContext = createContext<SyllabusContextType | undefined>(undefined);

export function SyllabusProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSubjects = useCallback(async () => {
    const data = await apiRequest<{ subjects: Subject[] }>('/api/subjects');
    setSubjects(data.subjects);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSubjects()
      .catch((error) => {
        console.error('Failed to load syllabus', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshSubjects]);

  const addSubject = async (name: string) => {
    const data = await apiRequest<{ subjects: Subject[] }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setSubjects(data.subjects);
  };

  const removeSubject = async (id: string) => {
    await apiRequest<{ deleted: boolean }>(`/api/subjects/${id}`, { method: 'DELETE' });
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
  };

  const addTopic = async (subjectId: string, topicName: string) => {
    const data = await apiRequest<{ topic: Topic & { subjectId: string } }>('/api/topics', {
      method: 'POST',
      body: JSON.stringify({ subjectId, name: topicName }),
    });

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: [...subject.topics, { id: data.topic.id, name: data.topic.name, status: data.topic.status }],
            }
          : subject
      )
    );
  };

  const removeTopic = async (subjectId: string, topicId: string) => {
    await apiRequest<{ deleted: boolean }>(`/api/topics/${topicId}`, { method: 'DELETE' });
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? { ...subject, topics: subject.topics.filter((topic) => topic.id !== topicId) }
          : subject
      )
    );
  };

  return (
    <SyllabusContext.Provider
      value={{ subjects, loading, refreshSubjects, addSubject, removeSubject, addTopic, removeTopic }}
    >
      {children}
    </SyllabusContext.Provider>
  );
}

export function useSyllabus() {
  const context = useContext(SyllabusContext);
  if (!context) {
    throw new Error('useSyllabus must be used within a SyllabusProvider');
  }
  return context;
}
