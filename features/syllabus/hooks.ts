'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/client-api';
import { queryKeys } from '@/lib/query/keys';
import { createTempId, mutationError, mutationSuccess, rollbackOnError } from '@/lib/query/mutation-toast';

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

interface CreateSubjectInput {
  name: string;
}

interface DeleteSubjectInput {
  id: string;
}

interface CreateTopicInput {
  subjectId: string;
  name: string;
}

interface DeleteTopicInput {
  subjectId: string;
  topicId: string;
}

export function useSubjectsQuery() {
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: async () => {
      const data = await apiRequest<{ subjects: Subject[] }>('/api/subjects');
      return data.subjects;
    },
  });
}

export function useCreateSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: CreateSubjectInput) => {
      const data = await apiRequest<{ subject: Subject }>('/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      return data.subject;
    },
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjects });
      const previousSubjects = queryClient.getQueryData<Subject[]>(queryKeys.subjects);
      const optimisticSubject: Subject = {
        id: createTempId('subject'),
        name,
        color: null,
        topics: [],
      };

      queryClient.setQueryData<Subject[]>(queryKeys.subjects, (current = []) => [
        ...current,
        optimisticSubject,
      ]);

      return { rollback: [{ queryKey: queryKeys.subjects, previousData: previousSubjects }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to add subject.');
    },
    onSuccess: (subject, variables) => {
      queryClient.setQueryData<Subject[]>(queryKeys.subjects, (current = []) =>
        current.map((item) =>
          item.id.startsWith('subject-') && item.name === variables.name ? subject : item
        )
      );
      mutationSuccess('Subject added');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
    },
  });
}

export function useDeleteSubjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteSubjectInput) => {
      await apiRequest<{ deleted: boolean }>(`/api/subjects/${id}`, { method: 'DELETE' });
      return id;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjects });
      const previousSubjects = queryClient.getQueryData<Subject[]>(queryKeys.subjects);

      queryClient.setQueryData<Subject[]>(queryKeys.subjects, (current = []) =>
        current.filter((subject) => subject.id !== id)
      );

      return { rollback: [{ queryKey: queryKeys.subjects, previousData: previousSubjects }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to remove subject.');
    },
    onSuccess: () => {
      mutationSuccess('Subject removed');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
    },
  });
}

export function useCreateTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, name }: CreateTopicInput) => {
      const data = await apiRequest<{ topic: Topic & { subjectId: string } }>('/api/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name }),
      });
      return data.topic;
    },
    onMutate: async ({ subjectId, name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjects });
      const previousSubjects = queryClient.getQueryData<Subject[]>(queryKeys.subjects);
      const optimisticTopic: Topic = {
        id: createTempId('topic'),
        name,
        status: undefined,
      };

      queryClient.setQueryData<Subject[]>(queryKeys.subjects, (current = []) =>
        current.map((subject) =>
          subject.id === subjectId
            ? { ...subject, topics: [...subject.topics, optimisticTopic] }
            : subject
        )
      );

      return { rollback: [{ queryKey: queryKeys.subjects, previousData: previousSubjects }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to add topic.');
    },
    onSuccess: (topic) => {
      queryClient.setQueryData<Subject[]>(queryKeys.subjects, (current = []) =>
        current.map((subject) =>
          subject.id === topic.subjectId
            ? {
                ...subject,
                topics: subject.topics.map((item) =>
                  item.id.startsWith('topic-') && item.name === topic.name ? topic : item
                ),
              }
            : subject
        )
      );
      mutationSuccess('Topic added');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
    },
  });
}

export function useDeleteTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topicId }: DeleteTopicInput) => {
      await apiRequest<{ deleted: boolean }>(`/api/topics/${topicId}`, { method: 'DELETE' });
      return topicId;
    },
    onMutate: async ({ subjectId, topicId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjects });
      const previousSubjects = queryClient.getQueryData<Subject[]>(queryKeys.subjects);

      queryClient.setQueryData<Subject[]>(queryKeys.subjects, (current = []) =>
        current.map((subject) =>
          subject.id === subjectId
            ? { ...subject, topics: subject.topics.filter((topic) => topic.id !== topicId) }
            : subject
        )
      );

      return { rollback: [{ queryKey: queryKeys.subjects, previousData: previousSubjects }] };
    },
    onError: (error, _variables, context) => {
      rollbackOnError(queryClient, context?.rollback ?? []);
      mutationError(error, 'Failed to remove topic.');
    },
    onSuccess: () => {
      mutationSuccess('Topic removed');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
    },
  });
}
