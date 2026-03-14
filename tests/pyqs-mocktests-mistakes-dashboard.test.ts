import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('pyqs, mock tests, mistakes, and dashboard routes', () => {
  let subjectsRoute: typeof import('@/app/api/subjects/route');
  let topicsRoute: typeof import('@/app/api/topics/route');
  let pyqsRoute: typeof import('@/app/api/pyqs/route');
  let mockTestsRoute: typeof import('@/app/api/mock-tests/route');
  let mistakesRoute: typeof import('@/app/api/mistakes/route');
  let dashboardRoute: typeof import('@/app/api/dashboard/route');

  beforeAll(async () => {
    await startTestDatabase();
    subjectsRoute = await import('@/app/api/subjects/route');
    topicsRoute = await import('@/app/api/topics/route');
    pyqsRoute = await import('@/app/api/pyqs/route');
    mockTestsRoute = await import('@/app/api/mock-tests/route');
    mistakesRoute = await import('@/app/api/mistakes/route');
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

  it('aggregates stored study data into the dashboard response', async () => {
    const subjectResponse = await subjectsRoute.POST(
      new Request('http://localhost/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: 'DBMS' }),
      })
    );
    const subjectId = (await subjectResponse.json()).data.subject.id;

    const topicResponse = await topicsRoute.POST(
      new Request('http://localhost/api/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name: 'Normalization' }),
      })
    );
    const topicId = (await topicResponse.json()).data.topic.id;

    await pyqsRoute.POST(
      new Request('http://localhost/api/pyqs', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          topicId,
          totalQuestions: 50,
          solved: 25,
          correct: 18,
          incorrect: 7,
          bookmarked: 3,
          totalTimeMinutes: 120,
        }),
      })
    );

    await mockTestsRoute.POST(
      new Request('http://localhost/api/mock-tests', {
        method: 'POST',
        body: JSON.stringify({
          name: 'DBMS Subject Test',
          date: '2026-03-14',
          type: 'partial',
          subjectIds: [subjectId],
          topicIds: [topicId],
          totalMarks: 50,
          marksObtained: 38,
          totalQuestions: 30,
          correctQuestions: 20,
          wrongQuestions: 5,
          unattemptedQuestions: 5,
          accuracy: 80,
          durationMinutes: 90,
        }),
      })
    );

    await mistakesRoute.POST(
      new Request('http://localhost/api/mistakes', {
        method: 'POST',
        body: JSON.stringify({
          date: '2026-03-14',
          source: 'DBMS Subject Test',
          subjectId,
          topicId,
          questionDescription: 'Missed a dependency question',
          mistakeType: 'conceptual',
          whatWentWrong: 'Mixed up 3NF and BCNF',
          learning: 'Revise decomposition examples',
          isRepeated: false,
          status: 'needs_review',
        }),
      })
    );

    const dashboardResponse = await dashboardRoute.GET();
    const payload = await dashboardResponse.json();

    expect(payload.data.pyqTopics).toHaveLength(1);
    expect(payload.data.mockTests).toHaveLength(1);
    expect(payload.data.mistakes).toHaveLength(1);
    expect(payload.data.heatmap).toHaveLength(84);
  });
});
