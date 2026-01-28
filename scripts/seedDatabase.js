require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');
const CareReceiver = require('../models/CareReceiver.model');
const Feedback = require('../models/Feedback.model');
const Payment = require('../models/Payment.model');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elderease', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  console.log('\n🗑️  Clearing existing data...');
  await User.deleteMany({});
  await Caregiver.deleteMany({});
  await CareReceiver.deleteMany({});
  await Feedback.deleteMany({});
  await Payment.deleteMany({});
  console.log('✓ Database cleared');
};

// Create admin users
const createAdmins = async () => {
  console.log('\n👤 Creating admin users...');
  
  const admins = [
    {
      name: 'Admin User',
      email: 'admin@elderease.lk',
      password: 'admin123',
      role: 'admin',
      phone: '+94771234567',
      isActive: true,
      isVerified: true,
    },
    {
      name: 'Super Admin',
      email: 'superadmin@elderease.lk',
      password: 'admin123',
      role: 'admin',
      phone: '+94772345678',
      isActive: true,
      isVerified: true,
    },
  ];

  for (const admin of admins) {
    await User.create(admin);
  }

  console.log(`✓ Created ${admins.length} admin users`);
};

// Create caregivers with profiles
const createCaregivers = async () => {
  console.log('\n👨‍⚕️ Creating caregivers...');
  
  const caregivers = [
    {
      user: {
        name: 'Nimal Perera',
        email: 'nimal.perera@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234501',
        address: {
          street: '123 Galle Road',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00300',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        qualification: 'Certified Nursing Assistant (CNA), First Aid Certified, CPR Certified',
        experience: 8,
        specialization: ['dementia', 'medical', 'other'],
        bio: 'Experienced caregiver with 8 years of specialized elderly care. Passionate about providing compassionate care.',
        languages: ['Sinhala', 'English', 'Tamil'],
        hourlyRate: 1500,
        status: 'available',
        rating: 4.8,
        totalReviews: 156,
        idProof: 'https://example.com/documents/id-nimal.pdf',
        policeVerification: 'https://example.com/documents/police-nimal.pdf',
        medicalCertificate: 'https://example.com/documents/medical-nimal.pdf',
      },
    },
    {
      user: {
        name: 'Chamari Silva',
        email: 'chamari.silva@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234502',
        address: {
          street: '45 Peradeniya Road',
          city: 'Kandy',
          state: 'Central Province',
          zipCode: '20000',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        qualification: 'Diploma in Nursing, Elderly Care Certificate',
        experience: 5,
        specialization: ['medical', 'mobility', 'other'],
        bio: 'Dedicated caregiver specializing in medication management and mobility assistance for elderly patients.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 1200,
        status: 'available',
        rating: 4.6,
        totalReviews: 89,
        idProof: 'https://example.com/documents/id-chamari.pdf',
        policeVerification: 'https://example.com/documents/police-chamari.pdf',
        medicalCertificate: 'https://example.com/documents/medical-chamari.pdf',
      },
    },
    {
      user: {
        name: 'Ruwan Fernando',
        email: 'ruwan.fernando@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234503',
        address: {
          street: '78 Lake Road',
          city: 'Kandy',
          state: 'Central Province',
          zipCode: '20000',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        qualification: 'Bachelor of Nursing, Palliative Care Specialist, Wound Care Certified',
        experience: 10,
        specialization: ['hospice', 'medical', 'other'],
        bio: 'Highly experienced nurse with focus on palliative and post-surgical care for elderly patients.',
        languages: ['Sinhala', 'English', 'Tamil'],
        hourlyRate: 2000,
        status: 'on-duty',
        rating: 4.9,
        totalReviews: 234,
        idProof: 'https://example.com/documents/id-ruwan.pdf',
        policeVerification: 'https://example.com/documents/police-ruwan.pdf',
        medicalCertificate: 'https://example.com/documents/medical-ruwan.pdf',
      },
    },
    {
      user: {
        name: 'Sanduni Jayawardena',
        email: 'sanduni.j@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234504',
        address: {
          street: '12 Church Street',
          city: 'Galle',
          state: 'Southern Province',
          zipCode: '80000',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        qualification: 'Certified Home Health Aide, Nutrition Certificate',
        experience: 6,
        specialization: ['companionship', 'other'],
        bio: 'Caring and patient caregiver providing companionship and daily living assistance.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 1000,
        status: 'available',
        rating: 4.7,
        totalReviews: 112,
        idProof: 'https://example.com/documents/id-sanduni.pdf',
        policeVerification: 'https://example.com/documents/police-sanduni.pdf',
        medicalCertificate: 'https://example.com/documents/medical-sanduni.pdf',
      },
    },
    {
      user: {
        name: 'Kasun Wickramasinghe',
        email: 'kasun.w@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234505',
        address: {
          street: '89 Main Street',
          city: 'Negombo',
          state: 'Western Province',
          zipCode: '11500',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: true,
      },
      profile: {
        qualification: 'Healthcare Assistant Certificate',
        experience: 3,
        specialization: ['companionship', 'medical', 'other'],
        bio: 'Reliable caregiver with focus on personal care and transportation assistance.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 900,
        status: 'unavailable',
        rating: 4.3,
        totalReviews: 45,
        idProof: 'https://example.com/documents/id-kasun.pdf',
        policeVerification: 'https://example.com/documents/police-kasun.pdf',
        medicalCertificate: 'https://example.com/documents/medical-kasun.pdf',
      },
    },
  ];

  const createdCaregivers = [];
  
  for (const caregiver of caregivers) {
    const user = await User.create(caregiver.user);
    const profile = await Caregiver.create({ ...caregiver.profile, userId: user._id });
    createdCaregivers.push({ user, profile });
  }

  console.log(`✓ Created ${caregivers.length} caregivers with profiles`);
  return createdCaregivers;
};

// Create pending caregiver requests
const createPendingRequests = async () => {
  console.log('\n⏳ Creating pending caregiver requests...');
  
  const pendingCaregivers = [
    {
      user: {
        name: 'Dilshan Rajapaksa',
        email: 'dilshan.r@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234510',
        address: {
          street: '34 Temple Road',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00700',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Nursing Certificate, First Aid Certified',
        experience: 4,
        specialization: ['medical', 'other'],
        bio: 'Motivated caregiver seeking to provide quality care to elderly patients.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 1100,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-dilshan.pdf',
        policeVerification: 'https://example.com/documents/police-dilshan.pdf',
        medicalCertificate: 'https://example.com/documents/medical-dilshan.pdf',
      },
    },
    {
      user: {
        name: 'Nimali Dissanayake',
        email: 'nimali.d@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234511',
        address: {
          street: '67 Queen Street',
          city: 'Kandy',
          state: 'Central Province',
          zipCode: '20000',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Home Health Aide Certificate',
        experience: 2,
        specialization: ['companionship', 'other'],
        bio: 'Compassionate individual looking to start a career in elderly care.',
        languages: ['Sinhala', 'English', 'Tamil'],
        hourlyRate: 850,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-nimali.pdf',
        policeVerification: 'https://example.com/documents/police-nimali.pdf',
        medicalCertificate: 'https://example.com/documents/medical-nimali.pdf',
      },
    },
    {
      user: {
        name: 'Pradeep Silva',
        email: 'pradeep.s@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234512',
        address: {
          street: '91 Beach Road',
          city: 'Galle',
          state: 'Southern Province',
          zipCode: '80000',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Licensed Practical Nurse, Dementia Care Specialist',
        experience: 7,
        specialization: ['dementia', 'mobility', 'medical'],
        bio: 'Experienced nurse specializing in dementia care and physical rehabilitation.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 1600,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-pradeep.pdf',
        policeVerification: 'https://example.com/documents/police-pradeep.pdf',
        medicalCertificate: 'https://example.com/documents/medical-pradeep.pdf',
      },
    },
    {
      user: {
        name: 'Chamari Fernando',
        email: 'chamari.f@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234513',
        address: {
          street: '45 Hill Street',
          city: 'Matara',
          state: 'Southern Province',
          zipCode: '81000',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Certified Nursing Assistant, CPR Certified',
        experience: 3,
        specialization: ['medical', 'mobility', 'companionship'],
        bio: 'Dedicated caregiver with experience in post-operative care and daily living assistance.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 950,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-chamari.pdf',
        policeVerification: 'https://example.com/documents/police-chamari.pdf',
        medicalCertificate: 'https://example.com/documents/medical-chamari.pdf',
      },
    },
    {
      user: {
        name: 'Rohan Bandara',
        email: 'rohan.b@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234514',
        address: {
          street: '78 Station Road',
          city: 'Kurunegala',
          state: 'North Western Province',
          zipCode: '60000',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Physical Therapy Assistant Certificate',
        experience: 5,
        specialization: ['mobility', 'medical', 'other'],
        bio: 'Experienced in helping elderly patients with mobility issues and physical rehabilitation exercises.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 1250,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-rohan.pdf',
        policeVerification: 'https://example.com/documents/police-rohan.pdf',
        medicalCertificate: 'https://example.com/documents/medical-rohan.pdf',
      },
    },
    {
      user: {
        name: 'Sanduni Perera',
        email: 'sanduni.p@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234515',
        address: {
          street: '23 Lake Road',
          city: 'Anuradhapura',
          state: 'North Central Province',
          zipCode: '50000',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Home Health Aide, Medication Management Certified',
        experience: 4,
        specialization: ['medical', 'companionship', 'other'],
        bio: 'Patient and caring individual with experience in medication management and meal preparation.',
        languages: ['Sinhala', 'English', 'Tamil'],
        hourlyRate: 1050,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-sanduni.pdf',
        policeVerification: 'https://example.com/documents/police-sanduni.pdf',
        medicalCertificate: 'https://example.com/documents/medical-sanduni.pdf',
      },
    },
    {
      user: {
        name: 'Ashan Jayawardena',
        email: 'ashan.j@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234516',
        address: {
          street: '56 Park Avenue',
          city: 'Jaffna',
          state: 'Northern Province',
          zipCode: '40000',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Geriatric Care Specialist, First Aid Certified',
        experience: 6,
        specialization: ['dementia', 'medical', 'companionship'],
        bio: 'Compassionate specialist in geriatric care with focus on cognitive health and daily activity support.',
        languages: ['Tamil', 'English', 'Sinhala'],
        hourlyRate: 1400,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-ashan.pdf',
        policeVerification: 'https://example.com/documents/police-ashan.pdf',
        medicalCertificate: 'https://example.com/documents/medical-ashan.pdf',
      },
    },
    {
      user: {
        name: 'Thilini Wijesinghe',
        email: 'thilini.w@elderease.lk',
        password: 'password123',
        role: 'caregiver',
        phone: '+94771234517',
        address: {
          street: '12 Main Road',
          city: 'Ratnapura',
          state: 'Sabaragamuwa Province',
          zipCode: '70000',
          country: 'Sri Lanka',
        },
        isActive: false,
        isVerified: false,
      },
      profile: {
        qualification: 'Certified Personal Care Aide',
        experience: 2,
        specialization: ['companionship', 'other'],
        bio: 'Friendly and reliable caregiver eager to provide emotional support and daily living assistance.',
        languages: ['Sinhala', 'English'],
        hourlyRate: 800,
        status: 'unavailable',
        rating: 0,
        totalReviews: 0,
        idProof: 'https://example.com/documents/id-thilini.pdf',
        policeVerification: 'https://example.com/documents/police-thilini.pdf',
        medicalCertificate: 'https://example.com/documents/medical-thilini.pdf',
      },
    },
  ];

  for (const caregiver of pendingCaregivers) {
    const user = await User.create(caregiver.user);
    await Caregiver.create({ ...caregiver.profile, userId: user._id });
  }

  console.log(`✓ Created ${pendingCaregivers.length} pending caregiver requests`);
};

// Create care receivers with profiles
const createCareReceivers = async () => {
  console.log('\n👴 Creating care receivers...');
  
  const careReceivers = [
    {
      user: {
        name: 'Kumudu Wijesinghe',
        email: 'kumudu.w@elderease.lk',
        password: 'password123',
        role: 'carereceiver',
        phone: '+94771234601',
        address: {
          street: '56 Duplication Road',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00400',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        medicalHistory: [
          { condition: 'Diabetes', diagnosedDate: new Date('2015-03-15'), notes: 'Type 2 diabetes, well controlled' },
          { condition: 'Hypertension', diagnosedDate: new Date('2012-08-20'), notes: 'Mild hypertension' },
          { condition: 'Arthritis', diagnosedDate: new Date('2018-11-10'), notes: 'Osteoarthritis in knees' },
        ],
        medications: [
          { name: 'Metformin', dosage: '500mg', frequency: 'twice daily', prescribedBy: 'Dr. Silva' },
          { name: 'Amlodipine', dosage: '5mg', frequency: 'once daily', prescribedBy: 'Dr. Silva' },
          { name: 'Ibuprofen', dosage: '400mg', frequency: 'as needed', prescribedBy: 'Dr. Silva' },
        ],
        mobilityLevel: 'walker',
        cognitiveStatus: 'normal',
        careNeeds: ['medication', 'bathing', 'mobility'],
      },
    },
    {
      user: {
        name: 'Priyantha Rajapaksa',
        email: 'priyantha.r@elderease.lk',
        password: 'password123',
        role: 'carereceiver',
        phone: '+94771234603',
        address: {
          street: '23 Hill Street',
          city: 'Kandy',
          state: 'Central Province',
          zipCode: '20000',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        medicalHistory: [
          { condition: 'Heart Disease', diagnosedDate: new Date('2010-05-12'), notes: 'Coronary artery disease, stable' },
          { condition: 'Dementia', diagnosedDate: new Date('2019-07-22'), notes: 'Moderate Alzheimer\'s disease' },
        ],
        medications: [
          { name: 'Aspirin', dosage: '75mg', frequency: 'once daily', prescribedBy: 'Dr. Fernando' },
          { name: 'Atorvastatin', dosage: '20mg', frequency: 'once daily', prescribedBy: 'Dr. Fernando' },
          { name: 'Donepezil', dosage: '10mg', frequency: 'once daily', prescribedBy: 'Dr. Perera' },
        ],
        mobilityLevel: 'independent',
        cognitiveStatus: 'moderate-impairment',
        careNeeds: ['medication', 'companionship', 'medical-monitoring'],
      },
    },
    {
      user: {
        name: 'Ramani Fernando',
        email: 'ramani.f@elderease.lk',
        password: 'password123',
        role: 'carereceiver',
        phone: '+94771234605',
        address: {
          street: '45 Station Road',
          city: 'Galle',
          state: 'Southern Province',
          zipCode: '80000',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        medicalHistory: [
          { condition: 'Osteoporosis', diagnosedDate: new Date('2016-02-18'), notes: 'Moderate bone density loss' },
          { condition: 'Depression', diagnosedDate: new Date('2020-09-05'), notes: 'Mild depression, responding to treatment' },
        ],
        medications: [
          { name: 'Calcium supplements', dosage: '600mg', frequency: 'twice daily', prescribedBy: 'Dr. Gunasekara' },
          { name: 'Vitamin D', dosage: '1000IU', frequency: 'once daily', prescribedBy: 'Dr. Gunasekara' },
          { name: 'Sertraline', dosage: '50mg', frequency: 'once daily', prescribedBy: 'Dr. Jayawardena' },
        ],
        mobilityLevel: 'independent',
        cognitiveStatus: 'normal',
        careNeeds: ['companionship', 'housekeeping'],
      },
    },
    {
      user: {
        name: 'Susantha Gunawardena',
        email: 'susantha.g@elderease.lk',
        password: 'password123',
        role: 'carereceiver',
        phone: '+94771234607',
        address: {
          street: '12 Park Avenue',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00500',
          country: 'Sri Lanka',
        },
        isActive: true,
        isVerified: true,
      },
      profile: {
        medicalHistory: [
          { condition: 'Stroke', diagnosedDate: new Date('2021-03-10'), notes: 'Ischemic stroke, recovering with therapy' },
          { condition: 'Parkinson\'s Disease', diagnosedDate: new Date('2017-11-25'), notes: 'Early to mid-stage Parkinson\'s' },
        ],
        medications: [
          { name: 'Levodopa/Carbidopa', dosage: '25/100mg', frequency: 'three times daily', prescribedBy: 'Dr. Dissanayake' },
          { name: 'Warfarin', dosage: '5mg', frequency: 'once daily', prescribedBy: 'Dr. Dissanayake' },
        ],
        mobilityLevel: 'walker',
        cognitiveStatus: 'mild-impairment',
        careNeeds: ['medication', 'mobility', 'feeding', 'medical-monitoring'],
      },
    },
  ];

  const createdCareReceivers = [];
  
  for (const receiver of careReceivers) {
    const user = await User.create(receiver.user);
    const profile = await CareReceiver.create({ ...receiver.profile, userId: user._id });
    createdCareReceivers.push({ user, profile });
  }

  console.log(`✓ Created ${careReceivers.length} care receivers with profiles`);
  return createdCareReceivers;
};

// Create feedback entries
const createFeedback = async (caregivers, careReceivers) => {
  console.log('\n💬 Creating feedback entries...');
  
  if (caregivers.length === 0 || careReceivers.length === 0) {
    console.log('⚠️  Skipping feedback creation - no caregivers or care receivers available');
    return;
  }

  const feedbackEntries = [
    {
      userId: careReceivers[0].user._id,
      rating: 5,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'Excellent service! The caregiver assigned to my mother is very professional and caring. My mother feels very comfortable with the care provided.',
      status: 'reviewed',
    },
    {
      userId: careReceivers[1].user._id,
      rating: 4,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'Very good service overall. The caregiver is punctual and reliable with medication management.',
      status: 'reviewed',
    },
    {
      userId: careReceivers[2].user._id,
      rating: 5,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'Outstanding care! The caregiver\'s expertise in post-surgery care was invaluable. Highly recommended.',
      status: 'reviewed',
    },
    {
      userId: careReceivers[0].user._id,
      rating: 4,
      feedbackType: 'General',
      category: 'Platform Experience',
      message: 'The ElderEase platform is very user-friendly. Easy to find qualified caregivers and schedule appointments.',
      status: 'pending',
    },
    {
      userId: careReceivers[3].user._id,
      rating: 5,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'Wonderful service! The caregiver prepares delicious meals and provides great companionship to my father.',
      status: 'reviewed',
    },
    {
      userId: caregivers[0].user._id,
      rating: 5,
      feedbackType: 'General',
      category: 'Platform Experience',
      message: 'Great platform for caregivers to find work. The payment system is transparent and reliable.',
      status: 'reviewed',
    },
    {
      userId: careReceivers[1].user._id,
      rating: 3,
      feedbackType: 'Suggestion',
      category: 'Feature Request',
      message: 'Good service overall, but the app could use some improvements in the scheduling feature. Would be great to have a calendar view.',
      status: 'pending',
    },
    {
      userId: careReceivers[2].user._id,
      rating: 4,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'Very satisfied with the care provided. The caregiver is patient and understanding with all needs.',
      status: 'reviewed',
    },
  ];

  for (const feedback of feedbackEntries) {
    await Feedback.create(feedback);
  }

  console.log(`✓ Created ${feedbackEntries.length} feedback entries`);
};

// Create payment records
const createPayments = async (caregivers, careReceivers) => {
  console.log('\n💰 Creating payment records...');
  
  if (careReceivers.length === 0 || careReceivers.length === 0) {
    console.log('⚠️  Skipping payment creation - no caregivers or care receivers available');
    return;
  }

  const now = new Date();
  
  // Helper function to create a date N days ago
  const daysAgo = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  };
  
  const payments = [
    {
      userId: careReceivers[0].user._id,
      amount: 12000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN001' + Date.now(),
      description: 'Full day elderly care service',
      serviceType: 'Hourly Care',
      createdAt: daysAgo(5),
    },
    {
      userId: careReceivers[1].user._id,
      amount: 9600,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN002' + Date.now(),
      description: 'Medication management and personal care',
      serviceType: 'Specialized Care',
      createdAt: daysAgo(12),
    },
    {
      userId: careReceivers[2].user._id,
      amount: 16000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN003' + Date.now(),
      description: 'Post-surgery care and physical therapy',
      serviceType: 'Specialized Care',
      createdAt: daysAgo(20),
    },
    {
      userId: careReceivers[3].user._id,
      amount: 8000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Debit Card',
      transactionId: 'TXN004' + Date.now(),
      description: 'Companionship and meal preparation',
      serviceType: 'Companion Care',
      createdAt: daysAgo(35),
    },
    {
      userId: careReceivers[0].user._id,
      amount: 4800,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN005' + Date.now(),
      description: 'Half day care service',
      serviceType: 'Hourly Care',
      createdAt: daysAgo(2),
    },
    {
      userId: careReceivers[1].user._id,
      amount: 12000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN006' + Date.now(),
      description: 'Dementia care and supervision',
      serviceType: 'Specialized Care',
      createdAt: daysAgo(45),
    },
    {
      userId: careReceivers[2].user._id,
      amount: 8000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN007' + Date.now(),
      description: 'Companionship and light housekeeping',
      serviceType: 'Companion Care',
      createdAt: daysAgo(60),
    },
    {
      userId: careReceivers[3].user._id,
      amount: 10000,
      currency: 'USD',
      status: 'failed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN008' + Date.now(),
      description: 'Physical therapy session',
      serviceType: 'Specialized Care',
      createdAt: daysAgo(3),
    },
    {
      userId: careReceivers[0].user._id,
      amount: 15000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN009' + Date.now(),
      description: 'Weekly care package',
      serviceType: 'Care Package',
      createdAt: daysAgo(75),
    },
    {
      userId: careReceivers[1].user._id,
      amount: 11000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN010' + Date.now(),
      description: 'Emergency care service',
      serviceType: 'Emergency Care',
      createdAt: daysAgo(90),
    },
    {
      userId: careReceivers[2].user._id,
      amount: 13000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Debit Card',
      transactionId: 'TXN011' + Date.now(),
      description: 'Full day specialized care',
      serviceType: 'Specialized Care',
      createdAt: daysAgo(105),
    },
    {
      userId: careReceivers[3].user._id,
      amount: 9000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN012' + Date.now(),
      description: 'Companion care service',
      serviceType: 'Companion Care',
      createdAt: daysAgo(120),
    },
  ];

  for (const payment of payments) {
    await Payment.create(payment);
  }

  console.log(`✓ Created ${payments.length} payment records`);
};

// Main population function
const populateDatabase = async () => {
  try {
    console.log('\n📊 Starting database population...\n');
    console.log('=' .repeat(60));

    await clearDatabase();
    await createAdmins();
    const caregivers = await createCaregivers();
    await createPendingRequests();
    const careReceivers = await createCareReceivers();
    await createFeedback(caregivers, careReceivers);
    await createPayments(caregivers, careReceivers);

    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Database population completed successfully!\n');
    
    // Print summary
    const userCount = await User.countDocuments();
    const caregiverCount = await Caregiver.countDocuments();
    const careReceiverCount = await CareReceiver.countDocuments();
    const feedbackCount = await Feedback.countDocuments();
    const paymentCount = await Payment.countDocuments();
    
    console.log('📈 Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Caregivers: ${caregiverCount}`);
    console.log(`   - Care Receivers: ${careReceiverCount}`);
    console.log(`   - Feedback Entries: ${feedbackCount}`);
    console.log(`   - Payment Records: ${paymentCount}`);
    console.log('\n🔐 Admin Credentials:');
    console.log('   Email: admin@elderease.lk');
    console.log('   Password: admin123');
    console.log('');
  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('\n🚀 ElderEase Database Seed Script\n');
    console.log('=' .repeat(60));
    
    await connectDB();
    await populateDatabase();
    
    console.log('=' .repeat(60));
    console.log('\n🎉 All done! You can now start the server and log in to test the application.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run the script
main();
