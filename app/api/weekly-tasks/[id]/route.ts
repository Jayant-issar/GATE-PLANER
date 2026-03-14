import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  optionalString,
  requireBoolean,
  requireDateString,
  requireNumber,
  requireObjectId,
} from '@/lib/validators';
import WeeklyTask from '@/models/WeeklyTask';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const taskId = requireObjectId(id, 'id');
    const body = await req.json();
    const update: Record<string, unknown> = {};

    const title = optionalString(body.title);
    if (title) update.title = title;
    if (body.completed !== undefined) update.status = requireBoolean(body.completed, 'completed') ? 'completed' : 'pending';
    if (body.date) update.scheduledFor = requireDateString(body.date, 'date');
    if (body.displayOrder !== undefined) update.displayOrder = requireNumber(body.displayOrder, 'displayOrder', { min: 0 });

    const task = await WeeklyTask.findOneAndUpdate(
      { _id: taskId, userId: user.id },
      update,
      { returnDocument: 'after' }
    );

    if (!task) throw new ApiError('NOT_FOUND', 'Task not found');

    return {
      task: {
        id: task._id.toString(),
        title: task.title,
        type: task.type,
        completed: task.status === 'completed',
        date: task.scheduledFor.toISOString(),
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
    const taskId = requireObjectId(id, 'id');
    const task = await WeeklyTask.findOneAndDelete({ _id: taskId, userId: user.id });

    if (!task) throw new ApiError('NOT_FOUND', 'Task not found');

    return { deleted: true };
  });
}
