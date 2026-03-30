import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['system', 'booking', 'program', 'message', 'ticket', 'auth', 'engagement'],
      default: 'system'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    channel: { type: String, enum: ['in-app', 'email-preview'], default: 'in-app' },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
