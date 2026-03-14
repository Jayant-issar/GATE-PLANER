import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireObjectId, requireString } from '@/lib/validators';
import Topic from '@/models/Topic';

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const body = await req.json();
    const subjectId = requireObjectId(body.subjectId, 'subjectId');
    const name = requireString(body.name, 'name');
    const topicCount = await Topic.countDocuments({ userId: user.id, subjectId });

    const topic = await Topic.create({
      userId: user.id,
      subjectId,
      name,
      displayOrder: topicCount,
    });

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
