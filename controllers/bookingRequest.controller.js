const BookingRequest = require('../models/BookingRequest.model');
const Booking = require('../models/Booking.model');
const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');

// @desc    Get all pending requests for a caregiver
// @route   GET /api/caregiver/pending-requests
// @access  Private (Caregiver)
exports.getPendingRequests = async (req, res) => {
  try {
    const caregiverId = req.user._id;

    const pendingRequests = await BookingRequest.find({
      caregiverId,
      status: 'pending',
    })
      .populate('careReceiverId', 'name email phone profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      data: pendingRequests,
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: error.message,
    });
  }
};

// @desc    Approve a booking request
// @route   POST /api/caregiver/requests/:id/approve
// @access  Private (Caregiver)
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiverId = req.user._id;

    // Find the request
    const request = await BookingRequest.findOne({
      _id: id,
      caregiverId,
      status: 'pending',
    }).populate('careReceiverId', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found or already processed',
      });
    }

    // Update request status
    request.status = 'approved';
    request.responseDate = new Date();
    await request.save();

    // Create actual booking entry
    const booking = await Booking.create({
      caregiverId: request.caregiverId,
      careReceiverId: request.careReceiverId,
      serviceType: request.serviceType,
      date: request.requestedDate,
      startTime: request.startTime,
      endTime: request.endTime,
      duration: Number(request.duration) > 0 ? Number(request.duration) : 1,
      location: request.location,
      needs: request.specialNeeds,
      hourlyRate: request.hourlyRate,
      totalAmount: request.totalAmount,
      status: 'confirmed',
    });

    // TODO: Send notification/email to care receiver

    res.status(200).json({
      success: true,
      message: 'Booking request approved successfully',
      data: {
        request,
        booking,
      },
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving request',
      error: error.message,
    });
  }
};

// @desc    Reject a booking request
// @route   POST /api/caregiver/requests/:id/reject
// @access  Private (Caregiver)
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const caregiverId = req.user._id;

    // Validate rejection reason
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Find the request
    const request = await BookingRequest.findOne({
      _id: id,
      caregiverId,
      status: 'pending',
    }).populate('careReceiverId', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found or already processed',
      });
    }

    // Update request status
    request.status = 'rejected';
    request.rejectionReason = rejectionReason.trim();
    request.responseDate = new Date();
    await request.save();

    // TODO: Send notification/email to care receiver with rejection reason

    res.status(200).json({
      success: true,
      message: 'Booking request rejected successfully',
      data: request,
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: error.message,
    });
  }
};

// @desc    Get all requests (pending, approved, rejected) for caregiver
// @route   GET /api/caregiver/requests
// @access  Private (Caregiver)
exports.getAllRequests = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { status } = req.query;

    const filter = { caregiverId };
    if (status) {
      filter.status = status;
    }

    const requests = await BookingRequest.find(filter)
      .populate('careReceiverId', 'name email phone profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message,
    });
  }
};

// @desc    Create a booking request (for care receiver)
// @route   POST /api/carereceiver/booking-request
// @access  Private (Care Receiver)
exports.createBookingRequest = async (req, res) => {
  try {
    const {
      caregiverId,
      serviceType,
      requestedDate,
      startTime,
      endTime,
      duration,
      location,
      specialNeeds,
      hourlyRate,
    } = req.body;

    const careReceiverId = req.user._id;

    // Validate caregiver exists (supports both User._id and Caregiver._id from mobile list)
    let caregiverUser = await User.findOne({ _id: caregiverId, role: 'caregiver' });
    let caregiverUserId = caregiverId;

    if (!caregiverUser) {
      const caregiverProfile = await Caregiver.findById(caregiverId).populate('userId', '_id role');
      if (caregiverProfile?.userId?._id) {
        caregiverUserId = caregiverProfile.userId._id;
        caregiverUser = await User.findOne({ _id: caregiverUserId, role: 'caregiver' });
      }
    }

    if (!caregiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    const normalizedDuration = Number(duration) > 0 ? Number(duration) : 1;
    const normalizedHourlyRate = Number(hourlyRate);
    const computedTotalAmount = Number((normalizedHourlyRate * normalizedDuration).toFixed(2));

    if (Number.isNaN(normalizedHourlyRate) || normalizedHourlyRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be a non-negative number',
      });
    }

    if (Number.isNaN(computedTotalAmount) || computedTotalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate total amount for booking request',
      });
    }

    // Create booking request
    const bookingRequest = await BookingRequest.create({
      caregiverId: caregiverUserId,
      careReceiverId,
      serviceType,
      requestedDate,
      startTime,
      endTime,
      duration: normalizedDuration,
      location,
      specialNeeds: specialNeeds || '',
      hourlyRate: normalizedHourlyRate,
      totalAmount: computedTotalAmount,
      status: 'pending',
    });

    const populatedRequest = await BookingRequest.findById(bookingRequest._id)
      .populate('caregiverId', 'name email phone')
      .populate('careReceiverId', 'name email phone profileImage');

    // TODO: Send notification to caregiver

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully',
      data: populatedRequest,
    });
  } catch (error) {
    console.error('Error creating booking request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking request',
      error: error.message,
    });
  }
};
