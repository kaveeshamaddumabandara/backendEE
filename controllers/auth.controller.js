const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');
const CareReceiver = require('../models/CareReceiver.model');
const sendEmail = require('../utils/sendEmail');
const { getPasswordResetEmailTemplate } = require('../utils/emailTemplates');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      dateOfBirth,
    });

    // Create role-specific profile
    if (role === 'caregiver') {
      await Caregiver.create({
        userId: user._id,
        qualification: '',
        experience: 0,
      });
    } else if (role === 'carereceiver') {
      await CareReceiver.create({
        userId: user._id,
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error registering user',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password provided
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account has been deactivated',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage || '',
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error logging in',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching user',
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
      data: {
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating password',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    // Generate reset token using model method
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL - use frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Get email template
    const emailContent = getPasswordResetEmailTemplate(resetUrl, user.name);

    // Try to send email
    const emailResult = await sendEmail({
      email: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // Log for development
    console.log('Password reset requested for:', user.email);
    console.log('Reset URL:', resetUrl);
    
    // If email sending is not configured, return token in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!emailResult.success && isDevelopment) {
      console.warn('Email sending failed. Returning token in response for development.');
      return res.status(200).json({
        status: 'success',
        message: 'Password reset link generated (Email service not configured)',
        data: {
          resetToken,
          resetUrl,
          note: 'Email service not configured. Use the link above to reset password.',
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Password reset link has been sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Clear reset token if email sending fails
    if (error.name === 'Error') {
      try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
          user.resetPasswordToken = undefined;
          user.resetPasswordExpire = undefined;
          await user.save({ validateBeforeSave: false });
        }
      } catch (err) {
        console.error('Error clearing reset token:', err);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Error processing password reset request',
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a new password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters',
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully',
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error resetting password',
    });
  }
};

