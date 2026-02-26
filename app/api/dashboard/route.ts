import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Equipment from '@/models/Equipment';
import Rental from '@/models/Rental';
import User from '@/models/User';
import { getTokenFromRequest } from '@/lib/auth';
import { nowUTC } from '@/lib/time';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const now = nowUTC();

    // Auto-sync late rentals
    await Rental.updateMany(
      { status: 'Approved', endDate: { $lt: now }, returnDate: null },
      { $set: { status: 'Late' } }
    );

    const [totalEquipment, totalUsers, allRentals, equipment] = await Promise.all([
      Equipment.countDocuments(),
      User.countDocuments({ role: 'Borrower' }),
      Rental.find({}).populate('equipmentId', 'name'),
      Equipment.find({}),
    ]);

    // Active rentals (Approved and currently within date range)
    const activeRentals = await Rental.countDocuments({
      status: 'Approved',
      startDate: { $lte: now },
      endDate: { $gte: now },
      returnDate: null,
    });

    const completedRentals = allRentals.filter((r) => r.status === 'Returned').length;
    const overdueRentals = allRentals.filter((r) => r.status === 'Late').length;
    const pendingRequests = allRentals.filter((r) => r.status === 'Requested').length;

    // Rentals today
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const rentalsToday = allRentals.filter(
      (r) => r.createdAt >= startOfDay && r.createdAt <= endOfDay
    ).length;

    // Upcoming rentals
    const upcomingRentals = allRentals.filter(
      (r) => r.status === 'Approved' && r.startDate > now
    ).length;

    // Equipment availability
    const rentedEquipmentIds = new Set(
      (await Rental.find({
        status: 'Approved',
        startDate: { $lte: now },
        endDate: { $gte: now },
        returnDate: null,
      }).select('equipmentId')).map((r) => r.equipmentId.toString())
    );

    const availableCount = equipment.filter(
      (e) => !e.maintenanceStatus && !rentedEquipmentIds.has(e._id.toString())
    ).length;
    const maintenanceCount = equipment.filter((e) => e.maintenanceStatus).length;
    const rentedCount = rentedEquipmentIds.size;

    // Top 3 most rented equipment
    const rentalCounts: Record<string, { name: string; count: number }> = {};
    for (const rental of allRentals) {
      if (rental.equipmentId) {
        const id = rental.equipmentId._id?.toString() || rental.equipmentId.toString();
        const name = (rental.equipmentId as any).name || 'Unknown';
        if (!rentalCounts[id]) rentalCounts[id] = { name, count: 0 };
        rentalCounts[id].count++;
      }
    }
    const topEquipment = Object.entries(rentalCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([id, data]) => ({ id, ...data }));

    return NextResponse.json({
      totalEquipment,
      totalUsers,
      activeRentals,
      completedRentals,
      overdueRentals,
      pendingRequests,
      rentalsToday,
      upcomingRentals,
      availability: { available: availableCount, rented: rentedCount, maintenance: maintenanceCount },
      topEquipment,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
