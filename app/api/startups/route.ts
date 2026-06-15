import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { serializeStartupId } from '@/lib/serialize-startup-id';
import { IUser, User } from '@/models/user';
import { z } from 'zod';
import { StartupZodSchema } from '@/zod-validator/validator';
import { Startup } from '@/models/start-up';
import { auth } from '@/lib/auth';
import { recordSearch, recordFilters } from '@/lib/analytics';

// post start-up
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const { formData, email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!user.faydaId || !user.isValidate) {
      return NextResponse.json(
        { error: 'Fayda ID verification required.' },
        { status: 403 }
      );
    }

    // Validate formData
    try {
      StartupZodSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid form data', details: error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      throw error;
    }
    // Create startup document
    const startup = new Startup({
      name: formData.startupName,
      website: formData.website || '',
      sector: formData.sector || '',
      location: formData.location,
      foundedYear: formData.foundedYear || '',
      employees: formData.employees || '',
      description: formData.description,
      pitch: formData.pitch || '',
      achievements: formData.achievements || '',
      documents: [],
      founderRole: formData.founderRole || '',
      founderEmail: email,
      founderPhone: formData.founderPhone || '',
      founderBio: formData.founderBio || '',
      revenue: formData.revenue || '',
      stage: formData.stage || '',
      founders: [user._id],
      status: 'pending',
    });

    await startup.save();

    // Update user's role to 'startup'
    await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { role: 'startup' } },
      { runValidators: true }
    );

    return NextResponse.json(
      { success: true, message: 'Startup submitted successfully.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting startup:', error);
    return NextResponse.json(
      { error: 'Submission failed', details: error.message },
      { status: 500 }
    );
  }
}
// get all start-up
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const url = new URL(req.url);

    // Extract range/query params explicitly
    const minRevenue = url.searchParams.get('minRevenue');
    const maxRevenue = url.searchParams.get('maxRevenue');
    const minEmployees = url.searchParams.get('minEmployees');
    const maxEmployees = url.searchParams.get('maxEmployees');
    const createdAfter = url.searchParams.get('createdAfter');
    const createdBefore = url.searchParams.get('createdBefore');
    const founderEmail = url.searchParams.get('founderEmail');
    // Only allow these filters
    const allowedFilters = [
      'search',
      'sector',
      'location',
      'foundedYear',
      'status',
      'stage',
    ];

    let filters: any = {};

    // Restrict for non-admin users (only approved startups are visible)
    // Retrieve the session from the request headers
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (session?.user.role !== 'admin') {
      filters.status = { $in: ['approved', 'pending', 'active'] };
    }

    // Handle allowed filters
    allowedFilters.forEach((field) => {
      const value = url.searchParams.get(field);
      if (value) {
        if (field === 'search') {
          filters.$or = [
            { name: { $regex: value, $options: 'i' } },
            { description: { $regex: value, $options: 'i' } },
            { pitch: { $regex: value, $options: 'i' } },
            { achievements: { $regex: value, $options: 'i' } },
          ];
        } else {
          filters[field] = value;
        }
      }
    });

    // Revenue range filter
    if (minRevenue || maxRevenue) {
      filters.revenue = {};
      if (minRevenue) filters.revenue.$gte = parseInt(minRevenue);
      if (maxRevenue) filters.revenue.$lte = parseInt(maxRevenue);
    }

    // Employees range filter
    if (minEmployees || maxEmployees) {
      filters.employees = {};
      if (minEmployees) filters.employees.$gte = parseInt(minEmployees);
      if (maxEmployees) filters.employees.$lte = parseInt(maxEmployees);
    }

    // Date range filter
    if (createdAfter || createdBefore) {
      filters.createdAt = {};
      if (createdAfter) filters.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) filters.createdAt.$lte = new Date(createdBefore);
    }

    // Founder email filter
    if (founderEmail) {
      filters.founderEmail = { $regex: founderEmail, $options: 'i' };
    }

    // Lean + explicit string _ids so client links are never `/startups/` (empty segment).
    const docs = await Startup.find(filters).lean();
    const startups = docs.map((doc) => ({
      ...doc,
      _id: serializeStartupId(doc._id),
    }));

    // Record real search/filter usage so investor "top search terms" and
    // "popular filters" are backed by data instead of constants. Errors are
    // swallowed inside the helpers — analytics never blocks the directory.
    const trackCtx = {
      userId: session?.user?.id,
      role: (session?.user as { role?: string } | undefined)?.role,
      sessionId: req.cookies.get('gc_sid')?.value,
    };
    const searchValue = url.searchParams.get('search');
    if (searchValue) await recordSearch(searchValue, trackCtx);
    await recordFilters(
      {
        sector: url.searchParams.get('sector') || undefined,
        stage: url.searchParams.get('stage') || undefined,
        location: url.searchParams.get('location') || undefined,
        foundedYear: url.searchParams.get('foundedYear') || undefined,
      },
      trackCtx
    );

    return NextResponse.json({
      message: 'Startups retrieved successfully.',
      startups,
    });
  } catch (error: any) {
    console.error('API Error in GET /api/startups:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve startups',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
