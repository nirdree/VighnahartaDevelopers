import mongoose from 'mongoose';

const PlotSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    plotNumber: {
      type: String,
      required: [true, 'Plot number is required'],
      trim: true,
    },
    shapeType: {
      type: String,
      enum: ['rectangle', 'polygon'],
      required: true,
    },
    coordinates: [
      {
        x: Number,
        y: Number,
      },
    ],
    area: {
      type: String,
      trim: true,
    },
    length: {
      type: String,
      trim: true,
    },
    width: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['available', 'token', 'booked', 'halfpayment', 'sold'],
      default: 'available',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    canvasX: { type: Number, default: 0 },
    canvasY: { type: Number, default: 0 },
    canvasWidth: { type: Number, default: 100 },
    canvasHeight: { type: Number, default: 80 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Plot || mongoose.model('Plot', PlotSchema);
