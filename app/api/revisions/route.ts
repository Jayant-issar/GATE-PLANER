import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import Lecture from '@/models/Lecture';
import RevisionSchedule from '@/models/RevisionSchedule';
import Subject from '@/models/Subject';
import Topic from '@/models/Topic';

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const today = startOfToday();

    await RevisionSchedule.updateMany(
      {
        userId: user.id,
        nextRevisionDate: { $lt: today },
        status: 'pending',
      },
      { status: 'overdue' }
    );

    const [revisions, lectures, subjects, topics] = await Promise.all([
      RevisionSchedule.find({ userId: user.id })
        .sort({ nextRevisionDate: 1, createdAt: 1 })
        .lean(),
      Lecture.find({ userId: user.id }).lean(),
      Subject.find({ userId: user.id }).lean(),
      Topic.find({ userId: user.id }).lean(),
    ]);

    return {
      revisions: revisions.map((revision) => {
        const lecture = lectures.find(
          (item) => item._id.toString() === revision.lectureId?.toString()
        );
        const subject = subjects.find(
          (item) => item._id.toString() === revision.subjectId?.toString()
        );
        const topic = topics.find(
          (item) => item._id.toString() === revision.topicId?.toString()
        );

        return {
          id: revision._id.toString(),
          lectureId: revision.lectureId?.toString() ?? '',
          subjectId: revision.subjectId?.toString() ?? '',
          topicId: revision.topicId?.toString() ?? '',
          lectureTitle: lecture?.title ?? 'Revision Item',
          subjectName: subject?.name ?? 'Unknown Subject',
          topicName: topic?.name ?? '',
          nextRevisionDate: revision.nextRevisionDate.toISOString(),
          intervalLevel: revision.intervalLevel,
          status: revision.status,
        };
      }),
    };
  });
}
