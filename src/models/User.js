import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const preferencesSchema = new mongoose.Schema(
  {
    language: { type: String, default: 'en' },
    textScale: { type: String, enum: ['normal', 'large', 'xlarge'], default: 'normal' },
    contrastMode: { type: String, enum: ['default', 'high'], default: 'default' },
    reducedMotion: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true }
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['admin', 'parent', 'educator', 'student', 'organisation'],
      default: 'parent'
    },
    phone: { type: String, default: '' },
    organisationName: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    preferences: { type: preferencesSchema, default: () => ({}) },
    badges: { type: [badgeSchema], default: [] },
    resetPasswordTokenHash: { type: String, default: '' },
    resetPasswordExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
