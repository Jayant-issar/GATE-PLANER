import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('study session routes', () => {
  let sessionsRoute: typeof import('@/app/api/study-sessions/route');
  let sessionByIdRoute: typeof import('@/app/api/study-sessions/[id]/route');
  let dashboardRoute: typeof import('@/app/api/dashboard/route');
  let subjectsRoute: typeof import('@/app/api/subjects/route');
  let topicsRoute: typeof import('@/app/api/topics/route');

  beforeAll(async () => {
    await startTestDatabase();
    sessionsRoute = await import('@/app/api/study-sessions/route');
    sessionByIdRoute = await import('@/app/api/study-sessions/[id]/route');
    dashboardRoute = await import('@/app/api/dashboard/route');
    subjectsRoute = await import('@/app/api/subjects/route');
    topicsRoute = await import('@/app/api/topics/route');
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

  async function createSubjectAndTopic() {
    const subjectResponse = await subjectsRoute.POST(
      new Request('http://localhost/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Computer Networks' }),
      })
    );
    const subjectId = (await subjectResponse.json()).data.subject.id;

    const topicResponse = await topicsRoute.POST(
      new Request('http://localhost/api/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name: 'Routing Algorithms' }),
      })
    );
    const topicId = (await topicResponse.json()).data.topic.id;

    return { subjectId, topicId };
  }

  it('starts and stops a study session', async () => {
    const { subjectId, topicId } = await createSubjectAndTopic();

    const startResponse = await sessionsRoute.POST(
      new Request('http://localhost/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          topicId,
          title: 'Revise CN routing',
          studyMinutes: 25,
          breakMinutes: 5,
          totalPeriods: 2,
          startedAt: '2026-03-14T10:00:00.000Z',
        }),
      })
    );
    const startedSession = (await startResponse.json()).data.session;
    expect(startedSession.title).toBe('Revise CN routing');
    expect(startedSession.endedAt).toBeNull();
    expect(startedSession.subjectId).toBe(subjectId);
    expect(startedSession.topicId).toBe(topicId);
    expect(startedSession.studyMinutes).toBe(25);
    expect(startedSession.breakMinutes).toBe(5);
    expect(startedSession.totalPeriods).toBe(2);

    const listResponse = await sessionsRoute.GET(
      new Request('http://localhost/api/study-sessions')
    );
    const listPayload = await listResponse.json();
    expect(listPayload.data.activeSession.id).toBe(startedSession.id);

    const stopResponse = await sessionByIdRoute.PATCH(
      new Request(`http://localhost/api/study-sessions/${startedSession.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'stop',
          endedAt: '2026-03-14T10:45:00.000Z',
        }),
      }),
      { params: Promise.resolve({ id: startedSession.id }) }
    );
    const stoppedSession = (await stopResponse.json()).data.session;
    expect(stoppedSession.durationMinutes).toBe(40);
    expect(stoppedSession.endedAt).toBe('2026-03-14T10:45:00.000Z');
  });

  it('uses study sessions as the dashboard heatmap source', async () => {
    const { subjectId, topicId } = await createSubjectAndTopic();

    await sessionsRoute.POST(
      new Request('http://localhost/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          topicId,
          title: 'OS revision',
          studyMinutes: 50,
          breakMinutes: 10,
          totalPeriods: 2,
          startedAt: '2026-03-14T08:00:00.000Z',
        }),
      })
    );

    const active = await sessionsRoute.GET(new Request('http://localhost/api/study-sessions'));
    const activePayload = await active.json();
    const sessionId = activePayload.data.activeSession.id;

    await sessionByIdRoute.PATCH(
      new Request(`http://localhost/api/study-sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'stop',
          endedAt: '2026-03-14T09:30:00.000Z',
        }),
      }),
      { params: Promise.resolve({ id: sessionId }) }
    );

    const dashboardResponse = await dashboardRoute.GET();
    const dashboardPayload = await dashboardResponse.json();

    expect(dashboardPayload.data.studySessions).toHaveLength(1);
    expect(dashboardPayload.data.todayStudyHours).toBeGreaterThanOrEqual(0);
    expect(dashboardPayload.data.heatmap).toHaveLength(84);
  });

  it('requires a subject-topic pomodoro plan before a session can start', async () => {
    const response = await sessionsRoute.POST(
      new Request('http://localhost/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Incomplete setup',
          studyMinutes: 25,
          breakMinutes: 5,
          totalPeriods: 1,
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('subjectId is required');
  });
});
