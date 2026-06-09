import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import Plot from '@/models/Plot';
import Payment from '@/models/Payment';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const customer = await Customer.findById(params.id);
    if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });

    const [plots, payments] = await Promise.all([
      Plot.find({ customerId: params.id }).populate('projectId', 'name location'),
      Payment.find({ customerId: params.id }).sort({ paymentDate: -1 }),
    ]);

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const totalPlotValue = plots.reduce((s, p) => s + (p.price || 0), 0);

    return NextResponse.json({ success: true, data: customer, plots, payments, totalPaid, totalPlotValue });
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
    const customer = await Customer.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
