import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { optionalString, requireObjectId } from '@/lib/validators';
import Topic from '@/models/Topic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const topicId = requireObjectId(id, 'id');
    const body = await req.json();

    const update: Record<string, unknown> = {};
    const name = optionalString(body.name);
    const status = optionalString(body.status);

    if (name) update.name = name;
    if (status) update.status = status;

    const topic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: user.id },
      update,
      { returnDocument: 'after' }
    );

    if (!topic) {
      throw new ApiError('NOT_FOUND', 'Topic not found');
    }

    return {
      topic: {
        id: topic._id.toString(),
        subjectId: topic.subjectId.toString(),
        name: topic.name,
        status: topic.status,
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
    const topicId = requireObjectId(id, 'id');
    const topic = await Topic.findOneAndDelete({ _id: topicId, userId: user.id });

    if (!topic) {
      throw new ApiError('NOT_FOUND', 'Topic not found');
    }

    return { deleted: true };
  });
}
