import { subDays } from 'date-fns';
import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import Lecture from '@/models/Lecture';
import Mistake from '@/models/Mistake';
import MockTest from '@/models/MockTest';
import PYQProgress from '@/models/PYQProgress';
import WeeklyTask from '@/models/WeeklyTask';

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const heatmapStart = subDays(startOfToday, 83);

    const [todayTasks, lectures, pyqTopics, mistakes, mockTests, heatmapTasks] = await Promise.all([
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
      heatmap,
    };
  });
}
