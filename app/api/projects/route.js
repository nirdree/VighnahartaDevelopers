import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Plot from '@/models/Plot';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const projects = await Project.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = projects.map((p) => p._id);

    // One aggregation instead of 3 * N count queries
    const stats = await Plot.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: '$projectId',
          totalPlots: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] },
          },
          sold: {
            $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsByProjectId = new Map(
      stats.map((s) => [String(s._id), { totalPlots: s.totalPlots, available: s.available, sold: s.sold }])
    );

    const projectsWithCounts = projects.map((p) => ({
      ...p,
      stats: statsByProjectId.get(String(p._id)) ?? { totalPlots: 0, available: 0, sold: 0 },
    }));

    return NextResponse.json({ success: true, data: projectsWithCounts });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const body = await request.json();
    const { name, location, description, totalArea } = body;

    if (!name || !location) {
      return NextResponse.json({ success: false, error: 'Name and location are required' }, { status: 400 });
    }

    const project = await Project.create({
      name,
      location,
      description,
      totalArea,
      createdBy: user.id,
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
