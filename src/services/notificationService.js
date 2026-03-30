import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  link = '',
  channel = 'in-app'
}) => {
  if (!userId) return null;

  try {
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
      channel
    });
  } catch (error) {
    console.error('Unable to create notification:', error.message);
    return null;
  }
};
