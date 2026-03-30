import Booking from '../models/Booking.js';
import Program from '../models/Program.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

const createReferenceCode = () =>
  `SM-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${Date.now().toString().slice(-5)}`;

export const createBooking = asyncHandler(async (req, res) => {
  const {
    programId = '',
    sessionType,
    preferredDate,
    preferredTime,
    meetingMode = 'online',
    paymentMethod = 'simulated',
    notes = ''
  } = req.body;

  if (!sessionType || !preferredDate || !preferredTime) {
    res.status(400);
    throw new Error('Session type, preferred date, and preferred time are required.');
  }

  const program = programId ? await Program.findById(programId) : null;

  const booking = await Booking.create({
    user: req.user._id,
    program: program?._id,
    sessionType,
    preferredDate: new Date(preferredDate),
    preferredTime,
    meetingMode,
    paymentMethod,
    paymentStatus: paymentMethod === 'simulated' ? 'simulated-paid' : 'pending',
    bookingStatus: 'confirmed',
    notes,
    referenceCode: createReferenceCode(),
    price: program?.price || 0
  });

  await Promise.all([
    createNotification({
      userId: req.user._id,
      type: 'booking',
      title: 'Booking confirmed',
      message: `Your ${sessionType} booking has been confirmed.`,
      link: '/portal/bookings'
    }),
    logActivity({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'booking.created',
      entityType: 'booking',
      entityId: booking._id,
      description: `${req.user.name} created a booking.`
    })
  ]);

  const populated = await booking.populate([
    { path: 'program', select: 'title category price' },
    { path: 'user', select: 'name email role' }
  ]);

  res.status(201).json(populated);
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('program', 'title category price')
    .sort({ createdAt: -1 });

  res.json(bookings);
});

export const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('program', 'title category')
    .populate('user', 'name email role')
    .sort({ createdAt: -1 });

  res.json(bookings);
});

export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('user', 'name role');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found.');
  }

  const { bookingStatus, paymentStatus, notes } = req.body;

  if (bookingStatus) booking.bookingStatus = bookingStatus;
  if (paymentStatus) booking.paymentStatus = paymentStatus;
  if (notes !== undefined) booking.notes = notes;
  await booking.save();

  await Promise.all([
    createNotification({
      userId: booking.user?._id,
      type: 'booking',
      title: 'Booking updated',
      message: `Your booking status is now ${booking.bookingStatus}.`,
      link: '/portal/bookings'
    }),
    logActivity({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.booking-updated',
      entityType: 'booking',
      entityId: booking._id,
      description: `${req.user.name} updated a booking.`
    })
  ]);

  res.json(booking);
});
