const Booking = require('../models/Booking.model');
const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');

// Get all bookings for caregiver (upcoming and completed)
exports.getCaregiverBookings = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { status } = req.query;

    const filter = { caregiverId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('careReceiverId', 'name email phone phoneNumber profileImage address age gender medicalHistory biography emergencyContact')
      .sort({ date: 1, startTime: 1 });

    console.log(`Found ${bookings.length} bookings for caregiver ${caregiverId}`);
    console.log('Booking statuses:', bookings.map(b => ({ id: b._id, status: b.status })));

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('Error fetching caregiver bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

// Get pending bookings for caregiver
exports.getPendingBookings = async (req, res) => {
  try {
    const caregiverId = req.user._id;

    const bookings = await Booking.find({
      caregiverId,
      status: 'pending',
    })
      .populate('careReceiverId', 'name email phone phoneNumber profileImage address age gender medicalHistory biography emergencyContact')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending bookings',
      error: error.message,
    });
  }
};

// Approve a booking
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiverId = req.user._id;

    const booking = await Booking.findOne({
      _id: id,
      caregiverId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in pending status',
      });
    }

    booking.status = 'confirmed';
    booking.responseDate = new Date();
    await booking.save();

    // TODO: Send notification to care receiver about booking approval

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving booking',
      error: error.message,
    });
  }
};

// Reject a booking
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const caregiverId = req.user._id;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      caregiverId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in pending status',
      });
    }

    booking.status = 'cancelled';
    booking.rejectionReason = rejectionReason.trim();
    booking.responseDate = new Date();
    await booking.save();

    // TODO: Send notification to care receiver about booking rejection

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting booking',
      error: error.message,
    });
  }
};

// Create a booking (for care receivers to book caregivers)
exports.createBooking = async (req, res) => {
  try {
    const careReceiverId = req.user._id;
    const {
      caregiverId,
      serviceType,
      date,
      startTime,
      endTime,
      location,
      needs,
      hourlyRate,
    } = req.body;

    // Verify caregiver exists
    const caregiver = await User.findOne({
      _id: caregiverId,
      role: 'caregiver',
    });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    const booking = await Booking.create({
      caregiverId,
      careReceiverId,
      serviceType,
      date,
      startTime,
      endTime,
      location,
      needs,
      hourlyRate,
      status: 'pending',
    });

    // TODO: Send notification to caregiver about new booking

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message,
    });
  }
};

// Mark booking as completed
exports.completeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiverId = req.user._id;

    const booking = await Booking.findOne({
      _id: id,
      caregiverId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be marked as completed',
      });
    }

    booking.status = 'completed';
    booking.completionDate = new Date();
    await booking.save();

    console.log(`Booking ${id} marked as completed by caregiver ${caregiverId}`);

    // Update caregiver booking count for commission tracking
    const caregiver = await Caregiver.findOne({ userId: caregiverId });
    if (caregiver) {
      caregiver.totalBookingsCompleted += 1;
      await caregiver.save();
    }

    res.status(200).json({
      success: true,
      message: 'Booking marked as completed',
      data: booking,
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing booking',
      error: error.message,
    });
  }
};
