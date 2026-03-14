import { subDays } from 'date-fns';
import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import Lecture from '@/models/Lecture';
import Mistake from '@/models/Mistake';
import MockTest from '@/models/MockTest';
import PYQProgress from '@/models/PYQProgress';
import WeeklyTask from '@/models/WeeklyTask';
import RevisionSchedule from '@/models/RevisionSchedule';
import Subject from '@/models/Subject';
import Topic from '@/models/Topic';

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const heatmapStart = subDays(startOfToday, 83);

    const [todayTasks, lectures, pyqTopics, mistakes, mockTests, heatmapTasks, revisions, subjects, topics] = await Promise.all([
      WeeklyTask.find({
        userId: user.id,
        scheduledFor: { $gte: startOfToday, $lte: endOfToday },
      })
        .sort({ displayOrder: 1, createdAt: 1 })
        .lean(),
      Lecture.find({ userId: user.id }).lean(),
      PYQProgress.find({ userId: user.id }).lean(),
      Mistake.find({ userId: user.id }).sort({ date: -1, createdAt: -1 }).lean(),
      MockTest.find({ userId: user.id }).sort({ date: -1, createdAt: -1 }).lean(),
      WeeklyTask.find({
        userId: user.id,
        scheduledFor: { $gte: heatmapStart, $lte: endOfToday },
      }).lean(),
      RevisionSchedule.find({ userId: user.id }).lean(),
      Subject.find({ userId: user.id }).lean(),
      Topic.find({ userId: user.id }).lean(),
    ]);

    const heatmap = Array.from({ length: 84 }).map((_, index) => {
      const date = subDays(endOfToday, 83 - index);
      const key = date.toISOString().slice(0, 10);
      const hours = heatmapTasks
        .filter((task) => task.scheduledFor.toISOString().slice(0, 10) === key)
        .reduce((sum, task) => sum + (task.estimatedMinutes ?? 0) / 60, 0);

      return {
        date: key,
        hours: Number(hours.toFixed(1)),
      };
    });

    const weakTopics = pyqTopics
      .map((topic) => {
        const attempted = topic.solvedQuestions;
        const correct = topic.correctQuestions;
        const inaccuracy = attempted > 0 ? (1 - correct / attempted) * 100 : 0;
        const mistakeCount = mistakes.filter(
          (mistake) => mistake.topicId?.toString() === topic.topicId.toString()
        ).length;
        const normalizedMistakeCount = Math.min(mistakeCount * 20, 100);
        const averageTimePerQuestion =
          attempted > 0 ? topic.totalTimeMinutes / attempted : 0;
        const timePenalty = averageTimePerQuestion > 3 ? Math.min((averageTimePerQuestion - 3) * 20, 100) : 0;
        const weaknessScore =
          0.5 * inaccuracy + 0.3 * normalizedMistakeCount + 0.2 * timePenalty;
        const topicInfo = topics.find((item) => item._id.toString() === topic.topicId.toString());
        const subjectInfo = subjects.find((item) => item._id.toString() === topic.subjectId.toString());

        return {
          topicId: topic.topicId.toString(),
          topicName: topicInfo?.name ?? 'Unknown Topic',
          subjectName: subjectInfo?.name ?? 'Unknown Subject',
          weaknessScore: Number(weaknessScore.toFixed(1)),
        };
      })
      .sort((a, b) => b.weaknessScore - a.weaknessScore)
      .slice(0, 3);

    return {
      todayTasks: todayTasks.map((task) => ({
        id: task._id.toString(),
        title: task.title,
        type: task.type,
        completed: task.status === 'completed',
      })),
      lectures: lectures.map((lecture) => ({
        id: lecture._id.toString(),
        status: lecture.status,
        needsRevision: lecture.needsRevision,
      })),
      pyqTopics: pyqTopics.map((topic) => ({
        id: topic._id.toString(),
        totalQuestions: topic.totalQuestions,
        solvedQuestions: topic.solvedQuestions,
      })),
      mistakes: mistakes.map((mistake) => ({
        id: mistake._id.toString(),
        source: mistake.source,
        status: mistake.status,
        subjectId: mistake.subjectId.toString(),
        mistakeType: mistake.mistakeType,
      })),
      mockTests: mockTests.map((test) => ({
        id: test._id.toString(),
        name: test.name,
        marksObtained: test.marksObtained,
      })),
      revisions: revisions.map((revision) => ({
        id: revision._id.toString(),
        nextRevisionDate: revision.nextRevisionDate.toISOString(),
        status: revision.status,
      })),
      weakTopics,
      heatmap,
    };
  });
}
