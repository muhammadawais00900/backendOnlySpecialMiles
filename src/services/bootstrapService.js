import User from '../models/User.js';
import Program from '../models/Program.js';
import Resource from '../models/Resource.js';
import SiteContent from '../models/SiteContent.js';
import { users, programs, resources, siteContent } from '../data/seedData.js';

const shouldBootstrap = () => process.env.ENABLE_DEMO_BOOTSTRAP !== 'false';
const shouldResetDemoPasswords = () => process.env.NODE_ENV !== 'production' || process.env.RESET_DEMO_PASSWORDS === 'true';

export const ensureBootstrapData = async () => {
  if (!shouldBootstrap()) return;

  for (const seedUser of users) {
    let existing = await User.findOne({ email: seedUser.email.toLowerCase() });
    if (!existing) {
      await User.create(seedUser);
      continue;
    }

    existing.name = seedUser.name;
    existing.role = seedUser.role;
    existing.phone = seedUser.phone || existing.phone;
    existing.organisationName = seedUser.organisationName || existing.organisationName;
    existing.bio = seedUser.bio || existing.bio;
    existing.isActive = true;

    if (shouldResetDemoPasswords()) {
      existing.password = seedUser.password;
    }

    await existing.save();
  }

  for (const program of programs) {
    await Program.findOneAndUpdate({ slug: program.slug }, { $set: program }, { upsert: true, new: true, runValidators: true });
  }

  for (const resource of resources) {
    await Resource.findOneAndUpdate({ slug: resource.slug }, { $set: resource }, { upsert: true, new: true, runValidators: true });
  }

  await SiteContent.findOneAndUpdate({ key: siteContent.key }, { $set: siteContent }, { upsert: true, new: true, runValidators: true });

  console.log('Bootstrap check complete. Demo admin is ready: admin@specialmiles.org / Password123!');
};
