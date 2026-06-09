import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plot from '@/models/Plot';
import Payment from '@/models/Payment';
import { getUserFromRequest } from '@/lib/auth';

function deriveStatus(totalPaid, plotPrice, payments) {
  if (!totalPaid || totalPaid === 0) return 'available';
  if (totalPaid >= plotPrice) return 'sold';
  if (totalPaid >= plotPrice * 0.5) return 'halfpayment';
  if (payments.some(p => p.paymentType === 'token')) return 'token';
  return 'booked';
}

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(request.url);

    // Return payments if ?payments=true
    if (searchParams.get('payments') === 'true') {
      const payments = await Payment.find({ plotId: params.id })
        .populate('recordedBy', 'name')
        .sort({ paymentDate: -1 });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return NextResponse.json({ success: true, data: payments, totalPaid });
    }

    const plot = await Plot.findById(params.id)
      .populate('customerId', 'name mobile email address notes')
      .populate('assignedAgent', 'name email');

    if (!plot) return NextResponse.json({ success: false, error: 'Plot not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: plot });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — add a payment record and auto-update plot status
export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const { customerId, amount, paymentType, paymentDate, note } = await request.json();

    if (!customerId || !amount || !paymentType) {
      return NextResponse.json({ success: false, error: 'customerId, amount and paymentType are required' }, { status: 400 });
    }

    await Payment.create({ plotId: params.id, customerId, amount, paymentType, paymentDate, note, recordedBy: user.id });

    const allPayments = await Payment.find({ plotId: params.id });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const plot = await Plot.findById(params.id);
    const newStatus = deriveStatus(totalPaid, plot.price, allPayments);

    const updated = await Plot.findByIdAndUpdate(
      params.id,
      { status: newStatus, customerId },
      { new: true }
    ).populate('customerId', 'name mobile email address notes').populate('assignedAgent', 'name email');

    return NextResponse.json({ success: true, data: updated, totalPaid });
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
