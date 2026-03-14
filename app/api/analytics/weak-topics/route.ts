import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import Mistake from '@/models/Mistake';
import PYQProgress from '@/models/PYQProgress';
import Subject from '@/models/Subject';
import Topic from '@/models/Topic';

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const [pyqTopics, mistakes, subjects, topics] = await Promise.all([
      PYQProgress.find({ userId: user.id }).lean(),
      Mistake.find({ userId: user.id }).lean(),
      Subject.find({ userId: user.id }).lean(),
      Topic.find({ userId: user.id }).lean(),
    ]);

    const weakTopics = pyqTopics
      .map((topic) => {
        const attempted = topic.solvedQuestions;
        const correct = topic.correctQuestions;
        const inaccuracy =
          attempted > 0 ? (1 - correct / attempted) * 100 : 0;
        const mistakeCount = mistakes.filter(
          (mistake) => mistake.topicId?.toString() === topic.topicId.toString()
        ).length;
        const normalizedMistakeCount = Math.min(mistakeCount * 20, 100);
        const averageTimePerQuestion =
          attempted > 0 ? topic.totalTimeMinutes / attempted : 0;
        const timePenalty = averageTimePerQuestion > 3 ? Math.min((averageTimePerQuestion - 3) * 20, 100) : 0;
        const weaknessScore =
          0.5 * inaccuracy + 0.3 * normalizedMistakeCount + 0.2 * timePenalty;
        const topicInfo = topics.find(
          (item) => item._id.toString() === topic.topicId.toString()
        );
        const subjectInfo = subjects.find(
          (item) => item._id.toString() === topic.subjectId.toString()
        );

        return {
          topicId: topic.topicId.toString(),
          topicName: topicInfo?.name ?? 'Unknown Topic',
          subjectId: topic.subjectId.toString(),
          subjectName: subjectInfo?.name ?? 'Unknown Subject',
          weaknessScore: Number(weaknessScore.toFixed(1)),
          accuracy:
            attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0,
          mistakeCount,
          averageTimePerQuestion: Number(averageTimePerQuestion.toFixed(1)),
        };
      })
      .sort((a, b) => b.weaknessScore - a.weaknessScore)
      .slice(0, 10);

    return { weakTopics };
  });
}
