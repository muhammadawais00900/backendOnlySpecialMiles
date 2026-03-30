import SiteContent from '../models/SiteContent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../services/activityService.js';

const defaultSiteContent = {
  key: 'default'
};

export const getPublicSiteContent = asyncHandler(async (req, res) => {
  const content = await SiteContent.findOne(defaultSiteContent);

  if (!content) {
    return res.json(defaultSiteContent);
  }

  res.json(content);
});

export const updateSiteContent = asyncHandler(async (req, res) => {
  const content = await SiteContent.findOneAndUpdate(defaultSiteContent, req.body, {
    new: true,
    upsert: true
  });

  await logActivity({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'admin.site-updated',
    entityType: 'site',
    entityId: content._id,
    description: `${req.user.name} updated public site content.`
  });

  res.json(content);
});
