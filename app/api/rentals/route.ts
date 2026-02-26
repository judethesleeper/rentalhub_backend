import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Rental from '@/models/Rental';
import Equipment from '@/models/Equipment';
import { getTokenFromRequest } from '@/lib/auth';
import { nowUTC, isOverlapping } from '@/lib/time';

// Auto-update late rentals
async function syncLateRentals() {
  const now = nowUTC();
  await Rental.updateMany(
    { status: 'Approved', endDate: { $lt: now }, returnDate: null },
    { $set: { status: 'Late' } }
  );
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await syncLateRentals();

    const filter = user.role === 'Admin' ? {} : { userId: user.userId };
    const rentals = await Rental.find(filter)
      .populate('equipmentId', 'name category condition')
      .populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({ rentals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { equipmentId, startDate: startStr, endDate: endStr } = await req.json();

    if (!equipmentId || !startStr || !endStr) {
      return NextResponse.json({ error: 'equipmentId, startDate, endDate are required' }, { status: 400 });
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'startDate must be before endDate' }, { status: 400 });
    }

    if (startDate < nowUTC()) {
      return NextResponse.json({ error: 'startDate cannot be in the past' }, { status: 400 });
    }

    // Check equipment exists and not under maintenance
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    if (equipment.maintenanceStatus) {
      return NextResponse.json({ error: 'Equipment is under maintenance and cannot be rented' }, { status: 409 });
    }

    // Overlap check: find existing Approved rentals that overlap and haven't been returned
    const overlapping = await Rental.findOne({
      equipmentId,
      status: 'Approved',
      returnDate: null,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'Equipment is already booked for the requested dates' },
        { status: 409 }
      );
    }

    const rental = await Rental.create({
      equipmentId,
      userId: user.userId,
      startDate,
      endDate,
      returnDate: null,
      status: 'Requested',
    });

    return NextResponse.json({ rental }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
