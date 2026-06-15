import mongoose from 'mongoose';
import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';

/**
 * Resolve a startup row by URL `id` without Mongoose ObjectId-only casting.
 * Supports: custom string `_id` (e.g. `startup_lucy_ai`), normal ObjectId, and
 * 24-char hex stored as BSON string.
 */
async function findStartupRawById(
  id: string,
): Promise<Record<string, unknown> | null> {
  let raw = (await Startup.collection.findOne({
    _id: id,
  } as never)) as Record<string, unknown> | null;

  if (!raw && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      raw = (await Startup.collection.findOne({
        _id: new mongoose.Types.ObjectId(id),
      } as never)) as Record<string, unknown> | null;
    } catch {
      /* invalid ObjectId */
    }
  }

  if (!raw && /^[0-9a-fA-F]{24}$/.test(id)) {
    const lowered = id.toLowerCase();
    const byStringId = await Startup.aggregate<{ _id: unknown }>([
      { $match: { $expr: { $eq: [{ $toString: '$_id' }, lowered] } } },
      { $limit: 1 },
    ]);
    if (byStringId.length > 0) {
      raw = (await Startup.collection.findOne({
        _id: byStringId[0]._id,
      } as never)) as Record<string, unknown> | null;
    }
  }

  return raw;
}

// ---------- GET ----------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const rawId = (await params).id;
    const id = typeof rawId === 'string' ? rawId.trim() : '';

    if (!id) {
      return Response.json({ error: '`startupId` is required' }, { status: 400 });
    }

    const raw = await findStartupRawById(id);
    const startup = raw ? Startup.hydrate(raw) : null;

    if (!startup) {
      let count = 0;
      let sampleIds: string[] = [];
      try {
        count = await Startup.countDocuments();
        const samples = await Startup.find({}, { _id: 1, name: 1 }).limit(5).lean();
        sampleIds = samples.map((s) => `${s.name} (${String(s._id)})`);
      } catch (e) {}

      return Response.json(
        {
          error: 'Start-up not found',
          debug: {
            requestedId: id,
            databaseName: mongoose.connection.db?.databaseName ?? null,
            totalInDb: count,
            foundInDb: sampleIds,
            info:
              count === 0
                ? 'Your application is connected to an empty database. Please check your MONGODB_URI in .env.local.'
                : `Found ${count} startups in database "${mongoose.connection.db?.databaseName ?? 'unknown'}" collection "startups", but none match ID "${id}". Compare this database name in MongoDB Compass (same cluster + database).`,
          },
        },
        { status: 404 }
      );
    }

    const firstFounder = startup.founders?.[0];
    const isReference =
      firstFounder &&
      (typeof firstFounder === 'string' ||
        (typeof firstFounder === 'object' && !('name' in firstFounder)));

    if (isReference) {
      try {
        await startup.populate({
          path: 'founders',
          model: 'User',
          select: 'name email role isValidate faydaId phone_number nationality bio image',
        });
      } catch (popError) {
        console.warn('Population failed for startup:', id, popError);
      }
    }

    const startupPlain =
      typeof (startup as { toObject?: (o?: object) => object }).toObject === 'function'
        ? (startup as { toObject: (o?: object) => object }).toObject({
            flattenMaps: true,
            versionKey: false,
          })
        : startup;

    return Response.json({
      message: 'Startup retrieved successfully.',
      startup: startupPlain,
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
    const rawId = (await params).id;
    const id = typeof rawId === 'string' ? rawId.trim() : '';

    if (!id) {
      return Response.json({ error: '`startupId` is required' }, { status: 400 });
    }

    const data = (await req.json()) as Record<string, unknown>;
    const existing = await findStartupRawById(id);
    if (!existing) {
      return Response.json({ error: 'Start-up not found' }, { status: 404 });
    }

    const pk = existing._id;
    const patch = { ...data };
    delete patch._id;

    await Startup.collection.updateOne({ _id: pk } as never, { $set: patch });

    const updatedRaw = await Startup.collection.findOne({ _id: pk } as never);
    if (!updatedRaw) {
      return Response.json(
        { error: 'Start-up not found after update' },
        { status: 404 },
      );
    }

    let startup = Startup.hydrate(updatedRaw);

    const firstFounder = startup.founders?.[0];
    const isReference =
      firstFounder &&
      (typeof firstFounder === 'string' ||
        (typeof firstFounder === 'object' && !('name' in firstFounder)));

    if (isReference) {
      try {
        await startup.populate({
          path: 'founders',
          model: 'User',
          select: 'name email role isValidate faydaId phone_number nationality bio image',
        });
      } catch (popError) {
        console.warn('Population failed for startup update:', id, popError);
      }
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
    const rawId = (await params).id;
    const id = typeof rawId === 'string' ? rawId.trim() : '';

    if (!id) {
      return Response.json({ error: '`startupId` is required' }, { status: 400 });
    }

    const existing = await findStartupRawById(id);
    if (!existing) {
      return Response.json({ error: 'Start-up not found' }, { status: 404 });
    }

    const { deletedCount } = await Startup.collection.deleteOne({
      _id: existing._id,
    } as never);

    if (deletedCount === 0) {
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
