import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEquipment extends Document {
  name: string;
  category: string;
  condition: string;
  maintenanceStatus: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], default: 'Good' },
    maintenanceStatus: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

EquipmentSchema.index({ category: 1 });
EquipmentSchema.index({ maintenanceStatus: 1 });

const Equipment: Model<IEquipment> =
  mongoose.models.Equipment || mongoose.model<IEquipment>('Equipment', EquipmentSchema);
export default Equipment;
