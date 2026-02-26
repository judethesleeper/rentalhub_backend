import mongoose, { Schema, Document, Model } from 'mongoose';

export type RentalStatus = 'Requested' | 'Approved' | 'Returned' | 'Late' | 'Cancelled';

export interface IRental extends Document {
  equipmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  returnDate: Date | null;
  status: RentalStatus;
  createdAt: Date;
}

const RentalSchema = new Schema<IRental>(
  {
    equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Returned', 'Late', 'Cancelled'],
      default: 'Requested',
    },
  },
  { timestamps: true }
);

RentalSchema.index({ equipmentId: 1, status: 1, startDate: 1, endDate: 1 });

const Rental: Model<IRental> =
  mongoose.models.Rental || mongoose.model<IRental>('Rental', RentalSchema);
export default Rental;
