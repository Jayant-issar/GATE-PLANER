import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { optionalString, requireObjectId } from '@/lib/validators';
import Subject from '@/models/Subject';
import Topic from '@/models/Topic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const subjectId = requireObjectId(id, 'id');
    const body = await req.json();

    const update: Record<string, unknown> = {};
    const name = optionalString(body.name);
    const color = optionalString(body.color);

    if (name) update.name = name;
    if (color !== undefined) update.color = color;

    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, userId: user.id },
      update,
      { returnDocument: 'after' }
    );

    if (!subject) {
      throw new ApiError('NOT_FOUND', 'Subject not found');
    }

    return {
      subject: {
        id: subject._id.toString(),
        name: subject.name,
        color: subject.color ?? null,
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
    const subjectId = requireObjectId(id, 'id');

    const subject = await Subject.findOneAndDelete({ _id: subjectId, userId: user.id });

    if (!subject) {
      throw new ApiError('NOT_FOUND', 'Subject not found');
    }

    await Topic.deleteMany({ subjectId, userId: user.id });

    return { deleted: true };
  });
}
