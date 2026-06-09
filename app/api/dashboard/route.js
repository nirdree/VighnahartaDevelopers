import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Plot from '@/models/Plot';
import User from '@/models/User';
import Customer from '@/models/Customer';
import Payment from '@/models/Payment';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const [
      totalProjects, totalAgents, totalPlots,
      available, token, booked, halfpayment, sold,
      totalCustomers, revenueAgg, recentPayments,
    ] = await Promise.all([
      Project.countDocuments(),
      User.countDocuments({ role: 'agent', isActive: true }),
      Plot.countDocuments(),
      Plot.countDocuments({ status: 'available' }),
      Plot.countDocuments({ status: 'token' }),
      Plot.countDocuments({ status: 'booked' }),
      Plot.countDocuments({ status: 'halfpayment' }),
      Plot.countDocuments({ status: 'sold' }),
      Customer.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('customerId', 'name mobile')
        .populate('plotId', 'plotNumber'),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalProjects, totalAgents, totalPlots, totalCustomers, totalRevenue,
        plotStats: { available, token, booked, halfpayment, sold },
        recentPayments,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
