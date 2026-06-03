import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plot from '@/models/Plot';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const plot = await Plot.findById(params.id)
      .populate('customerId', 'name mobile email address notes')
      .populate('assignedAgent', 'name email');

    if (!plot) return NextResponse.json({ success: false, error: 'Plot not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: plot });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const body = await request.json();
    const plot = await Plot.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
      .populate('customerId', 'name mobile email address notes')
      .populate('assignedAgent', 'name email');

    if (!plot) return NextResponse.json({ success: false, error: 'Plot not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: plot });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    await Plot.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, data: 'Plot deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
