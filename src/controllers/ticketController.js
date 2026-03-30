import Ticket from '../models/Ticket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

const adminNotificationRecipients = async (UserModel) => {
  const admins = await UserModel.find({ role: 'admin', isActive: true }).select('_id');
  return admins.map((admin) => admin._id);
};

export const createTicket = asyncHandler(async (req, res) => {
  const payload = req.body;
  const ticket = await Ticket.create({
    user: req.user?._id ?? null,
    name: payload.name || req.user?.name || 'Website visitor',
    email: payload.email || req.user?.email || '',
    role: req.user?.role || 'visitor',
    subject: payload.subject,
    message: payload.message,
    category: payload.category || 'general',
    priority: payload.priority || 'medium'
  });

  if (req.user?._id) {
    await createNotification({
      userId: req.user._id,
      type: 'ticket',
      title: 'Support request submitted',
      message: `Your ticket "${ticket.subject}" has been created.`,
      link: '/portal/support'
    });
  }

  await logActivity({
    actor: req.user?._id || null,
    actorName: req.user?.name || ticket.name,
    actorRole: req.user?.role || 'visitor',
    action: 'ticket.created',
    entityType: 'ticket',
    entityId: ticket._id,
    description: `${ticket.name} created support ticket ${ticket.subject}.`
  });

  res.status(201).json(ticket);
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(tickets);
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find()
    .populate('user', 'name email role')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  res.json(tickets);
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found.');
  }

  const { status, priority, responseMessage, assignedTo } = req.body;

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;

  if (responseMessage) {
    ticket.responses.push({
      author: req.user._id,
      authorName: req.user.name,
      message: responseMessage
    });
  }

  await ticket.save();

  if (ticket.user) {
    await createNotification({
      userId: ticket.user,
      type: 'ticket',
      title: 'Support request updated',
      message: `Ticket "${ticket.subject}" is now ${ticket.status}.`,
      link: '/portal/support'
    });
  }

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.ticket-updated',
    entityType: 'ticket',
    entityId: ticket._id,
    description: `${req.user.name} updated ticket ${ticket.subject}.`
  });

  res.json(ticket);
});
