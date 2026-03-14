import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('revisions and weak-topic analytics routes', () => {
  let subjectsRoute: typeof import('@/app/api/subjects/route');
  let topicsRoute: typeof import('@/app/api/topics/route');
  let lecturesRoute: typeof import('@/app/api/lectures/route');
  let revisionsRoute: typeof import('@/app/api/revisions/route');
  let revisionCompleteRoute: typeof import('@/app/api/revisions/[id]/complete/route');
  let pyqsRoute: typeof import('@/app/api/pyqs/route');
  let mistakesRoute: typeof import('@/app/api/mistakes/route');
  let weakTopicsRoute: typeof import('@/app/api/analytics/weak-topics/route');

  beforeAll(async () => {
    await startTestDatabase();
    subjectsRoute = await import('@/app/api/subjects/route');
    topicsRoute = await import('@/app/api/topics/route');
    lecturesRoute = await import('@/app/api/lectures/route');
    revisionsRoute = await import('@/app/api/revisions/route');
    revisionCompleteRoute = await import('@/app/api/revisions/[id]/complete/route');
    pyqsRoute = await import('@/app/api/pyqs/route');
    mistakesRoute = await import('@/app/api/mistakes/route');
    weakTopicsRoute = await import('@/app/api/analytics/weak-topics/route');
  });

  beforeEach(() => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('creates revision schedule items from lecture revision flags and advances intervals on completion', async () => {
    const subjectResponse = await subjectsRoute.POST(
      new Request('http://localhost/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Operating Systems' }),
      })
    );
    const subjectId = (await subjectResponse.json()).data.subject.id;

    const topicResponse = await topicsRoute.POST(
      new Request('http://localhost/api/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name: 'Deadlocks' }),
      })
    );
    const topicId = (await topicResponse.json()).data.topic.id;

    await lecturesRoute.POST(
      new Request('http://localhost/api/lectures', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          topicId,
          title: 'Deadlock Prevention',
          duration: 60,
          status: 'completed',
          needsRevision: true,
        }),
      })
    );

    const revisionsResponse = await revisionsRoute.GET();
    const revisionsPayload = await revisionsResponse.json();

    expect(revisionsPayload.data.revisions).toHaveLength(1);
    expect(revisionsPayload.data.revisions[0].lectureTitle).toBe('Deadlock Prevention');
    expect(revisionsPayload.data.revisions[0].intervalLevel).toBe(0);

    const revisionId = revisionsPayload.data.revisions[0].id;
    const completeResponse = await revisionCompleteRoute.POST(
      new Request(`http://localhost/api/revisions/${revisionId}/complete`, {
        method: 'POST',
      }),
      { params: Promise.resolve({ id: revisionId }) }
    );
    const completePayload = await completeResponse.json();

    expect(completePayload.data.revision.intervalLevel).toBe(1);
  });

  it('computes weak-topic rankings from pyq accuracy, mistakes, and time efficiency', async () => {
    const suffix = Date.now().toString();
    const subjectResponse = await subjectsRoute.POST(
      new Request('http://localhost/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: `DBMS-${suffix}` }),
      })
    );
    const subjectId = (await subjectResponse.json()).data.subject.id;

    const normalizationTopicResponse = await topicsRoute.POST(
      new Request('http://localhost/api/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name: `Normalization-${suffix}` }),
      })
    );
    const normalizationTopicId = (await normalizationTopicResponse.json()).data.topic.id;

    const indexingTopicResponse = await topicsRoute.POST(
      new Request('http://localhost/api/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name: `Indexing-${suffix}` }),
      })
    );
    const indexingTopicId = (await indexingTopicResponse.json()).data.topic.id;

    await pyqsRoute.POST(
      new Request('http://localhost/api/pyqs', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          topicId: normalizationTopicId,
          totalQuestions: 40,
          solved: 20,
          correct: 8,
          incorrect: 12,
          bookmarked: 4,
          totalTimeMinutes: 100,
        }),
      })
    );

    await pyqsRoute.POST(
      new Request('http://localhost/api/pyqs', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          topicId: indexingTopicId,
          totalQuestions: 40,
          solved: 20,
          correct: 18,
          incorrect: 2,
          bookmarked: 1,
          totalTimeMinutes: 30,
        }),
      })
    );

    await mistakesRoute.POST(
      new Request('http://localhost/api/mistakes', {
        method: 'POST',
        body: JSON.stringify({
          date: '2026-03-14',
          source: 'DBMS Quiz',
          subjectId,
          topicId: normalizationTopicId,
          questionDescription: '',
          mistakeType: 'conceptual',
          whatWentWrong: 'Missed decomposition rule',
          learning: 'Revise examples',
          isRepeated: true,
          status: 'needs_review',
        }),
      })
    );

    const response = await weakTopicsRoute.GET();
    const payload = await response.json();

    expect(payload.data.weakTopics[0].topicName).toBe(`Normalization-${suffix}`);
    expect(payload.data.weakTopics[0].weaknessScore).toBeGreaterThan(
      payload.data.weakTopics[1].weaknessScore
    );
  });
});
