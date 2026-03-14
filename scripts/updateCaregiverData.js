require('dotenv').config();
const mongoose = require('mongoose');
const Caregiver = require('../models/Caregiver.model');

const updateCaregiverData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all caregivers with default rating and review count
    const result = await Caregiver.updateMany(
      {},
      {
        $set: {
          rating: 4.8,
          totalReviews: 80,
          assignedCareReceivers: [],
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} caregiver profiles`);
    
    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateCaregiverData();
