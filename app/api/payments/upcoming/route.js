import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Plot from '@/models/Plot';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    // Get payments with next instalment dates (upcoming payments)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingPayments = await Payment.find({
      nextInstalmentDate: { $exists: true, $ne: null, $gte: today }
    })
      .populate('plotId', 'plotNumber price status')
      .populate('customerId', 'name mobile email address')
      .populate('recordedBy', 'name')
      .sort({ nextInstalmentDate: 1 })
      .limit(100);

    // Get overdue payments (next instalment date is in the past)
    const overduePayments = await Payment.find({
      nextInstalmentDate: { $exists: true, $ne: null, $lt: today }
    })
      .populate('plotId', 'plotNumber price status')
      .populate('customerId', 'name mobile email address')
      .populate('recordedBy', 'name')
      .sort({ nextInstalmentDate: 1 });

    return NextResponse.json({
      success: true,
      data: {
        upcoming: upcomingPayments,
        overdue: overduePayments,
        totalUpcoming: upcomingPayments.length,
        totalOverdue: overduePayments.length,
      }
    });
  } catch (error) {
    console.error('Upcoming payments error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
