import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ['Parenting', 'Education', 'Student Success', 'Workplace', 'Consultancy'],
      required: true
    },
    summary: { type: String, default: '' },
    description: { type: String, required: true },
    audience: [{ type: String }],
    duration: { type: String, default: '' },
    deliveryMode: { type: String, default: 'Online' },
    price: { type: Number, default: 0 },
    tags: [{ type: String }],
    seoKeywords: [{ type: String }],
    outcomes: [{ type: String }],
    heroImage: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Program = mongoose.model('Program', programSchema);

export default Program;
