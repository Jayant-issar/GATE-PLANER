import mongoose from 'mongoose';
import RevisionSchedule from '@/models/RevisionSchedule';

const REVISION_INTERVALS_DAYS = [1, 3, 7, 21, 60] as const;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getRevisionIntervals() {
  return REVISION_INTERVALS_DAYS;
}

export async function syncLectureRevisionSchedule(input: {
  userId: string;
  lectureId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  needsRevision: boolean;
}) {
  if (!input.needsRevision) {
    await RevisionSchedule.findOneAndDelete({
      userId: input.userId,
      lectureId: input.lectureId,
    });
    return;
  }

  const tomorrow = addDays(startOfDay(new Date()), REVISION_INTERVALS_DAYS[0]);

  await RevisionSchedule.findOneAndUpdate(
    {
      userId: input.userId,
      lectureId: input.lectureId,
    },
    {
      userId: input.userId,
      lectureId: input.lectureId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      nextRevisionDate: tomorrow,
      intervalLevel: 0,
      status: 'pending',
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );
}

export async function completeRevision(input: {
  userId: string;
  revisionId: mongoose.Types.ObjectId;
}) {
  const revision = await RevisionSchedule.findOne({
    _id: input.revisionId,
    userId: input.userId,
  });

  if (!revision) {
    return null;
  }

  const nextIntervalLevel = Math.min(
    revision.intervalLevel + 1,
    REVISION_INTERVALS_DAYS.length - 1
  );

  revision.intervalLevel = nextIntervalLevel;
  revision.nextRevisionDate = addDays(
    startOfDay(new Date()),
    REVISION_INTERVALS_DAYS[nextIntervalLevel]
  );
  revision.status = 'pending';
  await revision.save();

  return revision;
}
