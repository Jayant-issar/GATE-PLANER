import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { optionalString, requireDateString, requireObjectId } from '@/lib/validators';
import StudySession from '@/models/StudySession';

function calculateDurationMinutes(startedAt: Date, endedAt: Date) {
  return Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const sessionId = requireObjectId(id, 'id');
    const body = await req.json();

    const session = await StudySession.findOne({ _id: sessionId, userId: user.id });

    if (!session) {
      throw new ApiError('NOT_FOUND', 'Study session not found');
    }

    if (body.action === 'stop') {
      const endedAt = body.endedAt ? requireDateString(body.endedAt, 'endedAt') : new Date();
      session.endedAt = endedAt;
      session.durationMinutes = calculateDurationMinutes(session.startedAt, endedAt);
    }

    const notes = optionalString(body.notes);
    if (notes !== undefined) {
      session.notes = notes;
    }

    await session.save();

    return {
      session: {
        id: session._id.toString(),
        subjectId: session.subjectId?.toString() ?? '',
        topicId: session.topicId?.toString() ?? '',
        title: session.title,
        notes: session.notes ?? '',
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
        durationMinutes: session.durationMinutes,
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
    const sessionId = requireObjectId(id, 'id');
    const session = await StudySession.findOneAndDelete({
      _id: sessionId,
      userId: user.id,
    });

    if (!session) {
      throw new ApiError('NOT_FOUND', 'Study session not found');
    }

    return { deleted: true };
  });
}
