const User = require('../models/User.model');

// Create default admin user if not exists
const initAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@elderease.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
        isActive: true,
        isVerified: true,
      });

      console.log('✅ Default admin user created');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

module.exports = initAdmin;
