require('dotenv').config();
const mongoose = require('mongoose');
const { populateDatabase } = require('../utils/sampleDataSriLanka');

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

// Main execution
const main = async () => {
  try {
    console.log('🇱🇰 ElderEase Sri Lankan Sample Data Population Script\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    await connectDB();
    
    // Populate database with Sri Lankan sample data
    await populateDatabase();
    
    console.log('=' .repeat(60));
    console.log('\n🎉 All done! Your database is now populated with Sri Lankan sample data.');
    console.log('You can now start the server and test the application.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run the script
main();
