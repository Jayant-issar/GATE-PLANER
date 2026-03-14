import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('subjects and topics routes', () => {
  let subjectsRoute: typeof import('@/app/api/subjects/route');
  let topicsRoute: typeof import('@/app/api/topics/route');
  let subjectByIdRoute: typeof import('@/app/api/subjects/[id]/route');

  beforeAll(async () => {
    await startTestDatabase();
    subjectsRoute = await import('@/app/api/subjects/route');
    topicsRoute = await import('@/app/api/topics/route');
    subjectByIdRoute = await import('@/app/api/subjects/[id]/route');
  });

  beforeEach(() => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });
  });

  afterEach(async () => {
    await clearTestDatabase();
    mockRequireAuthenticatedUser.mockClear();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('creates, returns, and deletes nested syllabus data', async () => {
    const createSubject = await subjectsRoute.POST(
      new Request('http://localhost/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Databases' }),
      })
    );
    const subjectPayload = await createSubject.json();
    const subjectId = subjectPayload.data.subject.id;

    await topicsRoute.POST(
      new Request('http://localhost/api/topics', {
        method: 'POST',
        body: JSON.stringify({ subjectId, name: 'Normalization' }),
      })
    );

    const response = await subjectsRoute.GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.subjects).toHaveLength(1);
    expect(payload.data.subjects[0].topics[0].name).toBe('Normalization');

    const deleteResponse = await subjectByIdRoute.DELETE(
      new Request(`http://localhost/api/subjects/${subjectId}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: subjectId }) }
    );

    expect(deleteResponse.status).toBe(200);

    const getResponse = await subjectsRoute.GET();
    const emptyPayload = await getResponse.json();
    expect(emptyPayload.data.subjects).toHaveLength(0);
  });
});
