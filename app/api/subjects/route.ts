import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireString } from '@/lib/validators';
import Subject from '@/models/Subject';
import Topic from '@/models/Topic';

async function buildSyllabus(userId: string) {
  const [subjects, topics] = await Promise.all([
    Subject.find({ userId, isArchived: false }).sort({ displayOrder: 1, createdAt: 1 }).lean(),
    Topic.find({ userId, isArchived: false }).sort({ displayOrder: 1, createdAt: 1 }).lean(),
  ]);

  return subjects.map((subject) => ({
    id: subject._id.toString(),
    name: subject.name,
    color: subject.color ?? null,
    topics: topics
      .filter((topic) => topic.subjectId.toString() === subject._id.toString())
      .map((topic) => ({
        id: topic._id.toString(),
        name: topic.name,
        status: topic.status,
      })),
  }));
}

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();
    return { subjects: await buildSyllabus(user.id) };
  });
}

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const body = await req.json();
    const name = requireString(body.name, 'name');

    const subjectCount = await Subject.countDocuments({ userId: user.id });

    const subject = await Subject.create({
      userId: user.id,
      name,
      color: body.color,
      displayOrder: subjectCount,
    });

    return {
      subject: {
        id: subject._id.toString(),
        name: subject.name,
        color: subject.color ?? null,
        topics: [],
      },
      subjects: await buildSyllabus(user.id),
    };
  });
}
