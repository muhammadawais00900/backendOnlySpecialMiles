import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

export const getMessages = asyncHandler(async (req, res) => {
  const { withUser = '' } = req.query;

  const query = {
    $or: [{ sender: req.user._id }, { recipient: req.user._id }]
  };

  if (withUser) {
    query.$and = [
      {
        $or: [
          { sender: req.user._id, recipient: withUser },
          { sender: withUser, recipient: req.user._id }
        ]
      }
    ];
  }

  const messages = await Message.find(query)
    .populate('sender', 'name role')
    .populate('recipient', 'name role')
    .sort({ createdAt: 1 });

  res.json(messages);
});

export const getConversationSummaries = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { recipient: req.user._id }]
  })
    .populate('sender', 'name role')
    .populate('recipient', 'name role')
    .sort({ createdAt: -1 });

  const map = new Map();

  messages.forEach((message) => {
    const other =
      String(message.sender._id) === String(req.user._id) ? message.recipient : message.sender;

    if (!map.has(String(other._id))) {
      map.set(String(other._id), {
        user: other,
        latestMessage: message
      });
    }
  });

  res.json(Array.from(map.values()));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, subject = '', body } = req.body;

  if (!recipientId || !body) {
    res.status(400);
    throw new Error('Recipient and message body are required.');
  }

  const recipient = await User.findById(recipientId);

  if (!recipient || !recipient.isActive) {
    res.status(404);
    throw new Error('Recipient not found.');
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipientId,
    subject,
    body
  });

  await Promise.all([
    createNotification({
      userId: recipient._id,
      type: 'message',
      title: 'New message received',
      message: `${req.user.name} sent you a new message.`,
      link: '/portal/messages'
    }),
    logActivity({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'message.sent',
      entityType: 'message',
      entityId: message._id,
      description: `${req.user.name} sent a message.`
    })
  ]);

  const populated = await message.populate([
    { path: 'sender', select: 'name role' },
    { path: 'recipient', select: 'name role' }
  ]);

  res.status(201).json(populated);
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message || String(message.recipient) !== String(req.user._id)) {
    res.status(404);
    throw new Error('Message not found.');
  }

  message.readAt = message.readAt || new Date();
  await message.save();

  res.json({ message: 'Message marked as read.' });
});
