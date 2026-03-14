import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

const mockRequireAuthenticatedUser = jest.fn();

jest.mock('@/lib/auth', () => ({
  requireAuthenticatedUser: () => mockRequireAuthenticatedUser(),
}));

describe('settings route', () => {
  let settingsRoute: typeof import('@/app/api/settings/route');

  beforeAll(async () => {
    await startTestDatabase();
    settingsRoute = await import('@/app/api/settings/route');
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

  it('returns default settings for a new user', async () => {
    const response = await settingsRoute.GET();
    const payload = await response.json();

    expect(payload.data.settings).toEqual({
      targetYear: 2027,
      dailyStudyHoursGoal: 4,
      timezone: 'Asia/Kolkata',
      weekStartsOn: 1,
    });
  });

  it('persists updated settings', async () => {
    const updateResponse = await settingsRoute.PATCH(
      new Request('http://localhost/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          targetYear: 2028,
          dailyStudyHoursGoal: 6,
          timezone: 'UTC',
          weekStartsOn: 0,
        }),
      })
    );
    const updatePayload = await updateResponse.json();

    expect(updatePayload.data.settings).toEqual({
      targetYear: 2028,
      dailyStudyHoursGoal: 6,
      timezone: 'UTC',
      weekStartsOn: 0,
    });

    const getResponse = await settingsRoute.GET();
    const getPayload = await getResponse.json();

    expect(getPayload.data.settings).toEqual({
      targetYear: 2028,
      dailyStudyHoursGoal: 6,
      timezone: 'UTC',
      weekStartsOn: 0,
    });
  });
});
