import mongoose from 'mongoose';

const enrolmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active'
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completedLessons: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

enrolmentSchema.index({ user: 1, program: 1 }, { unique: true });

const Enrolment = mongoose.model('Enrolment', enrolmentSchema);

export default Enrolment;
