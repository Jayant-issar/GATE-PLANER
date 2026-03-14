import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  requireDateString,
  requireEnumValue,
  requireNumber,
  requireObjectId,
  requireString,
} from '@/lib/validators';
import MockTest from '@/models/MockTest';

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const tests = await MockTest.find({ userId: user.id }).sort({ date: -1, createdAt: -1 }).lean();

    return {
      tests: tests.map((test) => ({
        id: test._id.toString(),
        name: test.name,
        date: test.date.toISOString(),
        type: test.type,
        subjectIds: test.subjectIds.map((id: { toString(): string }) => id.toString()),
        topicIds: test.topicIds.map((id: { toString(): string }) => id.toString()),
        totalMarks: test.totalMarks,
        marksObtained: test.marksObtained,
        totalQuestions: test.totalQuestions,
        correctQuestions: test.correctQuestions,
        wrongQuestions: test.wrongQuestions,
        unattemptedQuestions: test.unattemptedQuestions,
        accuracy: test.accuracy,
        durationMinutes: test.durationMinutes,
      })),
    };
  });
}

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const body = await req.json();
    const subjectIds = Array.isArray(body.subjectIds)
      ? body.subjectIds.map((id: unknown) => requireObjectId(id, 'subjectIds'))
      : [];
    const topicIds = Array.isArray(body.topicIds)
      ? body.topicIds.map((id: unknown) => requireObjectId(id, 'topicIds'))
      : [];

    const test = await MockTest.create({
      userId: user.id,
      name: requireString(body.name, 'name'),
      date: requireDateString(body.date, 'date'),
      type: requireEnumValue(body.type, 'type', ['full', 'partial']),
      subjectIds,
      topicIds,
      totalMarks: requireNumber(body.totalMarks, 'totalMarks', { min: 0 }),
      marksObtained: requireNumber(body.marksObtained, 'marksObtained', { min: 0 }),
      totalQuestions: requireNumber(body.totalQuestions, 'totalQuestions', { min: 0 }),
      correctQuestions: requireNumber(body.correctQuestions, 'correctQuestions', { min: 0 }),
      wrongQuestions: requireNumber(body.wrongQuestions, 'wrongQuestions', { min: 0 }),
      unattemptedQuestions: requireNumber(body.unattemptedQuestions, 'unattemptedQuestions', { min: 0 }),
      accuracy: requireNumber(body.accuracy, 'accuracy', { min: 0 }),
      durationMinutes: requireNumber(body.durationMinutes, 'durationMinutes', { min: 0 }),
    });

    return {
      test: {
        id: test._id.toString(),
        name: test.name,
        date: test.date.toISOString(),
        type: test.type,
        subjectIds: test.subjectIds.map((id: { toString(): string }) => id.toString()),
        topicIds: test.topicIds.map((id: { toString(): string }) => id.toString()),
        totalMarks: test.totalMarks,
        marksObtained: test.marksObtained,
        totalQuestions: test.totalQuestions,
        correctQuestions: test.correctQuestions,
        wrongQuestions: test.wrongQuestions,
        unattemptedQuestions: test.unattemptedQuestions,
        accuracy: test.accuracy,
        durationMinutes: test.durationMinutes,
      },
    };
  });
}
