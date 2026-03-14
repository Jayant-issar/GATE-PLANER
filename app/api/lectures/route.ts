import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  optionalObjectId,
  requireBoolean,
  requireEnumValue,
  requireNumber,
  requireObjectId,
  requireString,
} from '@/lib/validators';
import Lecture from '@/models/Lecture';

function toClientStatus(status: 'pending' | 'in_progress' | 'completed') {
  return status === 'in_progress' ? 'in-progress' : status;
}

function fromClientStatus(status: string) {
  return status === 'in-progress' ? 'in_progress' : status;
}

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const lectures = await Lecture.find({ userId: user.id }).sort({ createdAt: -1 }).lean();

    return {
      lectures: lectures.map((lecture) => ({
        id: lecture._id.toString(),
        subjectId: lecture.subjectId.toString(),
        topicId: lecture.topicId?.toString() ?? '',
        title: lecture.title,
        duration: lecture.durationMinutes,
        status: toClientStatus(lecture.status),
        needsRevision: lecture.needsRevision,
      })),
    };
  });
}

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const body = await req.json();
    const lecture = await Lecture.create({
      userId: user.id,
      subjectId: requireObjectId(body.subjectId, 'subjectId'),
      topicId: optionalObjectId(body.topicId, 'topicId'),
      title: requireString(body.title, 'title'),
      durationMinutes: requireNumber(body.duration, 'duration', { min: 1 }),
      status: requireEnumValue(body.status, 'status', ['pending', 'in-progress', 'completed']).replace(
        'in-progress',
        'in_progress'
      ),
      needsRevision: requireBoolean(body.needsRevision, 'needsRevision'),
    });

    return {
      lecture: {
        id: lecture._id.toString(),
        subjectId: lecture.subjectId.toString(),
        topicId: lecture.topicId?.toString() ?? '',
        title: lecture.title,
        duration: lecture.durationMinutes,
        status: toClientStatus(lecture.status),
        needsRevision: lecture.needsRevision,
      },
    };
  });
}
