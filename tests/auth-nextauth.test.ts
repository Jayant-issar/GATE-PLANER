import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

describe('next-auth credentials provider', () => {
  let authOptions: typeof import('@/lib/auth-options').authOptions;

  beforeAll(async () => {
    await startTestDatabase();
    ({ authOptions } = await import('@/lib/auth-options'));
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('returns null instead of throwing for invalid credentials', async () => {
    const provider = authOptions.providers[0] as unknown as {
      authorize: (
        credentials: Record<string, string> | undefined,
        req: Record<string, unknown>
      ) => Promise<unknown> | unknown;
    };

    const result = await provider.authorize({
      email: 'missing@example.com',
      password: 'secret123',
    }, {});

    expect(result).toBeNull();
  });
});
