import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  optionalObjectId,
  optionalString,
  requireBoolean,
  requireNumber,
  requireObjectId,
} from '@/lib/validators';
import Lecture from '@/models/Lecture';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const lectureId = requireObjectId(id, 'id');
    const body = await req.json();
    const update: Record<string, unknown> = {};

    const title = optionalString(body.title);
    if (title) update.title = title;

    if (body.subjectId) update.subjectId = requireObjectId(body.subjectId, 'subjectId');
    if ('topicId' in body) update.topicId = optionalObjectId(body.topicId, 'topicId');
    if (body.duration !== undefined) update.durationMinutes = requireNumber(body.duration, 'duration', { min: 1 });
    if (body.status) update.status = optionalString(body.status)?.replace('in-progress', 'in_progress');
    if (body.needsRevision !== undefined) update.needsRevision = requireBoolean(body.needsRevision, 'needsRevision');

    const lecture = await Lecture.findOneAndUpdate(
      { _id: lectureId, userId: user.id },
      update,
      { returnDocument: 'after' }
    );

    if (!lecture) throw new ApiError('NOT_FOUND', 'Lecture not found');

    return {
      lecture: {
        id: lecture._id.toString(),
        subjectId: lecture.subjectId.toString(),
        topicId: lecture.topicId?.toString() ?? '',
        title: lecture.title,
        duration: lecture.durationMinutes,
        status: lecture.status === 'in_progress' ? 'in-progress' : lecture.status,
        needsRevision: lecture.needsRevision,
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
    const lectureId = requireObjectId(id, 'id');
    const lecture = await Lecture.findOneAndDelete({ _id: lectureId, userId: user.id });

    if (!lecture) throw new ApiError('NOT_FOUND', 'Lecture not found');

    return { deleted: true };
  });
}
