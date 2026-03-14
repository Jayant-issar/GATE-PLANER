import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  optionalObjectId,
  optionalString,
  requireBoolean,
  requireDateString,
  requireEnumValue,
  requireObjectId,
  requireString,
} from '@/lib/validators';
import Mistake from '@/models/Mistake';

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const mistakes = await Mistake.find({ userId: user.id }).sort({ date: -1, createdAt: -1 }).lean();

    return {
      mistakes: mistakes.map((mistake) => ({
        id: mistake._id.toString(),
        date: mistake.date.toISOString(),
        source: mistake.source,
        subjectId: mistake.subjectId.toString(),
        topicId: mistake.topicId?.toString() ?? '',
        questionDescription: mistake.questionDescription ?? '',
        mistakeType: mistake.mistakeType,
        whatWentWrong: mistake.whatWentWrong,
        learning: mistake.learning,
        isRepeated: mistake.isRepeated,
        status: mistake.status,
      })),
    };
  });
}

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const body = await req.json();
    const mistake = await Mistake.create({
      userId: user.id,
      date: requireDateString(body.date, 'date'),
      source: requireString(body.source, 'source'),
      subjectId: requireObjectId(body.subjectId, 'subjectId'),
      topicId: optionalObjectId(body.topicId, 'topicId'),
      questionDescription: optionalString(body.questionDescription),
      mistakeType: requireEnumValue(body.mistakeType, 'mistakeType', [
        'calculation',
        'conceptual',
        'silly',
        'formula',
        'misread',
        'time',
      ]),
      whatWentWrong: requireString(body.whatWentWrong, 'whatWentWrong'),
      learning: requireString(body.learning, 'learning'),
      isRepeated: requireBoolean(body.isRepeated, 'isRepeated'),
      status: requireEnumValue(body.status, 'status', ['needs_review', 'resolved']),
    });

    return {
      mistake: {
        id: mistake._id.toString(),
        date: mistake.date.toISOString(),
        source: mistake.source,
        subjectId: mistake.subjectId.toString(),
        topicId: mistake.topicId?.toString() ?? '',
        questionDescription: mistake.questionDescription ?? '',
        mistakeType: mistake.mistakeType,
        whatWentWrong: mistake.whatWentWrong,
        learning: mistake.learning,
        isRepeated: mistake.isRepeated,
        status: mistake.status,
      },
    };
  });
}
