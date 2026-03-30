import Program from '../models/Program.js';
import Enrolment from '../models/Enrolment.js';
import Comment from '../models/Comment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSlug } from '../utils/createSlug.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

export const getPrograms = asyncHandler(async (req, res) => {
  const { category, featured, audience, search } = req.query;
  const query = { published: true };

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

  const programs = await Program.find(query).sort({ featured: -1, createdAt: -1 });
  res.json(programs);
});

export const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program || !program.published) {
    res.status(404);
    throw new Error('Program not found.');
  }

  const comments = await Comment.find({ targetType: 'program', targetId: String(program._id) })
    .populate('author', 'name role')
    .sort({ createdAt: -1 });

  res.json({
    ...program.toObject(),
    comments
  });
});

export const getMyEnrolments = asyncHandler(async (req, res) => {
  const enrolments = await Enrolment.find({ user: req.user._id }).populate('program').sort({ createdAt: -1 });
  res.json(enrolments);
});

export const enrolInProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program || !program.published) {
    res.status(404);
    throw new Error('Program not found.');
  }

  const existing = await Enrolment.findOne({ user: req.user._id, program: program._id });

  if (existing) {
    res.status(400);
    throw new Error('You are already enrolled in this program.');
  }

  const enrolment = await Enrolment.create({
    user: req.user._id,
    program: program._id,
    progress: 0
  });

  await Promise.all([
    createNotification({
      userId: req.user._id,
      type: 'program',
      title: 'Program enrolment confirmed',
      message: `You enrolled in ${program.title}.`,
      link: '/portal/programs'
    }),
    logActivity({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'program.enrolled',
      entityType: 'program',
      entityId: program._id,
      description: `${req.user.name} enrolled in ${program.title}.`
    })
  ]);

  const populated = await enrolment.populate('program');
  res.status(201).json(populated);
});

export const updateEnrolmentProgress = asyncHandler(async (req, res) => {
  const enrolment = await Enrolment.findOne({ _id: req.params.id, user: req.user._id }).populate('program');

  if (!enrolment) {
    res.status(404);
    throw new Error('Enrolment not found.');
  }

  const nextProgress = Number(req.body.progress);
  const nextCompletedLessons =
    req.body.completedLessons === undefined ? enrolment.completedLessons : Number(req.body.completedLessons);

  if (Number.isNaN(nextProgress) || nextProgress < 0 || nextProgress > 100) {
    res.status(400);
    throw new Error('Progress must be between 0 and 100.');
  }

  enrolment.progress = nextProgress;
  enrolment.completedLessons = Number.isNaN(nextCompletedLessons) ? enrolment.completedLessons : nextCompletedLessons;
  enrolment.lastAccessedAt = new Date();
  enrolment.status = nextProgress === 100 ? 'completed' : 'active';
  await enrolment.save();

  if (nextProgress === 100) {
    await createNotification({
      userId: req.user._id,
      type: 'program',
      title: 'Program completed',
      message: `You completed ${enrolment.program?.title || 'your program'}.`,
      link: '/portal/dashboard'
    });
  }

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'program.progress-updated',
    entityType: 'enrolment',
    entityId: enrolment._id,
    description: `${req.user.name} updated program progress to ${nextProgress}%.`
  });

  res.json(enrolment);
});

export const createProgram = asyncHandler(async (req, res) => {
  const slug = req.body.slug ? createSlug(req.body.slug) : createSlug(req.body.title);

  const program = await Program.create({
    ...req.body,
    slug
  });

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.program-created',
    entityType: 'program',
    entityId: program._id,
    description: `${req.user.name} created program ${program.title}.`
  });

  res.status(201).json(program);
});

export const updateProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    res.status(404);
    throw new Error('Program not found.');
  }

  Object.assign(program, {
    ...req.body,
    slug: req.body.slug ? createSlug(req.body.slug) : program.slug
  });

  await program.save();

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.program-updated',
    entityType: 'program',
    entityId: program._id,
    description: `${req.user.name} updated program ${program.title}.`
  });

  res.json(program);
});

export const deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    res.status(404);
    throw new Error('Program not found.');
  }

  await program.deleteOne();

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.program-deleted',
    entityType: 'program',
    entityId: req.params.id,
    description: `${req.user.name} deleted a program.`
  });

  res.json({ message: 'Program deleted.' });
});
