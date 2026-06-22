const Caregiver = require('../models/Caregiver.model');
const User = require('../models/User.model');
const Feedback = require('../models/Feedback.model');
const Payment = require('../models/Payment.model');
const Booking = require('../models/Booking.model');

// @desc    Get caregiver dashboard stats
// @route   GET /api/caregiver/dashboard/stats
// @access  Private/Caregiver
exports.getDashboardStats = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ userId: req.user.id });

    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    // --- Total lifetime earnings from completed bookings ---
    const completedBookings = await Booking.find({
      caregiverId: caregiver.userId,
      status: 'completed',
    });

    const totalEarnings = completedBookings.reduce((sum, b) => {
      // Use stored totalAmount if available, otherwise derive from hourlyRate × duration
      if (b.totalAmount > 0) return sum + b.totalAmount;
      const hours = Number(b.duration) > 0 ? Number(b.duration) : 0;
      return sum + hours * (b.hourlyRate || 0);
    }, 0);

    // --- Active clients: unique care receivers with at least one confirmed/completed booking ---
    const uniqueClientIds = await Booking.distinct('careReceiverId', {
      caregiverId: caregiver.userId,
      status: { $in: ['confirmed', 'completed'] },
    });
    const activeClients = uniqueClientIds.length;

    // --- Hours this week ---
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weeklyBookings = await Booking.find({
      caregiverId: caregiver.userId,
      date: { $gte: startOfWeek, $lt: endOfWeek },
      status: { $in: ['confirmed', 'completed'] },
    });

    const hoursThisWeek = weeklyBookings.reduce((sum, b) => {
      return sum + (Number(b.duration) > 0 ? Number(b.duration) : 0);
    }, 0);

    // --- Average rating directly from caregiver profile (set by review logic) ---
    const rating = caregiver.rating || 0;

    res.status(200).json({
      status: 'success',
      data: {
        earnings: Math.round(totalEarnings),
        clients: activeClients,
        hours: Math.round(hoursThisWeek),
        rating: parseFloat(rating.toFixed(1)),
        totalReviews: caregiver.totalReviews || 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching dashboard stats',
    });
  }
};

// @desc    Get performance metrics
// @route   GET /api/caregiver/dashboard/performance
// @access  Private/Caregiver
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ userId: req.user.id });
    
    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    // Calculate metrics (mock data for now, can be enhanced with real tracking)
    const metrics = [
      {
        value: 98,
        target: 95,
        label: 'Task Completion',
        icon: 'check-circle',
        color: '#10b981',
      },
      {
        value: 92,
        target: 90,
        label: 'Response Time',
        icon: 'clock',
        color: '#3b82f6',
      },
      {
        value: 87,
        target: 85,
        label: 'Client Retention',
        icon: 'users',
        color: '#8b5cf6',
      },
      {
        value: 95,
        target: 90,
        label: 'Punctuality',
        icon: 'calendar',
        color: '#f59e0b',
      },
    ];

    res.status(200).json({
      status: 'success',
      data: {
        metrics,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching performance metrics',
    });
  }
};

// @desc    Get client satisfaction data
// @route   GET /api/caregiver/dashboard/satisfaction
// @access  Private/Caregiver
exports.getClientSatisfaction = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ userId: req.user.id });
    
    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    // This would ideally come from a reviews/feedback collection specific to caregivers
    // For now, using mock percentages based on the rating
    const rating = caregiver.rating || 4.5;
    const totalReviews = caregiver.totalReviews || 80;

    const satisfaction = [
      { 
        category: 'Excellent', 
        percentage: 56, 
        count: Math.round(totalReviews * 0.56),
        color: '#10b981'
      },
      { 
        category: 'Good', 
        percentage: 35, 
        count: Math.round(totalReviews * 0.35),
        color: '#3b82f6'
      },
      { 
        category: 'Average', 
        percentage: 8, 
        count: Math.round(totalReviews * 0.08),
        color: '#f59e0b'
      },
      { 
        category: 'Poor', 
        percentage: 1, 
        count: Math.round(totalReviews * 0.01),
        color: '#ef4444'
      },
    ];

    res.status(200).json({
      status: 'success',
      data: {
        satisfaction,
        averageRating: rating,
        totalReviews: totalReviews,
        satisfactionRate: 91, // Excellent + Good
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching satisfaction data',
    });
  }
};

// @desc    Get recent feedback/reviews
// @route   GET /api/caregiver/dashboard/feedback
// @access  Private/Caregiver
exports.getRecentFeedback = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ userId: req.user.id });
    
    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    // Get feedback about this caregiver from Feedback model
    const feedbacks = await Feedback.find({
      caregiverId: caregiver.userId,
    })
      .populate('careReceiverId', 'name')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Format feedback data
    const formattedFeedback = feedbacks.map(feedback => ({
      id: feedback._id,
      client: feedback.careReceiverId?.name || feedback.userId?.name || 'Anonymous Client',
      rating: feedback.rating || 5,
      comment: feedback.comment || feedback.message || 'Great service!',
      date: new Date(feedback.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    res.status(200).json({
      status: 'success',
      data: formattedFeedback,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching feedback',
    });
  }
};

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
    const { profileImage, name, phone, ...caregiverData } = req.body;

    // Update User model fields (profileImage, name, phone)
    if (profileImage !== undefined || name || phone) {
      const userUpdateData = {};
      if (profileImage !== undefined) userUpdateData.profileImage = profileImage;
      if (name) userUpdateData.name = name;
      if (phone) userUpdateData.phone = phone;
      
      await User.findByIdAndUpdate(
        req.user.id,
        userUpdateData,
        { new: true }
      );
    }

    // Update Caregiver model fields
    const caregiver = await Caregiver.findOneAndUpdate(
      { userId: req.user.id },
      caregiverData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone address profileImage dateOfBirth emergencyContact');

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

// @desc    Upload qualification proof documents for a caregiver
// @route   POST /api/caregiver/documents
// @access  Private/Caregiver
exports.uploadDocuments = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ userId: req.user.id });
    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No documents provided',
      });
    }

    const updates = {};

    if (req.files.idProof?.[0]) {
      updates.idProof = req.files.idProof[0].path;
    }
    if (req.files.policeVerification?.[0]) {
      updates.policeVerification = req.files.policeVerification[0].path;
    }
    if (req.files.medicalCertificate?.[0]) {
      updates.medicalCertificate = req.files.medicalCertificate[0].path;
    }
    if (req.files.qualificationDocs && req.files.qualificationDocs.length > 0) {
      updates.certifications = req.files.qualificationDocs.map(file => ({
        name: file.originalname,
        documentUrl: file.path,
      }));
    }

    await Caregiver.findOneAndUpdate({ userId: req.user.id }, updates, { new: true });

    res.status(200).json({
      status: 'success',
      message: 'Documents uploaded successfully',
      data: { uploadedCount: Object.values(req.files).flat().length },
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error uploading documents',
    });
  }
};
