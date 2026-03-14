import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('study session routes', () => {
  let sessionsRoute: typeof import('@/app/api/study-sessions/route');
  let sessionByIdRoute: typeof import('@/app/api/study-sessions/[id]/route');
  let dashboardRoute: typeof import('@/app/api/dashboard/route');

  beforeAll(async () => {
    await startTestDatabase();
    sessionsRoute = await import('@/app/api/study-sessions/route');
    sessionByIdRoute = await import('@/app/api/study-sessions/[id]/route');
    dashboardRoute = await import('@/app/api/dashboard/route');
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

  it('starts and stops a study session', async () => {
    const startResponse = await sessionsRoute.POST(
      new Request('http://localhost/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Revise CN routing',
          startedAt: '2026-03-14T10:00:00.000Z',
        }),
      })
    );
    const startedSession = (await startResponse.json()).data.session;
    expect(startedSession.title).toBe('Revise CN routing');
    expect(startedSession.endedAt).toBeNull();

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
    expect(stoppedSession.durationMinutes).toBe(45);
    expect(stoppedSession.endedAt).toBe('2026-03-14T10:45:00.000Z');
  });

  it('uses study sessions as the dashboard heatmap source', async () => {
    await sessionsRoute.POST(
      new Request('http://localhost/api/study-sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'OS revision',
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
});
