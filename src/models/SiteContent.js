import mongoose from 'mongoose';

const listItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, default: 0 },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const textItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    link: { type: String, default: '' }
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    category: { type: String, default: 'General' },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    keywords: [{ type: String }]
  },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    quote: { type: String, required: true }
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    x: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  { _id: false }
);

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    siteTitle: { type: String, default: 'Special Miles' },
    supportEmail: { type: String, default: 'hello@specialmiles.org' },
    supportPhone: { type: String, default: '' },
    locations: [{ type: String }],
    ribbonItems: { type: [listItemSchema], default: [] },
    awards: { type: [textItemSchema], default: [] },
    testimonials: { type: [testimonialSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    seoKeywords: [{ type: String }],
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    announcement: { type: String, default: '' },
    publicSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

export default SiteContent;
