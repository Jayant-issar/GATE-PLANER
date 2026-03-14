import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  optionalObjectId,
  optionalString,
  requireDateString,
  requireString,
} from '@/lib/validators';
import StudySession from '@/models/StudySession';
import Subject from '@/models/Subject';
import Topic from '@/models/Topic';

function toClientSession(session: {
  _id: { toString(): string };
  subjectId?: { toString(): string } | null;
  topicId?: { toString(): string } | null;
  title: string;
  notes?: string | null;
  startedAt: Date;
  endedAt?: Date | null;
  durationMinutes: number;
}) {
  return {
    id: session._id.toString(),
    subjectId: session.subjectId?.toString() ?? '',
    topicId: session.topicId?.toString() ?? '',
    title: session.title,
    notes: session.notes ?? '',
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    durationMinutes: session.durationMinutes,
  };
}

export async function GET(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const query: Record<string, unknown> = { userId: user.id };

    if (from || to) {
      query.startedAt = {};
      if (from) (query.startedAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.startedAt as Record<string, unknown>).$lte = new Date(to);
    }

    const [sessions, activeSession, subjects, topics] = await Promise.all([
      StudySession.find(query).sort({ startedAt: -1, createdAt: -1 }).lean(),
      StudySession.findOne({ userId: user.id, endedAt: null }).lean(),
      Subject.find({ userId: user.id }).lean(),
      Topic.find({ userId: user.id }).lean(),
    ]);

    const enrichedSessions = sessions.map((session) => ({
      ...toClientSession(session),
      subjectName:
        subjects.find((subject) => subject._id.toString() === session.subjectId?.toString())
          ?.name ?? '',
      topicName:
        topics.find((topic) => topic._id.toString() === session.topicId?.toString())?.name ??
        '',
    }));

    return {
      sessions: enrichedSessions,
      activeSession: activeSession
        ? {
            ...toClientSession(activeSession),
            subjectName:
              subjects.find((subject) => subject._id.toString() === activeSession.subjectId?.toString())
                ?.name ?? '',
            topicName:
              topics.find((topic) => topic._id.toString() === activeSession.topicId?.toString())
                ?.name ?? '',
          }
        : null,
    };
  });
}

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const existingActive = await StudySession.findOne({
      userId: user.id,
      endedAt: null,
    });

    if (existingActive) {
      throw new ApiError('CONFLICT', 'An active study session already exists');
    }

    const body = await req.json();
    const startedAt = body.startedAt
      ? requireDateString(body.startedAt, 'startedAt')
      : new Date();

    const session = await StudySession.create({
      userId: user.id,
      subjectId: optionalObjectId(body.subjectId, 'subjectId'),
      topicId: optionalObjectId(body.topicId, 'topicId'),
      weeklyTaskId: optionalObjectId(body.weeklyTaskId, 'weeklyTaskId'),
      title: requireString(body.title, 'title'),
      notes: optionalString(body.notes),
      startedAt,
      endedAt: null,
      durationMinutes: 0,
    });

    return {
      session: toClientSession(session),
    };
  });
}
