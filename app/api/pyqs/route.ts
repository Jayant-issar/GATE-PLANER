import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  requireNumber,
  requireObjectId,
} from '@/lib/validators';
import PYQProgress from '@/models/PYQProgress';

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const progress = await PYQProgress.find({ userId: user.id }).sort({ createdAt: -1 }).lean();

    return {
      topics: progress.map((item) => ({
        id: item._id.toString(),
        topicId: item.topicId.toString(),
        subjectId: item.subjectId.toString(),
        totalQuestions: item.totalQuestions,
        solved: item.solvedQuestions,
        correct: item.correctQuestions,
        incorrect: item.incorrectQuestions,
        bookmarked: item.bookmarkedQuestions,
      })),
    };
  });
}

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const body = await req.json();
    const progress = await PYQProgress.create({
      userId: user.id,
      subjectId: requireObjectId(body.subjectId, 'subjectId'),
      topicId: requireObjectId(body.topicId, 'topicId'),
      totalQuestions: requireNumber(body.totalQuestions, 'totalQuestions', { min: 0 }),
      solvedQuestions: requireNumber(body.solved, 'solved', { min: 0 }),
      correctQuestions: requireNumber(body.correct, 'correct', { min: 0 }),
      incorrectQuestions: requireNumber(body.incorrect, 'incorrect', { min: 0 }),
      bookmarkedQuestions: requireNumber(body.bookmarked, 'bookmarked', { min: 0 }),
      totalTimeMinutes: requireNumber(body.totalTimeMinutes ?? 0, 'totalTimeMinutes', { min: 0 }),
    });

    return {
      topic: {
        id: progress._id.toString(),
        topicId: progress.topicId.toString(),
        subjectId: progress.subjectId.toString(),
        totalQuestions: progress.totalQuestions,
        solved: progress.solvedQuestions,
        correct: progress.correctQuestions,
        incorrect: progress.incorrectQuestions,
        bookmarked: progress.bookmarkedQuestions,
      },
    };
  });
}
