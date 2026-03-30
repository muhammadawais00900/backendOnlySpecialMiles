import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({
  actor = null,
  actorName = 'System',
  actorRole = 'system',
  action,
  entityType = '',
  entityId = '',
  description,
  metadata = {}
}) => {
  try {
    await ActivityLog.create({
      actor,
      actorName,
      actorRole,
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      description,
      metadata
    });
  } catch (error) {
    console.error('Unable to save activity log:', error.message);
  }
};
