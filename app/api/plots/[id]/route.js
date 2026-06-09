import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plot from '@/models/Plot';
import Payment from '@/models/Payment';
import Customer from '@/models/Customer';
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

// PATCH — book plot: create customers, record payment, update plot status
export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const body = await request.json();
    const { customers, email, address, notes, amount, paymentType, paymentDate, note, paymentMode, finalPlotPrice, nextInstalmentDate, agentId, agentCommission } = body;

    if (!amount || Number(amount) <= 0 || !paymentType) {
      return NextResponse.json({ success: false, error: 'Amount and payment type are required' }, { status: 400 });
    }

    // Upsert primary customer (first in list)
    let primaryCustomerId = null;
    if (customers && customers.length > 0) {
      const primary = customers[0];
      if (primary.name && primary.mobile) {
        let cust = await Customer.findOne({ mobile: primary.mobile.trim() });
        if (!cust) cust = await Customer.create({ name: primary.name, mobile: primary.mobile, email: email || '', address: address || '', notes: notes || '' });
        primaryCustomerId = cust._id;
      }
    }

    await Payment.create({
      plotId: params.id,
      customerId: primaryCustomerId,
      amount: Number(amount),
      paymentType,
      paymentDate: paymentDate || new Date(),
      note,
      paymentMode: paymentMode || 'cash',
      finalPlotPrice: finalPlotPrice ? Number(finalPlotPrice) : undefined,
      nextInstalmentDate: nextInstalmentDate || undefined,
      agentCommission: agentCommission ? Number(agentCommission) : undefined,
      recordedBy: user.id,
    });

    const allPayments = await Payment.find({ plotId: params.id });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const plot = await Plot.findById(params.id);
    const effectivePrice = finalPlotPrice ? Number(finalPlotPrice) : (plot.price || 0);
    const newStatus = deriveStatus(totalPaid, effectivePrice, allPayments);

    const updateData = { status: newStatus };
    if (primaryCustomerId) updateData.customerId = primaryCustomerId;
    if (agentId) updateData.assignedAgent = agentId;

    const updated = await Plot.findByIdAndUpdate(params.id, updateData, { new: true })
      .populate('customerId', 'name mobile email address notes')
      .populate('assignedAgent', 'name email');

    return NextResponse.json({ success: true, data: updated, totalPaid });
  } catch (error) {
    console.error('PATCH error:', error);
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
