'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Topic {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

interface SyllabusContextType {
  subjects: Subject[];
  addSubject: (name: string) => void;
  removeSubject: (id: string) => void;
  addTopic: (subjectId: string, topicName: string) => void;
  removeTopic: (subjectId: string, topicId: string) => void;
}

const defaultSubjects: Subject[] = [
  {
    id: 'sub_1',
    name: 'Computer Networks',
    topics: [
      { id: 'top_1_1', name: 'OSI and IP model' },
      { id: 'top_1_2', name: 'Error handling' }
    ]
  },
  {
    id: 'sub_2',
    name: 'Databases',
    topics: [
      { id: 'top_2_1', name: 'Normalization' },
      { id: 'top_2_2', name: 'ER model diagram' }
    ]
  },
  {
    id: 'sub_3',
    name: 'Operating Systems',
    topics: [
      { id: 'top_3_1', name: 'Deadlocks' }
    ]
  }
];

const SyllabusContext = createContext<SyllabusContextType | undefined>(undefined);

export function SyllabusProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('gate-syllabus');
    if (saved) {
      try {
        setSubjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse syllabus from local storage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('gate-syllabus', JSON.stringify(subjects));
    }
  }, [subjects, mounted]);

  const addSubject = (name: string) => {
    setSubjects(prev => [...prev, { id: crypto.randomUUID(), name, topics: [] }]);
  };

  const removeSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addTopic = (subjectId: string, topicName: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, topics: [...s.topics, { id: crypto.randomUUID(), name: topicName }] };
      }
      return s;
    }));
  };

  const removeTopic = (subjectId: string, topicId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, topics: s.topics.filter(t => t.id !== topicId) };
      }
      return s;
    }));
  };

  return (
    <SyllabusContext.Provider value={{ subjects, addSubject, removeSubject, addTopic, removeTopic }}>
      {children}
    </SyllabusContext.Provider>
  );
}

export function useSyllabus() {
  const context = useContext(SyllabusContext);
  if (context === undefined) {
    throw new Error('useSyllabus must be used within a SyllabusProvider');
  }
  return context;
}
