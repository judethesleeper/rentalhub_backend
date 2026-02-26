import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Equipment from '@/models/Equipment';
import Rental from '@/models/Rental';
import { getTokenFromRequest } from '@/lib/auth';
import { nowUTC } from '@/lib/time';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const equipment = await Equipment.findById(params.id);
    if (!equipment) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });

    const now = nowUTC();
    const activeRental = await Rental.findOne({
      equipmentId: params.id,
      status: 'Approved',
      startDate: { $lte: now },
      endDate: { $gte: now },
      returnDate: null,
    });

    return NextResponse.json({
      equipment: {
        ...equipment.toObject(),
        available: !equipment.maintenanceStatus && !activeRental,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const equipment = await Equipment.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!equipment) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });

    return NextResponse.json({ equipment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user || user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const equipment = await Equipment.findByIdAndDelete(params.id);
    if (!equipment) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });

    return NextResponse.json({ message: 'Equipment deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
