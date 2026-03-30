import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    relatedType: {
      type: String,
      enum: ['', 'ticket', 'booking', 'general'],
      default: 'general'
    },
    relatedId: { type: String, default: '' },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
