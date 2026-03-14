import bcrypt from 'bcryptjs';
import { ApiError, withApiHandler } from '@/lib/api';
import dbConnect from '@/lib/mongodb';
import { requireString } from '@/lib/validators';
import User from '@/models/User';

export async function POST(req: Request) {
  return withApiHandler(async () => {
    const body = await req.json();
    const name = requireString(body.name, 'name');
    const email = requireString(body.email, 'email').toLowerCase();
    const password = requireString(body.password, 'password');

    if (password.length < 6) {
      throw new ApiError('BAD_REQUEST', 'Password must be at least 6 characters');
    }

    await dbConnect();

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw new ApiError('CONFLICT', 'User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return {
      message: 'User registered successfully',
      userId: user._id.toString(),
    };
  });
}
