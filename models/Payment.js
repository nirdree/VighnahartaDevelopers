import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    paymentType: {
      type: String,
      enum: ['token', 'partial', 'full', 'emi'],
      required: true,
    },
    paymentDate: { type: Date, default: Date.now },
    note: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
