import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Equipment from '@/models/Equipment';
import Rental from '@/models/Rental';
import { getTokenFromRequest } from '@/lib/auth';
import { nowUTC } from '@/lib/time';

// Compute availability for each equipment dynamically
async function computeAvailability(equipmentIds: string[], now: Date) {
  const activeRentals = await Rental.find({
    equipmentId: { $in: equipmentIds },
    status: 'Approved',
    startDate: { $lte: now },
    endDate: { $gte: now },
    returnDate: null,
  }).select('equipmentId');

  const rentedSet = new Set(activeRentals.map((r) => r.equipmentId.toString()));
  return rentedSet;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const equipments = await Equipment.find({}).sort({ createdAt: -1 });
    const now = nowUTC();
    const ids = equipments.map((e) => e._id.toString());
    const rentedSet = await computeAvailability(ids, now);

    const data = equipments.map((e) => ({
      ...e.toObject(),
      available: !e.maintenanceStatus && !rentedSet.has(e._id.toString()),
    }));

    return NextResponse.json({ equipment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, category, condition, maintenanceStatus, description } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const equipment = await Equipment.create({ name, category, condition, maintenanceStatus: !!maintenanceStatus, description });
    return NextResponse.json({ equipment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
