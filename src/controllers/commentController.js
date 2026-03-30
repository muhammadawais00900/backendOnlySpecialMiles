import Comment from '../models/Comment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

export const getComments = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.query;

  if (!targetType || !targetId) {
    res.status(400);
    throw new Error('targetType and targetId are required.');
  }

  const comments = await Comment.find({ targetType, targetId })
    .populate('author', 'name role')
    .sort({ createdAt: -1 });

  res.json(comments);
});

export const createComment = asyncHandler(async (req, res) => {
  const { targetType, targetId, body } = req.body;

  if (!targetType || !targetId || !body) {
    res.status(400);
    throw new Error('targetType, targetId, and body are required.');
  }

  const comment = await Comment.create({
    author: req.user._id,
    targetType,
    targetId,
    body
  });

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'comment.created',
    entityType: targetType,
    entityId: targetId,
    description: `${req.user.name} left a comment on ${targetType} ${targetId}.`
  });

  const populated = await comment.populate('author', 'name role');
  res.status(201).json(populated);
});

export const toggleLike = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found.');
  }

  const alreadyLiked = comment.likes.some((item) => String(item) === String(req.user._id));

  if (alreadyLiked) {
    comment.likes = comment.likes.filter((item) => String(item) !== String(req.user._id));
  } else {
    comment.likes.push(req.user._id);
  }

  await comment.save();

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'comment.like-toggled',
    entityType: 'comment',
    entityId: comment._id,
    description: `${req.user.name} toggled a like on comment ${comment._id}.`
  });

  res.json(comment);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found.');
  }

  const canDelete = String(comment.author) === String(req.user._id) || req.user.role === 'admin';

  if (!canDelete) {
    res.status(403);
    throw new Error('You cannot delete this comment.');
  }

  await comment.deleteOne();
  res.json({ message: 'Comment deleted.' });
});
