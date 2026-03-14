const mongoose = require('mongoose');
const User = require('../models/User.model');
const CareReceiver = require('../models/CareReceiver.model');
const Booking = require('../models/Booking.model');
const Caregiver = require('../models/Caregiver.model');

const DB_URI = 'mongodb://localhost:27017/careconnect';

async function createProfiles() {
  try {
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find care receiver users
    const careReceiverUsers = await User.find({ role: 'carereceiver' });
    console.log(`\n📊 Found ${careReceiverUsers.length} care receiver users`);
    
    for (const user of careReceiverUsers) {
      let profile = await CareReceiver.findOne({ userId: user._id });
      
      if (!profile) {
        console.log(`\n➕ Creating profile for: ${user.name} (${user.email})`);
        profile = await CareReceiver.create({
          userId: user._id,
          medicalConditions: ['General care needed'],
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '0771234567'
          },
          assignedCaregivers: [],
          careRequirements: 'General care and daily assistance',
          preferences: {
            preferredGender: 'any',
            languagePreference: ['Sinhala', 'English']
          }
        });
        console.log(`✅ Profile created with ID: ${profile._id}`);
      } else {
        console.log(`\n✓ Profile already exists for: ${user.name}`);
      }
      
      // Create sample bookings if none exist
      const bookingCount = await Booking.countDocuments({ careReceiverId: profile._id });
      
      if (bookingCount === 0) {
        console.log(`  Creating sample bookings...`);
        
        // Get some caregivers
        const caregivers = await Caregiver.find().limit(3).populate('userId');
        
        if (caregivers.length > 0) {
          const serviceTypes = ['Personal Care', 'Medical Care', 'Companionship', 'Housekeeping'];
          const statuses = ['confirmed', 'pending', 'completed'];
          
          for (let i = 0; i < 5; i++) {
            const caregiver = caregivers[i % caregivers.length];
            const daysAgo = i * 2;
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() - daysAgo);
            
            await Booking.create({
              careReceiverId: profile._id,
              caregiverId: caregiver._id,
              serviceType: serviceTypes[i % serviceTypes.length],
              date: bookingDate,
              startTime: '09:00',
              endTime: '13:00',
              duration: 4,
              status: i < 3 ? 'completed' : statuses[i % statuses.length],
              totalAmount: 4000,
              rating: i < 3 ? 4 + (i % 2) : null,
              paymentStatus: i < 3 ? 'completed' : 'pending'
            });
          }
          
          console.log(`  ✅ Created 5 sample bookings`);
        } else {
          console.log(`  ⚠️  No caregivers found to create bookings`);
        }
      } else {
        console.log(`  ✓ ${bookingCount} bookings already exist`);
      }
    }
    
    console.log('\n🎉 Profile creation completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createProfiles();
