import { ApiError, withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { completeRevision } from '@/lib/revision';
import { requireObjectId } from '@/lib/validators';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const { id } = await params;
    const revisionId = requireObjectId(id, 'id');
    const revision = await completeRevision({ userId: user.id, revisionId });

    if (!revision) {
      throw new ApiError('NOT_FOUND', 'Revision item not found');
    }

    return {
      revision: {
        id: revision._id.toString(),
        nextRevisionDate: revision.nextRevisionDate.toISOString(),
        intervalLevel: revision.intervalLevel,
        status: revision.status,
      },
    };
  });
}
