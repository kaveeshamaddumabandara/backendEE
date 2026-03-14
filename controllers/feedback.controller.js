const Feedback = require('../models/Feedback.model');
const User = require('../models/User.model');

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
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      feedbacks = feedbacks.filter(feedback => 
        feedback.userId.name.toLowerCase().includes(searchLower) ||
        feedback.userId.email.toLowerCase().includes(searchLower) ||
        feedback.message.toLowerCase().includes(searchLower)
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
