import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../services/activityService.js';

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  organisationName: user.organisationName,
  bio: user.bio,
  avatar: user.avatar,
  preferences: user.preferences,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  loginCount: user.loginCount
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  const {
    name,
    phone,
    organisationName,
    bio,
    avatar,
    preferences = {},
    password
  } = req.body;

  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;
  user.organisationName = organisationName ?? user.organisationName;
  user.bio = bio ?? user.bio;
  user.avatar = avatar ?? user.avatar;
  user.preferences = {
    ...user.preferences.toObject(),
    ...preferences
  };

  if (password) {
    user.password = password;
  }

  const updatedUser = await user.save();

  await logActivity({
    actor: updatedUser._id,
    actorName: updatedUser.name,
    actorRole: updatedUser.role,
    action: 'user.profile-updated',
    entityType: 'user',
    entityId: updatedUser._id,
    description: `${updatedUser.name} updated profile settings.`
  });

  res.json(publicUser(updatedUser));
});


export const listDirectory = asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin'
    ? { _id: { $ne: req.user._id }, isActive: true }
    : { role: 'admin', isActive: true };

  const users = await User.find(query).select('name email role organisationName');
  res.json(users.map(publicUser));
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -resetPasswordTokenHash').sort({ createdAt: -1 });
  res.json(users.map(publicUser));
});

export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found.');
  }

  const { role, isActive, organisationName, phone, bio, preferences } = req.body;

  if (role && targetUser.role !== 'admin') {
    targetUser.role = role;
  }

  if (typeof isActive === 'boolean' && targetUser.role !== 'admin') {
    targetUser.isActive = isActive;
  }

  targetUser.organisationName = organisationName ?? targetUser.organisationName;
  targetUser.phone = phone ?? targetUser.phone;
  targetUser.bio = bio ?? targetUser.bio;
  targetUser.preferences = {
    ...targetUser.preferences.toObject(),
    ...(preferences || {})
  };

  await targetUser.save();

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.user-updated',
    entityType: 'user',
    entityId: targetUser._id,
    description: `${req.user.name} updated ${targetUser.name}'s account.`
  });

  res.json(publicUser(targetUser));
});
