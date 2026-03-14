import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('weekly task routes', () => {
  let tasksRoute: typeof import('@/app/api/weekly-tasks/route');
  let taskByIdRoute: typeof import('@/app/api/weekly-tasks/[id]/route');

  beforeAll(async () => {
    await startTestDatabase();
    tasksRoute = await import('@/app/api/weekly-tasks/route');
    taskByIdRoute = await import('@/app/api/weekly-tasks/[id]/route');
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

  it('creates and updates planner tasks', async () => {
    const createResponse = await tasksRoute.POST(
      new Request('http://localhost/api/weekly-tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Solve graph PYQs',
          type: 'pyq',
          date: '2026-03-14',
        }),
      })
    );
    const taskId = (await createResponse.json()).data.task.id;

    const updateResponse = await taskByIdRoute.PATCH(
      new Request(`http://localhost/api/weekly-tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          completed: true,
          date: '2026-03-14',
        }),
      }),
      { params: Promise.resolve({ id: taskId }) }
    );
    const updatePayload = await updateResponse.json();
    expect(updatePayload.data.task.completed).toBe(true);

    const listResponse = await tasksRoute.GET(
      new Request('http://localhost/api/weekly-tasks?from=2026-03-10&to=2026-03-20')
    );
    const listPayload = await listResponse.json();
    expect(listPayload.data.tasks).toHaveLength(1);
  });
});
