import mongoose from 'mongoose';
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/mongo';

describe('auth register route', () => {
  let post: typeof import('@/app/api/auth/register/route').POST;

  beforeAll(async () => {
    await startTestDatabase();
    ({ POST: post } = await import('@/app/api/auth/register/route'));
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('registers a new user and rejects a duplicate registration', async () => {
    const response = await post(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jay',
          email: 'jay@example.com',
          password: 'secret123',
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.message).toBe('User registered successfully');
    expect(mongoose.Types.ObjectId.isValid(payload.data.userId)).toBe(true);

    const duplicateResponse = await post(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jay',
          email: 'jay@example.com',
          password: 'secret123',
        }),
      })
    );

    expect(duplicateResponse.status).toBe(409);
    const duplicatePayload = await duplicateResponse.json();
    expect(['User already exists', 'Resource already exists']).toContain(duplicatePayload.error);
  });
});
