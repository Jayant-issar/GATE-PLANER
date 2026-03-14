import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireNumber, requireObjectId } from '@/lib/validators';
import PYQProgress from '@/models/PYQProgress';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const pyqId = requireObjectId(id, 'id');
    const body = await req.json();

    const progress = await PYQProgress.findOneAndUpdate(
      { _id: pyqId, userId: user.id },
      {
        totalQuestions: requireNumber(body.totalQuestions, 'totalQuestions', { min: 0 }),
        solvedQuestions: requireNumber(body.solved, 'solved', { min: 0 }),
        correctQuestions: requireNumber(body.correct, 'correct', { min: 0 }),
        incorrectQuestions: requireNumber(body.incorrect, 'incorrect', { min: 0 }),
        bookmarkedQuestions: requireNumber(body.bookmarked, 'bookmarked', { min: 0 }),
        totalTimeMinutes: requireNumber(body.totalTimeMinutes ?? 0, 'totalTimeMinutes', { min: 0 }),
      },
      { returnDocument: 'after' }
    );

    if (!progress) throw new ApiError('NOT_FOUND', 'Tracked topic not found');

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const pyqId = requireObjectId(id, 'id');
    const progress = await PYQProgress.findOneAndDelete({ _id: pyqId, userId: user.id });

    if (!progress) throw new ApiError('NOT_FOUND', 'Tracked topic not found');

    return { deleted: true };
  });
}
