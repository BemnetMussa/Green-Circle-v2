import { Startup } from '@/models/start-up';
import { IUser } from '@/models/user';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { serializeStartupId } from '@/lib/serialize-startup-id';

// startup associated with the logged-in user
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ userEmail: string }>;
  }
) {
  try {
    await connectToDB();
    const { userEmail } = await params;

    if (!userEmail) {
      return NextResponse.json(
        { error: '`userEmail` is required' },
        { status: 400 }
      );
    }

    const startups = await Startup.find({
      founderEmail: userEmail,
    }).populate<{ founders: IUser[] }>({
      path: 'founders',
      model: 'User',
      select: 'name email role isValidate faydaId phone_number nationality bio',
    });

    if (!startups) {
      return NextResponse.json(
        { error: 'Startups not found.' },
        { status: 404 }
      );
    }

    const startupsPayload = startups.map((s) => {
      const o = s.toObject({ flattenMaps: true, versionKey: false });
      return { ...o, _id: serializeStartupId(o._id) };
    });

    return NextResponse.json({
      message: 'Startups retrieved successfully',
      startups: startupsPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to retrieve startups',
        details: error.message,
        msg: error,
      },
      { status: 500 }
    );
  }
}
