export const buildUserBadges = ({ enrolments = [], bookings = [], commentsCount = 0, ticketsCount = 0 }) => {
  const badges = [];

  if (enrolments.length > 0) {
    badges.push({ key: 'first-enrolment', label: 'First Enrolment' });
  }

  if (enrolments.some((item) => item.progress >= 50)) {
    badges.push({ key: 'engaged-learner', label: 'Engaged Learner' });
  }

  if (enrolments.some((item) => item.status === 'completed' || item.progress === 100)) {
    badges.push({ key: 'completion-champion', label: 'Completion Champion' });
  }

  if (bookings.length > 0) {
    badges.push({ key: 'active-planner', label: 'Active Planner' });
  }

  if (commentsCount > 0) {
    badges.push({ key: 'community-voice', label: 'Community Voice' });
  }

  if (ticketsCount > 0) {
    badges.push({ key: 'support-seeker', label: 'Support Seeker' });
  }

  return badges;
};
