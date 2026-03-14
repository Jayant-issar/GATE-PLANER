import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('lectures routes', () => {
  let lecturesRoute: typeof import('@/app/api/lectures/route');
  let lectureByIdRoute: typeof import('@/app/api/lectures/[id]/route');
  let subjectsRoute: typeof import('@/app/api/subjects/route');

  beforeAll(async () => {
    await startTestDatabase();
    lecturesRoute = await import('@/app/api/lectures/route');
    lectureByIdRoute = await import('@/app/api/lectures/[id]/route');
    subjectsRoute = await import('@/app/api/subjects/route');
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

  it('creates, updates, and lists lectures', async () => {
    const subjectResponse = await subjectsRoute.POST(
      new Request('http://localhost/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Algorithms' }),
      })
    );
    const subjectId = (await subjectResponse.json()).data.subject.id;

    const createResponse = await lecturesRoute.POST(
      new Request('http://localhost/api/lectures', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          title: 'Greedy Basics',
          duration: 90,
          status: 'pending',
          needsRevision: false,
        }),
      })
    );
    const lectureId = (await createResponse.json()).data.lecture.id;

    const updateResponse = await lectureByIdRoute.PATCH(
      new Request(`http://localhost/api/lectures/${lectureId}`, {
        method: 'PATCH',
        body: JSON.stringify({ needsRevision: true, status: 'completed' }),
      }),
      { params: Promise.resolve({ id: lectureId }) }
    );
    const updatePayload = await updateResponse.json();

    expect(updatePayload.data.lecture.needsRevision).toBe(true);
    expect(updatePayload.data.lecture.status).toBe('completed');

    const listResponse = await lecturesRoute.GET();
    const listPayload = await listResponse.json();
    expect(listPayload.data.lectures).toHaveLength(1);
  });
});
