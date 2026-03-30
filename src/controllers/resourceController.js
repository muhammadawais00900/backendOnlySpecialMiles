import Resource from '../models/Resource.js';
import Comment from '../models/Comment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSlug } from '../utils/createSlug.js';
import { logActivity } from '../services/activityService.js';

export const getResources = asyncHandler(async (req, res) => {
  const { type, category, featured, audience, search } = req.query;
  const query = { published: true };

  if (type && type !== 'All') {
    query.type = type;
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (featured === 'true') {
    query.featured = true;
  }

  if (audience && audience !== 'all') {
    query.audience = audience;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { seoKeywords: { $elemMatch: { $regex: search, $options: 'i' } } }
    ];
  }

  const resources = await Resource.find(query).sort({ featured: -1, createdAt: -1 });
  res.json(resources);
});

export const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource || !resource.published) {
    res.status(404);
    throw new Error('Resource not found.');
  }

  const comments = await Comment.find({ targetType: 'resource', targetId: String(resource._id) })
    .populate('author', 'name role')
    .sort({ createdAt: -1 });

  res.json({
    ...resource.toObject(),
    comments
  });
});

export const createResource = asyncHandler(async (req, res) => {
  const slug = req.body.slug ? createSlug(req.body.slug) : createSlug(req.body.title);

  const resource = await Resource.create({
    ...req.body,
    slug
  });

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.resource-created',
    entityType: 'resource',
    entityId: resource._id,
    description: `${req.user.name} created resource ${resource.title}.`
  });

  res.status(201).json(resource);
});

export const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found.');
  }

  Object.assign(resource, {
    ...req.body,
    slug: req.body.slug ? createSlug(req.body.slug) : resource.slug
  });

  await resource.save();

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.resource-updated',
    entityType: 'resource',
    entityId: resource._id,
    description: `${req.user.name} updated resource ${resource.title}.`
  });

  res.json(resource);
});

export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found.');
  }

  await resource.deleteOne();

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.resource-deleted',
    entityType: 'resource',
    entityId: req.params.id,
    description: `${req.user.name} deleted a resource.`
  });

  res.json({ message: 'Resource deleted.' });
});
