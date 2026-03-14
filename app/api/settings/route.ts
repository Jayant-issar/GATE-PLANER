import dbConnect from '@/lib/mongodb';
import { withApiHandler } from '@/lib/api';
import { requireAuthenticatedUser } from '@/lib/auth';
import { optionalString, requireNumber } from '@/lib/validators';
import UserSettings from '@/models/UserSettings';

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();

    const settings = await UserSettings.findOneAndUpdate(
      { userId: user.id },
      {},
      { upsert: true, returnDocument: 'after' }
    ).lean();

    return {
      settings: {
        targetYear: settings?.targetYear ?? 2027,
        dailyStudyHoursGoal: settings?.dailyStudyHoursGoal ?? 4,
        timezone: settings?.timezone ?? 'Asia/Kolkata',
        weekStartsOn: settings?.weekStartsOn ?? 1,
      },
    };
  });
}

export async function PATCH(req: Request) {
  return withApiHandler(async () => {
    const user = await requireAuthenticatedUser();
    await dbConnect();
    const body = await req.json();

    const settings = await UserSettings.findOneAndUpdate(
      { userId: user.id },
      {
        targetYear: requireNumber(body.targetYear, 'targetYear', { min: 2024 }),
        dailyStudyHoursGoal: requireNumber(body.dailyStudyHoursGoal, 'dailyStudyHoursGoal', { min: 1 }),
        timezone: optionalString(body.timezone) ?? 'Asia/Kolkata',
        weekStartsOn: requireNumber(body.weekStartsOn, 'weekStartsOn', { min: 0, max: 1 }),
      },
      { upsert: true, returnDocument: 'after' }
    ).lean();

    return {
      settings: {
        targetYear: settings?.targetYear ?? 2027,
        dailyStudyHoursGoal: settings?.dailyStudyHoursGoal ?? 4,
        timezone: settings?.timezone ?? 'Asia/Kolkata',
        weekStartsOn: settings?.weekStartsOn ?? 1,
      },
    };
  });
}
