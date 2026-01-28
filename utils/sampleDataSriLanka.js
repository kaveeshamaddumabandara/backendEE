const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');
const CareReceiver = require('../models/CareReceiver.model');
const Feedback = require('../models/Feedback.model');
const Payment = require('../models/Payment.model');

// Sri Lankan sample data for ElderEase platform
const sampleDataSriLanka = {
  users: [
    // Caregivers
    {
      name: 'Nimal Perera',
      email: 'nimal.perera@elderease.lk',
      password: 'password123',
      role: 'caregiver',
      phone: '+94771234567',
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
    {
      name: 'Chamari Silva',
      email: 'chamari.silva@elderease.lk',
      password: 'password123',
      role: 'caregiver',
      phone: '+94772345678',
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
    {
      name: 'Ruwan Fernando',
      email: 'ruwan.fernando@elderease.lk',
      password: 'password123',
      role: 'caregiver',
      phone: '+94773456789',
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
    {
      name: 'Sanduni Jayawardena',
      email: 'sanduni.j@elderease.lk',
      password: 'password123',
      role: 'caregiver',
      phone: '+94774567890',
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
    // Care Receivers
    {
      name: 'Kumudu Wijesinghe',
      email: 'kumudu.w@elderease.lk',
      password: 'password123',
      role: 'carereceiver',
      phone: '+94775678901',
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
    {
      name: 'Priyantha Rajapaksa',
      email: 'priyantha.r@elderease.lk',
      password: 'password123',
      role: 'carereceiver',
      phone: '+94776789012',
      address: {
        street: '89 Ward Place',
        city: 'Colombo',
        state: 'Western Province',
        zipCode: '00700',
        country: 'Sri Lanka',
      },
      isActive: true,
      isVerified: true,
    },
    {
      name: 'Anula Gunawardena',
      email: 'anula.g@elderease.lk',
      password: 'password123',
      role: 'carereceiver',
      phone: '+94777890123',
      address: {
        street: '23 Dharmaraja Road',
        city: 'Kandy',
        state: 'Central Province',
        zipCode: '20000',
        country: 'Sri Lanka',
      },
      isActive: true,
      isVerified: true,
    },
    {
      name: 'Ranjith Dissanayake',
      email: 'ranjith.d@elderease.lk',
      password: 'password123',
      role: 'carereceiver',
      phone: '+94778901234',
      address: {
        street: '67 Lighthouse Street',
        city: 'Galle',
        state: 'Southern Province',
        zipCode: '80000',
        country: 'Sri Lanka',
      },
      isActive: true,
      isVerified: true,
    },
    {
      name: 'Mallika Samarasinghe',
      email: 'mallika.s@elderease.lk',
      password: 'password123',
      role: 'carereceiver',
      phone: '+94779012345',
      address: {
        street: '34 Station Road',
        city: 'Negombo',
        state: 'Western Province',
        zipCode: '11500',
        country: 'Sri Lanka',
      },
      isActive: true,
      isVerified: true,
    },
    {
      name: 'Sunil Bandara',
      email: 'sunil.b@elderease.lk',
      password: 'password123',
      role: 'carereceiver',
      phone: '+94770123456',
      address: {
        street: '91 Main Street',
        city: 'Matara',
        state: 'Southern Province',
        zipCode: '81000',
        country: 'Sri Lanka',
      },
      isActive: true,
      isVerified: true,
    },
  ],

  caregivers: [
    {
      // Will be linked to Nimal Perera
      qualification: 'Diploma in Nursing from Colombo Nursing School',
      experience: 5,
      specialization: ['medical', 'mobility', 'companionship'],
      certifications: [
        {
          name: 'Basic Life Support (BLS)',
          issuedBy: 'Sri Lanka Medical Council',
          issuedDate: new Date('2023-01-15'),
          expiryDate: new Date('2025-01-15'),
        },
        {
          name: 'Elderly Care Certificate',
          issuedBy: 'National Institute of Health Sciences',
          issuedDate: new Date('2022-06-10'),
        },
      ],
      availability: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timeSlots: [
          { start: '08:00', end: '16:00' },
        ],
      },
      hourlyRate: 1500, // LKR
      rating: 4.7,
      totalReviews: 23,
    },
    {
      // Will be linked to Chamari Silva
      qualification: 'BSc Nursing from University of Peradeniya',
      experience: 8,
      specialization: ['alzheimer', 'dementia', 'medical', 'companionship'],
      certifications: [
        {
          name: 'Advanced Cardiac Life Support (ACLS)',
          issuedBy: 'Sri Lanka Medical Council',
          issuedDate: new Date('2022-09-20'),
          expiryDate: new Date('2025-09-20'),
        },
        {
          name: 'Dementia Care Specialist',
          issuedBy: 'Alzheimer\'s Foundation Sri Lanka',
          issuedDate: new Date('2021-03-15'),
        },
      ],
      availability: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        timeSlots: [
          { start: '07:00', end: '15:00' },
        ],
      },
      hourlyRate: 2000, // LKR
      rating: 4.9,
      totalReviews: 41,
    },
    {
      // Will be linked to Ruwan Fernando
      qualification: 'Certificate in Elderly Care from Kandy Vocational Training Center',
      experience: 3,
      specialization: ['mobility', 'companionship', 'medical'],
      certifications: [
        {
          name: 'First Aid Certificate',
          issuedBy: 'Sri Lanka Red Cross Society',
          issuedDate: new Date('2023-05-10'),
          expiryDate: new Date('2026-05-10'),
        },
      ],
      availability: {
        days: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        timeSlots: [
          { start: '09:00', end: '17:00' },
        ],
      },
      hourlyRate: 1200, // LKR
      rating: 4.5,
      totalReviews: 15,
    },
    {
      // Will be linked to Sanduni Jayawardena
      qualification: 'Diploma in Geriatric Care from Galle Medical Institute',
      experience: 6,
      specialization: ['hospice', 'medical', 'companionship', 'mobility'],
      certifications: [
        {
          name: 'Palliative Care Certificate',
          issuedBy: 'National Cancer Institute Sri Lanka',
          issuedDate: new Date('2022-11-05'),
        },
        {
          name: 'BLS Certification',
          issuedBy: 'Sri Lanka Medical Council',
          issuedDate: new Date('2023-02-20'),
          expiryDate: new Date('2025-02-20'),
        },
      ],
      availability: {
        days: ['monday', 'wednesday', 'thursday', 'friday', 'saturday'],
        timeSlots: [
          { start: '08:00', end: '16:00' },
          { start: '16:00', end: '20:00' },
        ],
      },
      hourlyRate: 1800, // LKR
      rating: 4.8,
      totalReviews: 32,
    },
  ],

  careReceivers: [
    {
      // Will be linked to Kumudu Wijesinghe
      medicalHistory: [
        {
          condition: 'Type 2 Diabetes',
          diagnosedDate: new Date('2018-03-15'),
          notes: 'Managing with medication and diet control',
        },
        {
          condition: 'Hypertension',
          diagnosedDate: new Date('2016-07-20'),
          notes: 'Blood pressure controlled with daily medication',
        },
      ],
      medications: [
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          prescribedBy: 'Dr. Ananda Perera - Colombo General Hospital',
          startDate: new Date('2018-03-15'),
        },
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Ananda Perera - Colombo General Hospital',
          startDate: new Date('2016-07-20'),
        },
      ],
      allergies: ['Penicillin', 'Shellfish'],
      mobilityLevel: 'walker',
      cognitiveStatus: 'normal',
      dietaryRestrictions: ['Low sugar', 'Low salt'],
      careNeeds: ['medication', 'mobility', 'companionship'],
    },
    {
      // Will be linked to Priyantha Rajapaksa
      medicalHistory: [
        {
          condition: 'Alzheimer\'s Disease - Early Stage',
          diagnosedDate: new Date('2021-05-10'),
          notes: 'Memory issues, needs supervision for daily activities',
        },
        {
          condition: 'Arthritis',
          diagnosedDate: new Date('2015-02-18'),
          notes: 'Joint pain in knees and hands',
        },
      ],
      medications: [
        {
          name: 'Donepezil',
          dosage: '10mg',
          frequency: 'Once daily at night',
          prescribedBy: 'Dr. Rohini Fernando - National Hospital Colombo',
          startDate: new Date('2021-05-15'),
        },
        {
          name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'As needed for pain',
          prescribedBy: 'Dr. Rohini Fernando - National Hospital Colombo',
          startDate: new Date('2015-03-01'),
        },
      ],
      allergies: ['Aspirin'],
      mobilityLevel: 'independent',
      cognitiveStatus: 'mild-impairment',
      dietaryRestrictions: ['Vegetarian'],
      careNeeds: ['medication', 'companionship', 'medical-monitoring'],
    },
    {
      // Will be linked to Anula Gunawardena
      medicalHistory: [
        {
          condition: 'Osteoporosis',
          diagnosedDate: new Date('2019-08-12'),
          notes: 'High risk of fractures, needs assistance with mobility',
        },
      ],
      medications: [
        {
          name: 'Calcium Carbonate',
          dosage: '500mg',
          frequency: 'Twice daily with meals',
          prescribedBy: 'Dr. Sunil Jayasuriya - Kandy General Hospital',
          startDate: new Date('2019-08-15'),
        },
        {
          name: 'Vitamin D3',
          dosage: '1000IU',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Sunil Jayasuriya - Kandy General Hospital',
          startDate: new Date('2019-08-15'),
        },
      ],
      allergies: [],
      mobilityLevel: 'walker',
      cognitiveStatus: 'normal',
      dietaryRestrictions: ['Lactose intolerant'],
      careNeeds: ['mobility', 'companionship', 'housekeeping'],
    },
    {
      // Will be linked to Ranjith Dissanayake
      medicalHistory: [
        {
          condition: 'Chronic Heart Disease',
          diagnosedDate: new Date('2017-11-25'),
          notes: 'Had bypass surgery in 2018, requires regular monitoring',
        },
        {
          condition: 'High Cholesterol',
          diagnosedDate: new Date('2015-06-10'),
          notes: 'Controlled with medication and diet',
        },
      ],
      medications: [
        {
          name: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'Once daily at night',
          prescribedBy: 'Dr. Kamani Wickramasinghe - Karapitiya Hospital',
          startDate: new Date('2015-06-15'),
        },
        {
          name: 'Aspirin',
          dosage: '75mg',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Kamani Wickramasinghe - Karapitiya Hospital',
          startDate: new Date('2018-01-10'),
        },
      ],
      allergies: ['Sulfa drugs'],
      mobilityLevel: 'independent',
      cognitiveStatus: 'normal',
      dietaryRestrictions: ['Low fat', 'Low cholesterol'],
      careNeeds: ['medication', 'medical-monitoring', 'companionship'],
    },
    {
      // Will be linked to Mallika Samarasinghe
      medicalHistory: [
        {
          condition: 'Parkinson\'s Disease',
          diagnosedDate: new Date('2020-02-14'),
          notes: 'Tremors and balance issues, needs assistance with daily activities',
        },
      ],
      medications: [
        {
          name: 'Levodopa/Carbidopa',
          dosage: '25/100mg',
          frequency: 'Three times daily',
          prescribedBy: 'Dr. Tharaka Silva - Negombo General Hospital',
          startDate: new Date('2020-02-20'),
        },
      ],
      allergies: [],
      mobilityLevel: 'walker',
      cognitiveStatus: 'mild-impairment',
      dietaryRestrictions: ['High fiber'],
      careNeeds: ['medication', 'bathing', 'feeding', 'mobility', 'companionship'],
    },
    {
      // Will be linked to Sunil Bandara
      medicalHistory: [
        {
          condition: 'Stroke (2022)',
          diagnosedDate: new Date('2022-04-08'),
          notes: 'Left side weakness, undergoing physiotherapy',
        },
      ],
      medications: [
        {
          name: 'Clopidogrel',
          dosage: '75mg',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Nimal Rodrigo - Matara General Hospital',
          startDate: new Date('2022-04-15'),
        },
        {
          name: 'Ramipril',
          dosage: '5mg',
          frequency: 'Once daily',
          prescribedBy: 'Dr. Nimal Rodrigo - Matara General Hospital',
          startDate: new Date('2022-04-15'),
        },
      ],
      allergies: [],
      mobilityLevel: 'wheelchair',
      cognitiveStatus: 'normal',
      dietaryRestrictions: ['Low salt', 'Heart-healthy diet'],
      careNeeds: ['medication', 'bathing', 'mobility', 'medical-monitoring', 'companionship'],
    },
  ],

  feedbacks: [
    {
      // From Kumudu Wijesinghe
      rating: 5,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'The caregiver assigned to me, Nimal, is excellent. Very professional and caring. He helps me with my daily medication and mobility exercises. Highly recommend ElderEase!',
      status: 'reviewed',
    },
    {
      // From Priyantha Rajapaksa
      rating: 5,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'Chamari has been a blessing to our family. She understands my condition well and is very patient with me. The platform made it easy to find such qualified help.',
      status: 'reviewed',
    },
    {
      // From Anula Gunawardena
      rating: 4,
      feedbackType: 'Suggestion',
      category: 'Feature Request',
      message: 'The service is great, but it would be helpful to have a Sinhala language option in the app. Many elderly people in Sri Lanka are more comfortable with Sinhala.',
      status: 'pending',
    },
    {
      // From Ranjith Dissanayake
      rating: 5,
      feedbackType: 'General',
      category: 'Platform Experience',
      message: 'Very user-friendly platform. The payment system works smoothly and the caregivers are thoroughly vetted. Feel very safe using this service.',
      status: 'reviewed',
    },
    {
      // From Mallika Samarasinghe
      rating: 4,
      feedbackType: 'Issue',
      category: 'Technical Issue',
      message: 'Had some difficulty logging in from my mobile phone initially, but the customer support team helped resolve it quickly. Overall good experience.',
      status: 'resolved',
    },
    {
      // From Sunil Bandara
      rating: 5,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'After my stroke, I needed continuous care. ElderEase connected me with Sanduni who has been exceptional. She helps with physiotherapy exercises and daily activities.',
      status: 'reviewed',
    },
    {
      // From Kumudu Wijesinghe (second feedback)
      rating: 5,
      feedbackType: 'Suggestion',
      category: 'Feature Request',
      message: 'Would love to see an option for video consultation with caregivers before booking. Otherwise, the service is perfect!',
      status: 'pending',
    },
    {
      // From Priyantha Rajapaksa (second feedback)
      rating: 4,
      feedbackType: 'General',
      category: 'Payment',
      message: 'Payment process is smooth. Would appreciate if you could add local bank transfer options alongside card payments.',
      status: 'pending',
    },
    {
      // From Anula Gunawardena (second feedback)
      rating: 5,
      feedbackType: 'General',
      category: 'Customer Support',
      message: 'The customer support team is responsive and helpful. They answered all my questions about the service before I signed up.',
      status: 'reviewed',
    },
    {
      // From Ranjith Dissanayake (second feedback)
      rating: 5,
      feedbackType: 'General',
      category: 'Service Quality',
      message: 'Excellent service! The caregiver is punctual, professional, and genuinely cares about my wellbeing. Thank you ElderEase!',
      status: 'reviewed',
    },
  ],

  payments: [
    {
      // Payment by Kumudu Wijesinghe
      amount: 24000, // LKR (16 hours @ 1500/hr)
      currency: 'LKR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: 'TXN-SL-001-' + Date.now(),
      description: 'Weekly care service - 16 hours',
      serviceType: 'Hourly Care',
    },
    {
      // Payment by Priyantha Rajapaksa
      amount: 48000, // LKR (24 hours @ 2000/hr)
      currency: 'LKR',
      paymentMethod: 'Debit Card',
      status: 'completed',
      transactionId: 'TXN-SL-002-' + Date.now(),
      description: 'Bi-weekly specialized dementia care - 24 hours',
      serviceType: 'Specialized Care',
    },
    {
      // Payment by Anula Gunawardena
      amount: 14400, // LKR (12 hours @ 1200/hr)
      currency: 'LKR',
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      transactionId: 'TXN-SL-003-' + Date.now(),
      description: 'Weekly companion care - 12 hours',
      serviceType: 'Companion Care',
    },
    {
      // Payment by Ranjith Dissanayake
      amount: 28800, // LKR (16 hours @ 1800/hr)
      currency: 'LKR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: 'TXN-SL-004-' + Date.now(),
      description: 'Weekly palliative care - 16 hours',
      serviceType: 'Specialized Care',
    },
    {
      // Payment by Mallika Samarasinghe
      amount: 36000, // LKR (24 hours @ 1500/hr)
      currency: 'LKR',
      paymentMethod: 'Debit Card',
      status: 'completed',
      transactionId: 'TXN-SL-005-' + Date.now(),
      description: 'Weekly comprehensive care - 24 hours',
      serviceType: 'Care Package',
    },
    {
      // Payment by Sunil Bandara
      amount: 43200, // LKR (24 hours @ 1800/hr)
      currency: 'LKR',
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      transactionId: 'TXN-SL-006-' + Date.now(),
      description: 'Weekly post-stroke care - 24 hours',
      serviceType: 'Specialized Care',
    },
    {
      // Payment by Kumudu Wijesinghe (subscription)
      amount: 60000, // LKR (monthly subscription)
      currency: 'LKR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: 'TXN-SL-007-' + Date.now(),
      description: 'Monthly care subscription - 40 hours',
      serviceType: 'Subscription',
    },
    {
      // Payment by Priyantha Rajapaksa (emergency)
      amount: 15000, // LKR (emergency care flat rate)
      currency: 'LKR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: 'TXN-SL-008-' + Date.now(),
      description: 'Emergency night care - urgent assistance',
      serviceType: 'Emergency Care',
    },
    {
      // Payment by Anula Gunawardena
      amount: 18000, // LKR (15 hours @ 1200/hr)
      currency: 'LKR',
      paymentMethod: 'Debit Card',
      status: 'completed',
      transactionId: 'TXN-SL-009-' + Date.now(),
      description: 'Weekly mobility assistance - 15 hours',
      serviceType: 'Hourly Care',
    },
    {
      // Payment by Ranjith Dissanayake (package)
      amount: 80000, // LKR (monthly package)
      currency: 'LKR',
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      transactionId: 'TXN-SL-010-' + Date.now(),
      description: 'Monthly comprehensive care package - 48 hours',
      serviceType: 'Care Package',
    },
  ],
};

async function populateDatabase() {
  try {
    console.log('🚀 Starting to populate database with Sri Lankan sample data...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Users
    console.log('📝 Creating users...');
    const createdUsers = [];
    for (const userData of sampleDataSriLanka.users) {
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      createdUsers.push(user);
      console.log(`✓ Created ${user.role}: ${user.name} (${user.email})`);
    }

    // Separate caregivers and care receivers
    const caregiverUsers = createdUsers.filter(u => u.role === 'caregiver');
    const careReceiverUsers = createdUsers.filter(u => u.role === 'carereceiver');

    // Create Caregiver profiles
    console.log('\n👨‍⚕️ Creating caregiver profiles...');
    const createdCaregivers = [];
    for (let i = 0; i < sampleDataSriLanka.caregivers.length; i++) {
      const caregiver = await Caregiver.create({
        ...sampleDataSriLanka.caregivers[i],
        userId: caregiverUsers[i]._id,
      });
      createdCaregivers.push(caregiver);
      console.log(`✓ Created caregiver profile for ${caregiverUsers[i].name}`);
    }

    // Create Care Receiver profiles
    console.log('\n👴 Creating care receiver profiles...');
    const createdCareReceivers = [];
    for (let i = 0; i < sampleDataSriLanka.careReceivers.length; i++) {
      // Assign a caregiver to each care receiver
      const assignedCaregiver = createdCaregivers[i % createdCaregivers.length];
      
      const careReceiver = await CareReceiver.create({
        ...sampleDataSriLanka.careReceivers[i],
        userId: careReceiverUsers[i]._id,
        assignedCaregivers: [assignedCaregiver._id],
        primaryCaregiver: assignedCaregiver._id,
      });
      createdCareReceivers.push(careReceiver);
      console.log(`✓ Created care receiver profile for ${careReceiverUsers[i].name}`);
    }

    // Create Feedbacks
    console.log('\n💬 Creating feedback entries...');
    for (let i = 0; i < sampleDataSriLanka.feedbacks.length; i++) {
      const userIndex = i % careReceiverUsers.length;
      await Feedback.create({
        ...sampleDataSriLanka.feedbacks[i],
        userId: careReceiverUsers[userIndex]._id,
      });
      console.log(`✓ Created feedback from ${careReceiverUsers[userIndex].name}`);
    }

    // Create Payments
    console.log('\n💰 Creating payment records...');
    for (let i = 0; i < sampleDataSriLanka.payments.length; i++) {
      const userIndex = i % careReceiverUsers.length;
      await Payment.create({
        ...sampleDataSriLanka.payments[i],
        userId: careReceiverUsers[userIndex]._id,
      });
      console.log(`✓ Created payment from ${careReceiverUsers[userIndex].name}`);
    }

    console.log('\n✅ Database population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users created: ${createdUsers.length}`);
    console.log(`   - Caregivers: ${createdCaregivers.length}`);
    console.log(`   - Care Receivers: ${createdCareReceivers.length}`);
    console.log(`   - Feedbacks: ${sampleDataSriLanka.feedbacks.length}`);
    console.log(`   - Payments: ${sampleDataSriLanka.payments.length}`);
    console.log('\n🔑 Login credentials for all users:');
    console.log('   Email: [user email from above]');
    console.log('   Password: password123\n');

  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  }
}

module.exports = {
  sampleDataSriLanka,
  populateDatabase,
};
