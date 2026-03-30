import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    sessionType: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    meetingMode: { type: String, enum: ['online', 'in-person', 'hybrid'], default: 'online' },
    paymentMethod: { type: String, enum: ['simulated', 'manual', 'invoice'], default: 'simulated' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'simulated-paid', 'invoice-sent', 'waived'],
      default: 'simulated-paid'
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    },
    notes: { type: String, default: '' },
    referenceCode: { type: String, required: true },
    price: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
