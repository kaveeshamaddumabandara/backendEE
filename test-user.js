const mongoose = require('mongoose');
require('dotenv').config();

const testUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User.model');
    
    // Test credentials
    const email = 'nimal.perera@elderease.lk';
    const password = 'password123';
    
    console.log('\nTesting login for:', email);
    console.log('Password:', password);
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.email);
    console.log('Role:', user.role);
    console.log('Is Active:', user.isActive);
    
    const isMatch = await user.comparePassword(password);
    console.log('Password matches:', isMatch ? '✅ YES' : '❌ NO');
    
    if (!isMatch) {
      console.log('\nTrying to update password...');
      user.password = password;
      await user.save();
      console.log('✅ Password updated');
    }
    
    mongoose.connection.close();
    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testUser();
