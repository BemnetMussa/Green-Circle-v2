import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';
import { IUser } from '@/models/user';

// ---------- GET ----------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await params;

    if (!id) {
      return Response.json({ error: '`startupId` is required' }, { status: 400 });
    }

    const startup = await Startup.findById(id).populate<{ founders: IUser[] }>({
      path: 'founders',
      model: 'User',
      select: 'name email role isValidate faydaId phone_number nationality bio',
    });

    if (!startup) {
      return Response.json({ error: 'Start-up not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Startup retrieved successfully.',
      startup,
    });
  } catch (error: any) {
    return Response.json(
      { error: 'Retrieving startup data failed', details: error.message },
      { status: 500 }
    );
  }
}

// ---------- PUT ----------
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    if (!id) {
      return Response.json({ error: '`startupId` is required' }, { status: 400 });
    }

    const data = await req.json();

    const startup = await Startup.findByIdAndUpdate(id, data, { new: true }).populate<{
      founders: IUser[];
    }>({
      path: 'founders',
      model: 'User',
      select: 'name email role isValidate faydaId phone_number nationality bio',
    });

    if (!startup) {
      return Response.json({ error: 'Start-up not found' }, { status: 404 });
    }

    return Response.json(
      {
        message: 'Startup updated successfully.',
        startup,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      { error: 'Updating startup data failed', details: error.message },
      { status: 500 }
    );
  }
}

// ---------- DELETE ----------
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    if (!id) {
      return Response.json({ error: '`startupId` is required' }, { status: 400 });
    }

    const deleted = await Startup.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json({ error: 'Start-up not found' }, { status: 404 });
    }

    return Response.json(
      { message: 'Start-up rejected (deleted) successfully', startupId: id },
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      { error: 'Failed to reject start-up', details: error.message },
      { status: 500 }
    );
  }
}
