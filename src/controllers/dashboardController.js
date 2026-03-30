import User from '../models/User.js';
import Program from '../models/Program.js';
import Resource from '../models/Resource.js';
import Enrolment from '../models/Enrolment.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildUserBadges } from '../services/badgeService.js';

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const [enrolments, bookings, featuredPrograms, featuredResources, notifications, unreadMessages, tickets, commentsCount] =
    await Promise.all([
      Enrolment.find({ user: req.user._id }).populate('program').sort({ createdAt: -1 }),
      Booking.find({ user: req.user._id }).populate('program', 'title category price').sort({ createdAt: -1 }),
      Program.find({ featured: true, published: true }).limit(3),
      Resource.find({ featured: true, published: true }).limit(4),
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(6),
      Message.countDocuments({ recipient: req.user._id, readAt: null }),
      Ticket.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
      Comment.countDocuments({ author: req.user._id })
    ]);

  const averageProgress =
    enrolments.length > 0
      ? Math.round(enrolments.reduce((sum, item) => sum + item.progress, 0) / enrolments.length)
      : 0;

  const badges = buildUserBadges({
    enrolments,
    bookings,
    commentsCount,
    ticketsCount: tickets.length
  });

  const leaderboardUsers = await User.find({ role: { $ne: 'admin' }, isActive: true })
    .select('name role badges loginCount')
    .limit(5);

  const leaderboard = await Promise.all(
    leaderboardUsers.map(async (user) => {
      const [userEnrolments, userBookings, userComments] = await Promise.all([
        Enrolment.find({ user: user._id }),
        Booking.find({ user: user._id }),
        Comment.countDocuments({ author: user._id })
      ]);

      const score =
        userEnrolments.reduce((sum, item) => sum + item.progress, 0) +
        userBookings.length * 20 +
        userComments * 10;

      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        score
      };
    })
  );

  leaderboard.sort((a, b) => b.score - a.score);

  res.json({
    role: req.user.role,
    stats: {
      enrolledPrograms: enrolments.length,
      upcomingBookings: bookings.filter((item) => item.bookingStatus === 'confirmed').length,
      averageProgress,
      availableResources: await Resource.countDocuments({ published: true }),
      unreadMessages,
      unreadNotifications: notifications.filter((item) => !item.readAt).length,
      openTickets: tickets.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length
    },
    enrolments,
    bookings,
    featuredPrograms,
    featuredResources,
    notifications,
    tickets,
    badges,
    leaderboard: leaderboard.slice(0, 5)
  });
});

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [users, programs, resources, bookings, tickets, notifications, activities] = await Promise.all([
    User.find().select('-password -resetPasswordTokenHash').sort({ createdAt: -1 }),
    Program.find().sort({ createdAt: -1 }),
    Resource.find().sort({ createdAt: -1 }),
    Booking.find().populate('user', 'name role').populate('program', 'title').sort({ createdAt: -1 }).limit(12),
    Ticket.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(12),
    Notification.find().sort({ createdAt: -1 }).limit(12),
    ActivityLog.find().sort({ createdAt: -1 }).limit(20)
  ]);

  const counts = {
    totalUsers: await User.countDocuments(),
    totalPrograms: await Program.countDocuments(),
    totalResources: await Resource.countDocuments(),
    totalEnrolments: await Enrolment.countDocuments(),
    totalBookings: await Booking.countDocuments(),
    totalTickets: await Ticket.countDocuments(),
    openTickets: await Ticket.countDocuments({ status: { $in: ['open', 'in-progress'] } })
  };

  res.json({
    counts,
    users,
    programs,
    resources,
    bookings,
    tickets,
    notifications,
    activities
  });
});
