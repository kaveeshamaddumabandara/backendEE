const Caregiver = require('../models/Caregiver.model');
const User = require('../models/User.model');
const Feedback = require('../models/Feedback.model');
const Payment = require('../models/Payment.model');
const Booking = require('../models/Booking.model');
const CaregiverProfileChangeRequest = require('../models/CaregiverProfileChangeRequest.model');
const createNotification = require('../utils/createNotification');
const { normalizeWorkTime, parseCalendarDate, getBookingEndMinutes } = require('../utils/bookingOverlap');
const {
  normalizeAddressInput,
  formatAddress,
  phonesEqual,
  addressesEqual,
} = require('../utils/profileChangeRequest');

const buildPendingContactChange = request => {
  if (!request || request.status !== 'pending') {
    return null;
  }

  return {
    _id: request._id,
    pendingPhone: request.pendingPhone || '',
    pendingAddress: request.pendingAddress || null,
    pendingAddressLabel: formatAddress(request.pendingAddress),
    submittedAt: request.createdAt,
  };
};

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

    const caregiverUserId = caregiver.userId;
    const bookings = await Booking.find({ caregiverId: caregiverUserId });

    const completed = bookings.filter(booking => booking.status === 'completed');
    const cancelled = bookings.filter(booking => booking.status === 'cancelled');
    const resolvedCount = completed.length + cancelled.length;
    const taskCompletion = resolvedCount > 0
      ? Math.round((completed.length / resolvedCount) * 100)
      : 0;

    const respondedBookings = bookings.filter(
      booking => booking.responseDate && booking.createdAt,
    );
    const avgResponseHours = respondedBookings.length > 0
      ? respondedBookings.reduce((sum, booking) => {
        const hours =
          (new Date(booking.responseDate).getTime() - new Date(booking.createdAt).getTime())
          / (1000 * 60 * 60);
        return sum + Math.max(hours, 0);
      }, 0) / respondedBookings.length
      : 0;
    const responseTimeScore = avgResponseHours <= 2
      ? 95
      : avgResponseHours <= 6
        ? 85
        : avgResponseHours <= 24
          ? 75
          : 60;

    const clientBookingCounts = completed.reduce((counts, booking) => {
      const clientId = String(booking.careReceiverId);
      counts[clientId] = (counts[clientId] || 0) + 1;
      return counts;
    }, {});
    const uniqueClients = Object.keys(clientBookingCounts).length;
    const repeatClients = Object.values(clientBookingCounts).filter(count => count > 1).length;
    const clientRetention = uniqueClients > 0
      ? Math.round((repeatClients / uniqueClients) * 100)
      : 0;

    const punctualCompleted = completed.filter(booking => {
      if (!booking.completionDate) {
        return false;
      }

      const calendarDate = parseCalendarDate(booking.date);
      const endMinutes = getBookingEndMinutes(booking);
      if (!calendarDate || endMinutes === null) {
        return true;
      }

      const endDateTime = new Date(calendarDate);
      endDateTime.setHours(
        Math.floor(endMinutes / 60),
        endMinutes % 60,
        0,
        0,
      );

      return new Date(booking.completionDate).getTime() <= endDateTime.getTime();
    }).length;
    const punctuality = completed.length > 0
      ? Math.round((punctualCompleted / completed.length) * 100)
      : 0;

    const metrics = [
      {
        value: taskCompletion,
        target: 95,
        label: 'Task Completion',
        icon: 'check-circle',
        color: '#10b981',
      },
      {
        value: responseTimeScore,
        target: 90,
        label: 'Response Time',
        icon: 'clock',
        color: '#3b82f6',
      },
      {
        value: clientRetention,
        target: 85,
        label: 'Client Retention',
        icon: 'users',
        color: '#8b5cf6',
      },
      {
        value: punctuality,
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

    const feedbacks = await Feedback.find({
      caregiverId: caregiver.userId,
      rating: { $gte: 1, $lte: 5 },
    }).select('rating');

    const totalReviews = feedbacks.length;
    const rating = caregiver.rating || 0;

    const buckets = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0,
    };

    feedbacks.forEach(feedback => {
      if (feedback.rating >= 5) {
        buckets.excellent += 1;
      } else if (feedback.rating >= 4) {
        buckets.good += 1;
      } else if (feedback.rating >= 3) {
        buckets.average += 1;
      } else {
        buckets.poor += 1;
      }
    });

    const toPercentage = count =>
      totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

    const satisfaction = [
      { 
        category: 'Excellent', 
        percentage: toPercentage(buckets.excellent), 
        count: buckets.excellent,
        color: '#10b981',
      },
      { 
        category: 'Good', 
        percentage: toPercentage(buckets.good), 
        count: buckets.good,
        color: '#3b82f6',
      },
      { 
        category: 'Average', 
        percentage: toPercentage(buckets.average), 
        count: buckets.average,
        color: '#f59e0b',
      },
      { 
        category: 'Poor', 
        percentage: toPercentage(buckets.poor), 
        count: buckets.poor,
        color: '#ef4444',
      },
    ];

    res.status(200).json({
      status: 'success',
      data: {
        satisfaction,
        averageRating: rating,
        totalReviews,
        satisfactionRate: toPercentage(buckets.excellent + buckets.good),
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
      .limit(50);

    const formattedFeedback = feedbacks.map(feedback => ({
      id: feedback._id,
      client: feedback.careReceiverId?.name || feedback.userId?.name || 'Anonymous Client',
      rating: feedback.rating || 0,
      comment: feedback.comment || feedback.message || '',
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

    const pendingRequest = await CaregiverProfileChangeRequest.findOne({
      userId: req.user.id,
      status: 'pending',
    });

    res.status(200).json({
      status: 'success',
      data: {
        caregiver,
        pendingContactChange: buildPendingContactChange(pendingRequest),
      },
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
    const {
      profileImage,
      name,
      phone,
      address,
      workStartTime,
      workEndTime,
      ...caregiverData
    } = req.body;

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    let normalizedWorkStart;
    let normalizedWorkEnd;

    if (workStartTime !== undefined || workEndTime !== undefined) {
      normalizedWorkStart = normalizeWorkTime(workStartTime);
      normalizedWorkEnd = normalizeWorkTime(workEndTime);

      if (!normalizedWorkStart || !normalizedWorkEnd) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide valid working hours in HH:MM format (e.g. 09:00 and 17:00)',
        });
      }

      const workStartMinutes = parseInt(normalizedWorkStart.split(':')[0], 10) * 60
        + parseInt(normalizedWorkStart.split(':')[1], 10);
      const workEndMinutes = parseInt(normalizedWorkEnd.split(':')[0], 10) * 60
        + parseInt(normalizedWorkEnd.split(':')[1], 10);

      if (workEndMinutes <= workStartMinutes) {
        return res.status(400).json({
          status: 'error',
          message: 'Work end time must be after work start time',
        });
      }

      caregiverData.workStartTime = normalizedWorkStart;
      caregiverData.workEndTime = normalizedWorkEnd;
    }

    const existingPendingRequest = await CaregiverProfileChangeRequest.findOne({
      userId: req.user.id,
      status: 'pending',
    });

    const pendingUpdate = {
      userId: req.user.id,
      status: 'pending',
      rejectionReason: '',
      reviewedAt: undefined,
      reviewedBy: undefined,
    };
    let contactChangeSubmitted = false;

    if (phone !== undefined && !phonesEqual(phone, currentUser.phone)) {
      pendingUpdate.pendingPhone = String(phone).trim();
      contactChangeSubmitted = true;
    } else if (existingPendingRequest?.pendingPhone) {
      pendingUpdate.pendingPhone = existingPendingRequest.pendingPhone;
    }

    if (address !== undefined) {
      const normalizedAddress = normalizeAddressInput(address);
      if (normalizedAddress && !addressesEqual(normalizedAddress, currentUser.address)) {
        pendingUpdate.pendingAddress = normalizedAddress;
        contactChangeSubmitted = true;
      } else if (existingPendingRequest?.pendingAddress) {
        pendingUpdate.pendingAddress = existingPendingRequest.pendingAddress;
      }
    } else if (existingPendingRequest?.pendingAddress) {
      pendingUpdate.pendingAddress = existingPendingRequest.pendingAddress;
    }

    let pendingRequest = existingPendingRequest;
    if (contactChangeSubmitted) {
      pendingRequest = await CaregiverProfileChangeRequest.findOneAndUpdate(
        { userId: req.user.id },
        pendingUpdate,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      createNotification({
        type: 'caregiver_profile_change',
        title: 'Caregiver contact update pending',
        message: `${currentUser.name} submitted phone/address changes for approval`,
        relatedId: pendingRequest._id,
        relatedModel: 'CaregiverProfileChangeRequest',
      });
    }

    if (profileImage !== undefined || name) {
      const userUpdateData = {};
      if (profileImage !== undefined) userUpdateData.profileImage = profileImage;
      if (name) userUpdateData.name = name;

      await User.findByIdAndUpdate(req.user.id, userUpdateData, { new: true });
    }

    const caregiver = await Caregiver.findOneAndUpdate(
      { userId: req.user.id },
      caregiverData,
      { new: true, runValidators: true },
    ).populate('userId', 'name email phone address profileImage dateOfBirth emergencyContact');

    if (!caregiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Caregiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: contactChangeSubmitted
        ? 'Profile updated. Phone/address changes were submitted for admin approval.'
        : 'Profile updated successfully',
      data: {
        caregiver,
        pendingContactChange: buildPendingContactChange(pendingRequest),
        contactChangeSubmitted,
      },
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
