import { NextResponse } from 'next/server';

type ApiErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';

const errorStatusMap: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = errorStatusMap[code];
  }
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiMessage(message: string, init?: ResponseInit) {
  return NextResponse.json({ message }, init);
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }

  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return NextResponse.json(
      { error: 'Authentication is required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';

  return NextResponse.json(
    { error: message, code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

export async function withApiHandler<T>(handler: () => Promise<T>) {
  try {
    const data = await handler();
    return apiSuccess(data);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
