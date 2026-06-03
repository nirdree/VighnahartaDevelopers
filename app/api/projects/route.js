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
      .sort({ createdAt: -1 });

    // Attach plot counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const totalPlots = await Plot.countDocuments({ projectId: project._id });
        const available = await Plot.countDocuments({ projectId: project._id, status: 'available' });
        const sold = await Plot.countDocuments({ projectId: project._id, status: 'sold' });
        return {
          ...project.toObject(),
          stats: { totalPlots, available, sold },
        };
      })
    );

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
