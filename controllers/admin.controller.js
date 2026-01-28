const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');
const CareReceiver = require('../models/CareReceiver.model');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCaregivers = await User.countDocuments({ role: 'caregiver' });
    const totalCareReceivers = await User.countDocuments({ role: 'carereceiver' });
    const activeCaregivers = await Caregiver.countDocuments({ status: 'available' });
    const onDutyCaregivers = await Caregiver.countDocuments({ status: 'on-duty' });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(200).json({
      status: 'success',
      data: {
        statistics: {
          totalUsers,
          totalCaregivers,
          totalCareReceivers,
          activeCaregivers,
          onDutyCaregivers,
          recentRegistrations,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching dashboard data',
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    const count = users.length;

    res.status(200).json({
      status: 'success',
      data: {
        users,
        total: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching users',
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    let profile = null;
    if (user.role === 'caregiver') {
      profile = await Caregiver.findOne({ userId: user._id });
    } else if (user.role === 'carereceiver' || user.role === 'care-receiver') {
      profile = await CareReceiver.findOne({ userId: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching user',
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating user',
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Store deletion reason if provided
    const { reason } = req.body;
    if (reason) {
      user.deletionReason = reason;
      user.deletedAt = new Date();
      user.deletedBy = req.user._id; // Admin who deleted the user
      await user.save();
    }

    // Delete associated profile
    if (user.role === 'caregiver') {
      await Caregiver.findOneAndDelete({ userId: user._id });
    } else if (user.role === 'carereceiver') {
      await CareReceiver.findOneAndDelete({ userId: user._id });
    }

    await user.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting user',
    });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error toggling user status',
    });
  }
};

// @desc    Update user status (set specific value)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isActive field must be a boolean value',
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating user status',
    });
  }
};

// @desc    Get all caregivers
// @route   GET /api/admin/caregivers
// @access  Private/Admin
exports.getAllCaregivers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const caregivers = await Caregiver.find()
      .populate('userId', 'name email phone profileImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Caregiver.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        caregivers,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching caregivers',
    });
  }
};

// @desc    Get all care receivers
// @route   GET /api/admin/carereceivers
// @access  Private/Admin
exports.getAllCareReceivers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const careReceivers = await CareReceiver.find()
      .populate('userId', 'name email phone profileImage')
      .populate('assignedCaregivers')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await CareReceiver.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        careReceivers,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching care receivers',
    });
  }
};

// @desc    Get pending user requests (unverified users - caregivers only)
// @route   GET /api/admin/pending-requests
// @access  Private/Admin
exports.getPendingRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { role: 'caregiver' }; // Only caregivers need approval
    
    // Filter by verification status
    if (status === 'pending') {
      query.isVerified = false;
      query.isActive = true;
    } else if (status === 'approved') {
      query.isVerified = true;
    } else if (status === 'rejected') {
      query.isActive = false;
      query.isVerified = false;
    }
    // If status is 'all' or undefined, show all caregivers

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Fetch caregiver profiles with additional details
    const requestsWithProfiles = await Promise.all(
      users.map(async (user) => {
        const caregiver = await Caregiver.findOne({ userId: user._id });
        
        const userObj = user.toObject();
        
        // Add caregiver-specific fields to the user object
        if (caregiver) {
          userObj.experience = caregiver.experience ? `${caregiver.experience} years` : '';
          userObj.qualifications = caregiver.qualification || '';
          userObj.specializations = caregiver.specialization || [];
          userObj.availability = caregiver.availability ? JSON.stringify(caregiver.availability) : '';
          userObj.hourlyRate = caregiver.hourlyRate || 0;
          userObj.certifications = caregiver.certifications?.map(cert => cert.name) || [];
          userObj.languages = caregiver.languages || [];
          userObj.bio = caregiver.bio || '';
          
          // Documents
          userObj.documents = {
            idProof: caregiver.idProof || '',
            qualificationCertificates: caregiver.certifications?.map(cert => cert.documentUrl).filter(Boolean) || [],
            policeVerification: caregiver.policeVerification || '',
            medicalCertificate: caregiver.medicalCertificate || '',
          };
        }
        
        // Add location info from address
        if (user.address) {
          userObj.city = user.address.city || '';
          userObj.province = user.address.state || '';
          userObj.address = [user.address.street, user.address.city, user.address.state]
            .filter(Boolean)
            .join(', ');
        }
        
        return userObj;
      })
    );

    res.status(200).json({
      status: 'success',
      data: requestsWithProfiles,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching pending requests',
    });
  }
};

// @desc    Approve user request
// @route   PATCH /api/admin/requests/:id/approve
// @access  Private/Admin
exports.approveRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    user.isVerified = true;
    user.isActive = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User request approved successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error approving request',
    });
  }
};

// @desc    Reject user request
// @route   PATCH /api/admin/requests/:id/reject
// @access  Private/Admin
exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    user.isVerified = false;
    user.isActive = false;
    user.rejectionReason = reason || 'No reason provided';
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User request rejected successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error rejecting request',
    });
  }
};
