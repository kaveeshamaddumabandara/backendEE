const Caregiver = require('../models/Caregiver.model');
const User = require('../models/User.model');

// @desc    Get caregiver profile
// @route   GET /api/caregiver/profile
// @access  Private/Caregiver
exports.getProfile = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone address profileImage dateOfBirth emergencyContact')
      .populate('assignedCareReceivers');

    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { caregiver },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching profile',
    });
  }
};

// @desc    Update caregiver profile
// @route   PUT /api/caregiver/profile
// @access  Private/Caregiver
exports.updateProfile = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId');

    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { caregiver },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating profile',
    });
  }
};

// @desc    Get assigned care receivers
// @route   GET /api/caregiver/assigned-receivers
// @access  Private/Caregiver
exports.getAssignedReceivers = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ userId: req.user.id })
      .populate({
        path: 'assignedCareReceivers',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage address',
        },
      });

    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        assignedReceivers: caregiver.assignedCareReceivers,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching assigned receivers',
    });
  }
};

// @desc    Update availability status
// @route   PATCH /api/caregiver/status
// @access  Private/Caregiver
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['available', 'on-duty', 'unavailable'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value',
      });
    }

    const caregiver = await Caregiver.findOneAndUpdate(
      { userId: req.user.id },
      { status },
      { new: true }
    );

    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Status updated successfully',
      data: { caregiver },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating status',
    });
  }
};
