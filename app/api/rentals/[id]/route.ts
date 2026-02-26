import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Rental from '@/models/Rental';
import { getTokenFromRequest } from '@/lib/auth';
import { nowUTC } from '@/lib/time';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rental = await Rental.findById(params.id)
      .populate('equipmentId')
      .populate('userId', 'name email contactNumber');

    if (!rental) return NextResponse.json({ error: 'Rental not found' }, { status: 404 });

    // Only admin or owner
    if (user.role !== 'Admin' && rental.userId._id.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ rental });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rental = await Rental.findById(params.id);
    if (!rental) return NextResponse.json({ error: 'Rental not found' }, { status: 404 });

    const { action } = await req.json();

    // Admin actions
    if (action === 'approve' || action === 'reject') {
      if (user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (rental.status !== 'Requested') {
        return NextResponse.json({ error: 'Only Requested rentals can be approved/rejected' }, { status: 400 });
      }

      if (action === 'approve') {
        // Double check overlap before approving
        const overlapping = await Rental.findOne({
          _id: { $ne: rental._id },
          equipmentId: rental.equipmentId,
          status: 'Approved',
          returnDate: null,
          startDate: { $lte: rental.endDate },
          endDate: { $gte: rental.startDate },
        });
        if (overlapping) {
          return NextResponse.json({ error: 'Cannot approve: overlapping approved rental exists' }, { status: 409 });
        }
        rental.status = 'Approved';
      } else {
        rental.status = 'Cancelled';
      }
    }

    // Return action (borrower or admin)
    else if (action === 'return') {
      const isOwner = rental.userId.toString() === user.userId;
      if (!isOwner && user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (rental.status !== 'Approved' && rental.status !== 'Late') {
        return NextResponse.json({ error: 'Only Approved or Late rentals can be returned' }, { status: 400 });
      }
      rental.returnDate = nowUTC();
      rental.status = 'Returned';
    }

    // Cancel action (borrower - only Requested)
    else if (action === 'cancel') {
      const isOwner = rental.userId.toString() === user.userId;
      if (!isOwner && user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (rental.status !== 'Requested') {
        return NextResponse.json({ error: 'Only Requested rentals can be cancelled' }, { status: 400 });
      }
      rental.status = 'Cancelled';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await rental.save();
    return NextResponse.json({ rental });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
