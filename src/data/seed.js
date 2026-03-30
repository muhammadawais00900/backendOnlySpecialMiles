import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Program from '../models/Program.js';
import Resource from '../models/Resource.js';
import Enrolment from '../models/Enrolment.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import SiteContent from '../models/SiteContent.js';
import ActivityLog from '../models/ActivityLog.js';
import { users, programs, resources, siteContent } from './seedData.js';

dotenv.config();
await connectDB();

const importData = async () => {
  try {
    await Promise.all([
      User.deleteMany(),
      Program.deleteMany(),
      Resource.deleteMany(),
      Enrolment.deleteMany(),
      Booking.deleteMany(),
      Message.deleteMany(),
      Notification.deleteMany(),
      Ticket.deleteMany(),
      Comment.deleteMany(),
      SiteContent.deleteMany(),
      ActivityLog.deleteMany()
    ]);

    const createdUsers = await User.insertMany(users);
    const [adminUser, parentUser, educatorUser, studentUser, organisationUser] = createdUsers;

    const createdPrograms = await Program.insertMany(programs);
    const createdResources = await Resource.insertMany(resources);

    await SiteContent.create(siteContent);

    const [parentProgram, educatorProgram, studentProgram, workplaceProgram] = createdPrograms;

    await Enrolment.insertMany([
      {
        user: parentUser._id,
        program: parentProgram._id,
        progress: 35,
        completedLessons: 2
      },
      {
        user: educatorUser._id,
        program: educatorProgram._id,
        progress: 68,
        completedLessons: 5
      },
      {
        user: studentUser._id,
        program: studentProgram._id,
        progress: 50,
        completedLessons: 4
      }
    ]);

    await Booking.insertMany([
      {
        user: parentUser._id,
        program: parentProgram._id,
        sessionType: 'Parent Coaching',
        preferredDate: new Date(),
        preferredTime: '10:00',
        meetingMode: 'online',
        paymentMethod: 'simulated',
        paymentStatus: 'simulated-paid',
        bookingStatus: 'confirmed',
        notes: 'Looking for practical support at home.',
        referenceCode: 'SM-DEMO-1001',
        price: parentProgram.price
      },
      {
        user: organisationUser._id,
        program: workplaceProgram._id,
        sessionType: 'Workplace Workshop',
        preferredDate: new Date(),
        preferredTime: '14:00',
        meetingMode: 'hybrid',
        paymentMethod: 'invoice',
        paymentStatus: 'invoice-sent',
        bookingStatus: 'pending',
        notes: 'Needs training for managers and team leads.',
        referenceCode: 'SM-DEMO-1002',
        price: workplaceProgram.price
      }
    ]);

    await Message.insertMany([
      {
        sender: adminUser._id,
        recipient: parentUser._id,
        subject: 'Welcome to Special Miles',
        body: 'Thanks for joining. Let us know what support pathway would help your family most.'
      },
      {
        sender: parentUser._id,
        recipient: adminUser._id,
        subject: 'Booking question',
        body: 'Can I request a follow-up session after the first workshop?'
      }
    ]);

    await Notification.insertMany([
      {
        user: parentUser._id,
        type: 'system',
        title: 'Welcome to Special Miles',
        message: 'Your portal is ready to use.',
        link: '/portal/dashboard'
      },
      {
        user: parentUser._id,
        type: 'booking',
        title: 'Booking confirmed',
        message: 'Your parent coaching session is confirmed.',
        link: '/portal/bookings'
      },
      {
        user: educatorUser._id,
        type: 'program',
        title: 'Keep going',
        message: 'You are making strong progress in the educator program.',
        link: '/portal/programs'
      }
    ]);

    await Ticket.insertMany([
      {
        user: parentUser._id,
        name: parentUser.name,
        email: parentUser.email,
        role: parentUser.role,
        subject: 'Need help choosing the best parent pathway',
        message: 'I am deciding between the parenting program and consultancy.',
        category: 'program',
        priority: 'medium',
        status: 'open'
      },
      {
        name: 'Website Visitor',
        email: 'visitor@example.com',
        role: 'visitor',
        subject: 'Question about multilingual support',
        message: 'Can the public website be browsed in Arabic?',
        category: 'technical',
        priority: 'low',
        status: 'open'
      }
    ]);

    await Comment.insertMany([
      {
        author: educatorUser._id,
        targetType: 'resource',
        targetId: String(createdResources[1]._id),
        body: 'This toolkit is practical and easy to use with classroom teams.'
      },
      {
        author: studentUser._id,
        targetType: 'program',
        targetId: String(studentProgram._id),
        body: 'The study strategies feel realistic and not overwhelming.'
      }
    ]);

    console.log('Seed data imported successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed import failed:', error);
    process.exit(1);
  }
};

importData();
