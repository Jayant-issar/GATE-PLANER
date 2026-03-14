import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  requireDateString,
  requireEnumValue,
  requireNumber,
  requireString,
} from '@/lib/validators';
import WeeklyTask from '@/models/WeeklyTask';

export async function GET(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const query: Record<string, unknown> = { userId: user.id };

    if (from || to) {
      query.scheduledFor = {};
      if (from) (query.scheduledFor as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.scheduledFor as Record<string, unknown>).$lte = new Date(to);
    }

    const tasks = await WeeklyTask.find(query)
      .sort({ scheduledFor: 1, displayOrder: 1, createdAt: 1 })
      .lean();

    return {
      tasks: tasks.map((task) => ({
        id: task._id.toString(),
        title: task.title,
        type: task.type,
        completed: task.status === 'completed',
        date: task.scheduledFor.toISOString(),
      })),
    };
  });
}

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const body = await req.json();
    const scheduledFor = requireDateString(body.date, 'date');
    const dailyCount = await WeeklyTask.countDocuments({
      userId: user.id,
      scheduledFor: {
        $gte: new Date(new Date(scheduledFor).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(scheduledFor).setHours(23, 59, 59, 999)),
      },
    });

    const task = await WeeklyTask.create({
      userId: user.id,
      title: requireString(body.title, 'title'),
      type: requireEnumValue(body.type, 'type', ['lecture', 'pyq', 'revision', 'mock_test']),
      status: body.completed ? 'completed' : 'pending',
      scheduledFor,
      displayOrder: requireNumber(body.displayOrder ?? dailyCount, 'displayOrder', { min: 0 }),
    });

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
