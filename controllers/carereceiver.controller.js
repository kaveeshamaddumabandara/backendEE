const CareReceiver = require('../models/CareReceiver.model');
const User = require('../models/User.model');

// @desc    Get care receiver profile
// @route   GET /api/carereceiver/profile
// @access  Private/CareReceiver
exports.getProfile = async (req, res) => {
  try {
    const careReceiver = await CareReceiver.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone address profileImage dateOfBirth emergencyContact')
      .populate('assignedCaregivers')
      .populate('primaryCaregiver');

    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { careReceiver },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching profile',
    });
  }
};

// @desc    Update care receiver profile
// @route   PUT /api/carereceiver/profile
// @access  Private/CareReceiver
exports.updateProfile = async (req, res) => {
  try {
    const careReceiver = await CareReceiver.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId');

    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { careReceiver },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating profile',
    });
  }
};

// @desc    Get assigned caregivers
// @route   GET /api/carereceiver/assigned-caregivers
// @access  Private/CareReceiver
exports.getAssignedCaregivers = async (req, res) => {
  try {
    const careReceiver = await CareReceiver.findOne({ userId: req.user.id })
      .populate({
        path: 'assignedCaregivers',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage',
        },
      })
      .populate({
        path: 'primaryCaregiver',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage',
        },
      });

    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        assignedCaregivers: careReceiver.assignedCaregivers,
        primaryCaregiver: careReceiver.primaryCaregiver,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching assigned caregivers',
    });
  }
};
