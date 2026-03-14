import dbConnect from '@/lib/mongodb';
import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireObjectId } from '@/lib/validators';
import MockTest from '@/models/MockTest';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const testId = requireObjectId(id, 'id');
    const test = await MockTest.findOneAndDelete({ _id: testId, userId: user.id });

    if (!test) throw new ApiError('NOT_FOUND', 'Mock test not found');

    return { deleted: true };
  });
}
