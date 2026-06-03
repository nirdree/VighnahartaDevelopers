import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plot from '@/models/Plot';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const query = projectId ? { projectId } : {};
    const plots = await Plot.find(query)
      .populate('customerId', 'name mobile email')
      .populate('assignedAgent', 'name email')
      .sort({ plotNumber: 1 });

    return NextResponse.json({ success: true, data: plots });
  } catch (error) {
    console.error('Get plots error:', error);
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

    if (!body.projectId || !body.plotNumber || !body.shapeType) {
      return NextResponse.json(
        { success: false, error: 'projectId, plotNumber, and shapeType are required' },
        { status: 400 }
      );
    }

    const plot = await Plot.create(body);
    const populated = await Plot.findById(plot._id)
      .populate('customerId', 'name mobile email')
      .populate('assignedAgent', 'name email');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error('Create plot error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Plot number already exists in this project' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
