import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  organisationName: user.organisationName,
  bio: user.bio,
  avatar: user.avatar,
  preferences: user.preferences,
  token: generateToken(user._id)
});

const normaliseRole = (role) => {
  const allowedRoles = ['parent', 'educator', 'student', 'organisation'];
  return allowedRoles.includes(role) ? role : 'parent';
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone = '', organisationName = '' } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    res.status(400);
    throw new Error('Email is already registered.');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    organisationName,
    role: normaliseRole(role)
  });

  await Promise.all([
    createNotification({
      userId: user._id,
      type: 'auth',
      title: 'Welcome to Special Miles',
      message: 'Your account has been created and your portal is ready to use.',
      link: '/portal/dashboard'
    }),
    logActivity({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'user.registered',
      entityType: 'user',
      entityId: user._id,
      description: `${user.name} created an account.`
    })
  ]);

  res.status(201).json(serializeUser(user));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase?.() ?? '' });

  if (!user || !user.isActive || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  user.lastLoginAt = new Date();
  user.lastActiveAt = new Date();
  user.loginCount += 1;
  await user.save();

  await Promise.all([
    createNotification({
      userId: user._id,
      type: 'auth',
      title: 'New sign-in detected',
      message: 'You signed into your Special Miles account successfully.',
      link: '/portal/dashboard'
    }),
    logActivity({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'user.logged-in',
      entityType: 'user',
      entityId: user._id,
      description: `${user.name} signed in.`
    })
  ]);

  res.json(serializeUser(user));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required.');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.json({
      message: 'If an account exists for that email, password reset instructions have been prepared.'
    });
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?email=${encodeURIComponent(
    user.email
  )}&token=${rawToken}`;

  await Promise.all([
    createNotification({
      userId: user._id,
      type: 'auth',
      title: 'Password reset requested',
      message: `Use the password reset link prepared for ${user.email}.`,
      link: resetLink,
      channel: 'email-preview'
    }),
    logActivity({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'user.password-reset-requested',
      entityType: 'user',
      entityId: user._id,
      description: `${user.name} requested a password reset.`
    })
  ]);

  res.json({
    message: 'If an account exists for that email, password reset instructions have been prepared.',
    resetLink: process.env.NODE_ENV === 'production' ? undefined : resetLink
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    res.status(400);
    throw new Error('Email, reset token, and new password are required.');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    res.status(400);
    throw new Error('The reset link is invalid or has expired.');
  }

  user.password = password;
  user.resetPasswordTokenHash = '';
  user.resetPasswordExpiresAt = null;
  await user.save();

  await Promise.all([
    createNotification({
      userId: user._id,
      type: 'auth',
      title: 'Password updated',
      message: 'Your password has been reset successfully.',
      link: '/login'
    }),
    logActivity({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'user.password-reset-completed',
      entityType: 'user',
      entityId: user._id,
      description: `${user.name} completed a password reset.`
    })
  ]);

  res.json({ message: 'Password updated successfully.' });
});
