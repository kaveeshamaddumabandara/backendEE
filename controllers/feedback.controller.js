const Feedback = require('../models/Feedback.model');
const User = require('../models/User.model');
const Booking = require('../models/Booking.model');
const Caregiver = require('../models/Caregiver.model');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const updateCaregiverRating = async caregiverUserId => {
  if (!caregiverUserId) return;

  const result = await Feedback.aggregate([
    {
      $match: {
        caregiverId: caregiverUserId,
        rating: { $gte: 1, $lte: 5 },
      },
    },
    {
      $group: {
        _id: '$caregiverId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRating = result[0]?.averageRating || 0;
  const totalReviews = result[0]?.totalReviews || 0;

  await Caregiver.findOneAndUpdate(
    { userId: caregiverUserId },
    {
      rating: Number(averageRating.toFixed(1)),
      totalReviews,
    },
  );
};

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, feedbackType, category, message } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!rating || !message) {
      return res.status(400).json({
        success: false,
        message: 'Rating and message are required',
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      userId,
      rating,
      feedbackType: feedbackType || 'General',
      category: category || 'Other',
      message,
      status: 'pending',
    });

    // Populate user details
    await feedback.populate('userId', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message,
    });
  }
};

// Submit care receiver review for caregiver
exports.submitCaregiverReview = async (req, res) => {
  try {
    const { caregiverName, rating, review, comment } = req.body;
    const careReceiverId = req.user.id;
    const normalizedReview = (review || comment || '').trim();
    const normalizedCaregiverName = (caregiverName || '').trim();

    if (!normalizedCaregiverName || !rating || !normalizedReview) {
      return res.status(400).json({
        success: false,
        message: 'caregiverName, rating, and review are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const caregiverUser = await User.findOne({
      role: 'caregiver',
      name: { $regex: `^${escapeRegex(normalizedCaregiverName)}$`, $options: 'i' },
      isActive: true,
    });

    if (!caregiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found with the provided name',
      });
    }

    const completedBookings = await Booking.find({
      careReceiverId,
      caregiverId: caregiverUser._id,
      status: 'completed',
    })
      .select('_id completionDate date createdAt')
      .sort({ completionDate: -1, date: -1, createdAt: -1 });

    if (!completedBookings.length) {
      return res.status(400).json({
        success: false,
        message: 'You can only review caregivers after a completed booking',
      });
    }

    const reviewedBookingIds = await Feedback.find({
      userId: careReceiverId,
      caregiverId: caregiverUser._id,
      bookingId: { $ne: null },
    }).distinct('bookingId');

    const completedBooking = completedBookings.find(
      booking => !reviewedBookingIds.some(id => String(id) === String(booking._id)),
    );

    if (!completedBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already submitted reviews for all completed bookings with this caregiver',
      });
    }

    const existingFeedback = await Feedback.findOne({
      bookingId: completedBooking._id,
      userId: careReceiverId,
    });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You already submitted a review for this caregiver booking',
      });
    }

    const feedback = await Feedback.create({
      userId: careReceiverId,
      careReceiverId,
      caregiverId: caregiverUser._id,
      caregiverName: caregiverUser.name,
      bookingId: completedBooking._id,
      rating,
      comment: normalizedReview,
      message: normalizedReview,
      feedbackType: 'General',
      category: 'Service Quality',
      status: 'pending',
    });

    await updateCaregiverRating(caregiverUser._id);

    await feedback.populate('userId', 'name email role');
    await feedback.populate('caregiverId', 'name email');
    await feedback.populate('careReceiverId', 'name email');
    await feedback.populate('bookingId', 'date serviceType status');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error submitting caregiver review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit caregiver review',
      error: error.message,
    });
  }
};

// Submit review for a specific booking
exports.submitBookingReview = async (req, res) => {
  try {
    const { bookingId, rating, review, comment } = req.body;
    const careReceiverId = req.user.id;
    const normalizedReview = (review || comment || '').trim();

    if (!bookingId || !rating || !normalizedReview) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, rating, and review are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      careReceiverId,
    }).populate('caregiverId', 'name role isActive');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings',
      });
    }

    if (!booking.caregiverId || booking.caregiverId.role !== 'caregiver') {
      return res.status(400).json({
        success: false,
        message: 'Booking caregiver is invalid',
      });
    }

    const existingFeedback = await Feedback.findOne({
      bookingId,
      userId: careReceiverId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You already submitted a review for this booking',
      });
    }

    const feedback = await Feedback.create({
      userId: careReceiverId,
      careReceiverId,
      caregiverId: booking.caregiverId._id,
      caregiverName: booking.caregiverId.name,
      bookingId: booking._id,
      rating,
      comment: normalizedReview,
      message: normalizedReview,
      feedbackType: 'General',
      category: 'Service Quality',
      status: 'pending',
    });

    await updateCaregiverRating(booking.caregiverId._id);

    await feedback.populate('userId', 'name email role');
    await feedback.populate('caregiverId', 'name email');
    await feedback.populate('careReceiverId', 'name email');
    await feedback.populate('bookingId', 'date serviceType status');

    return res.status(201).json({
      success: true,
      message: 'Booking review submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error submitting booking review:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit booking review',
      error: error.message,
    });
  }
};

// Get booking review for the logged-in care receiver
exports.getMyBookingReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const careReceiverId = req.user.id;

    const feedback = await Feedback.findOne({
      bookingId,
      userId: careReceiverId,
      caregiverId: { $exists: true, $ne: null },
    })
      .populate('caregiverId', 'name email profileImage')
      .populate('bookingId', 'date serviceType status');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'No review found for this booking',
      });
    }

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error fetching booking review:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking review',
      error: error.message,
    });
  }
};

// Update booking review for the logged-in care receiver
exports.updateMyBookingReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, review, comment } = req.body;
    const careReceiverId = req.user.id;
    const normalizedReview = (review || comment || '').trim();

    if (!rating || !normalizedReview) {
      return res.status(400).json({
        success: false,
        message: 'rating and review are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const feedback = await Feedback.findOne({
      bookingId,
      userId: careReceiverId,
      caregiverId: { $exists: true, $ne: null },
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'No review found for this booking',
      });
    }

    feedback.rating = rating;
    feedback.comment = normalizedReview;
    feedback.message = normalizedReview;
    await feedback.save();

    await updateCaregiverRating(feedback.caregiverId);

    await feedback.populate('userId', 'name email role');
    await feedback.populate('caregiverId', 'name email');
    await feedback.populate('careReceiverId', 'name email');
    await feedback.populate('bookingId', 'date serviceType status');

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error updating booking review:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking review',
      error: error.message,
    });
  }
};

// Get care receiver's caregiver reviews
exports.getMyCaregiverReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const feedbacks = await Feedback.find({
      userId,
      caregiverId: { $exists: true, $ne: null },
    })
      .populate('caregiverId', 'name email profileImage')
      .populate('careReceiverId', 'name email')
      .populate('bookingId', 'date serviceType status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching caregiver reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch caregiver reviews',
      error: error.message,
    });
  }
};

// Get all feedbacks (Admin only)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { status, rating, category, search } = req.query;

    // Build query
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    // Fetch feedbacks with user details
    let feedbacks = await Feedback.find(query)
      .populate('userId', 'name email role phone')
      .populate('caregiverId', 'name email')
      .populate('careReceiverId', 'name email')
      .populate('bookingId', 'date serviceType status')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      feedbacks = feedbacks.filter(feedback => 
        (feedback.userId?.name || '').toLowerCase().includes(searchLower) ||
        (feedback.userId?.email || '').toLowerCase().includes(searchLower) ||
        (feedback.caregiverId?.name || '').toLowerCase().includes(searchLower) ||
        (feedback.caregiverName || '').toLowerCase().includes(searchLower) ||
        (feedback.message || '').toLowerCase().includes(searchLower) ||
        (feedback.comment || '').toLowerCase().includes(searchLower)
      );
    }

    // Calculate statistics
    const stats = {
      total: feedbacks.length,
      pending: feedbacks.filter(f => f.status === 'pending').length,
      reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
      resolved: feedbacks.filter(f => f.status === 'resolved').length,
      avgRating: feedbacks.length > 0 
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0,
    };

    res.status(200).json({
      success: true,
      data: feedbacks,
      stats,
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message,
    });
  }
};

// Get feedback by ID (Admin only)
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id)
      .populate('userId', 'name email role phone')
      .populate('caregiverId', 'name email')
      .populate('careReceiverId', 'name email')
      .populate('bookingId', 'date serviceType status')
      .populate('reviewedBy', 'name email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message,
    });
  }
};

// Update feedback status (Admin only)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    // Update feedback
    feedback.status = status;
    if (adminNotes) {
      feedback.adminNotes = adminNotes;
    }
    
    if (status === 'reviewed' || status === 'resolved') {
      feedback.reviewedBy = adminId;
      feedback.reviewedAt = new Date();
    }

    await feedback.save();
    await feedback.populate('userId', 'name email role');
    await feedback.populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
      error: error.message,
    });
  }
};

// Get user's own feedbacks
exports.getMyFeedbacks = async (req, res) => {
  try {
    const userId = req.user.id;

    const feedbacks = await Feedback.find({ userId })
      .populate('caregiverId', 'name email')
      .populate('bookingId', 'date serviceType status')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching user feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message,
    });
  }
};

// Delete feedback (Admin only)
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message,
    });
  }
};

// Get feedback statistics (Admin only)
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedbacks = await Feedback.countDocuments();
    const pendingFeedbacks = await Feedback.countDocuments({ status: 'pending' });
    const reviewedFeedbacks = await Feedback.countDocuments({ status: 'reviewed' });
    const resolvedFeedbacks = await Feedback.countDocuments({ status: 'resolved' });

    // Calculate average rating
    const feedbacks = await Feedback.find();
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;

    // Get rating distribution
    const ratingDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    // Get category distribution
    const categoryDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalFeedbacks,
        pending: pendingFeedbacks,
        reviewed: reviewedFeedbacks,
        resolved: resolvedFeedbacks,
        avgRating,
        ratingDistribution,
        categoryDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message,
    });
  }
};
