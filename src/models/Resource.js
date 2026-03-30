import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ['Video', 'Toolkit', 'Guide', 'Worksheet', 'Article'],
      required: true
    },
    category: { type: String, required: true },
    description: { type: String, required: true },
    audience: [{ type: String }],
    duration: { type: String, default: '' },
    link: { type: String, default: '#' },
    tags: [{ type: String }],
    seoKeywords: [{ type: String }],
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
