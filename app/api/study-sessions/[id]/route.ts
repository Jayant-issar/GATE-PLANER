import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { optionalString, requireDateString, requireObjectId } from '@/lib/validators';
import StudySession from '@/models/StudySession';
import Subject from '@/models/Subject';
import Topic from '@/models/Topic';

function calculateFocusedMinutes(
  startedAt: Date,
  endedAt: Date,
  studyMinutes: number,
  breakMinutes: number,
  totalPeriods: number
) {
  const studyMs = studyMinutes * 60_000;
  const breakMs = breakMinutes * 60_000;
  let remainingMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  let focusedMs = 0;

  for (let index = 0; index < totalPeriods; index += 1) {
    const studyChunk = Math.min(remainingMs, studyMs);
    focusedMs += studyChunk;

    if (studyChunk < studyMs) {
      break;
    }

    remainingMs -= studyMs;

    if (index === totalPeriods - 1) {
      break;
    }

    const breakChunk = Math.min(remainingMs, breakMs);
    if (breakChunk < breakMs) {
      break;
    }

    remainingMs -= breakMs;
  }

  return Math.max(1, Math.round(focusedMs / 60_000));
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
      session.durationMinutes = calculateFocusedMinutes(
        session.startedAt,
        endedAt,
        session.studyMinutes,
        session.breakMinutes,
        session.totalPeriods
      );
    }

    const notes = optionalString(body.notes);
    if (notes !== undefined) {
      session.notes = notes;
    }

    await session.save();

    const [subject, topic] = await Promise.all([
      Subject.findById(session.subjectId).lean(),
      Topic.findById(session.topicId).lean(),
    ]);

    return {
      session: {
        id: session._id.toString(),
        subjectId: session.subjectId.toString(),
        topicId: session.topicId.toString(),
        title: session.title,
        notes: session.notes ?? '',
        studyMinutes: session.studyMinutes,
        breakMinutes: session.breakMinutes,
        totalPeriods: session.totalPeriods,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
        durationMinutes: session.durationMinutes,
        subjectName: subject?.name ?? '',
        topicName: topic?.name ?? '',
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
