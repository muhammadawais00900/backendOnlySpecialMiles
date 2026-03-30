import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised. Token is missing.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -resetPasswordTokenHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account is unavailable.' });
    }

    user.lastActiveAt = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorised. Token is invalid.' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied for this role.' });
  }

  next();
};
