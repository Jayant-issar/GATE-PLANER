import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  optionalObjectId,
  optionalString,
  requireBoolean,
  requireDateString,
  requireEnumValue,
  requireObjectId,
} from '@/lib/validators';
import Mistake from '@/models/Mistake';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const mistakeId = requireObjectId(id, 'id');
    const body = await req.json();

    const mistake = await Mistake.findOneAndUpdate(
      { _id: mistakeId, userId: user.id },
      {
        date: requireDateString(body.date, 'date'),
        source: body.source,
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
        whatWentWrong: body.whatWentWrong,
        learning: body.learning,
        isRepeated: requireBoolean(body.isRepeated, 'isRepeated'),
        status: requireEnumValue(body.status, 'status', ['needs_review', 'resolved']),
      },
      { returnDocument: 'after' }
    );

    if (!mistake) throw new ApiError('NOT_FOUND', 'Mistake not found');

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const mistakeId = requireObjectId(id, 'id');
    const mistake = await Mistake.findOneAndDelete({ _id: mistakeId, userId: user.id });

    if (!mistake) throw new ApiError('NOT_FOUND', 'Mistake not found');

    return { deleted: true };
  });
}
