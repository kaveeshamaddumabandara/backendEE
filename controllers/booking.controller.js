const Booking = require('../models/Booking.model');
const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');
const Payment = require('../models/Payment.model');
const Feedback = require('../models/Feedback.model');
const Stripe = require('stripe');
const sendEmail = require('../utils/sendEmail');
const createNotification = require('../utils/createNotification');
const { getDayRange, hasBookingOverlap, isBookingDateAllowed, isWithinWorkingHours, parseCalendarDate } = require('../utils/bookingOverlap');

const BLOCKING_BOOKING_STATUSES = ['pending', 'confirmed', 'completed'];

const findCaregiverBookingConflict = async (caregiverUserId, date, startTime, endTime) => {
  const dayRange = getDayRange(date);
  const existingBookings = await Booking.find({
    caregiverId: caregiverUserId,
    status: { $in: BLOCKING_BOOKING_STATUSES },
    date: { $gte: dayRange.start, $lte: dayRange.end },
  }).select('startTime endTime duration status');

  return hasBookingOverlap(startTime, endTime, existingBookings);
};

const validateCaregiverWorkingHours = async (caregiverUserId, startTime, endTime) => {
  const caregiverProfile = await Caregiver.findOne({ userId: caregiverUserId }).select(
    'workStartTime workEndTime',
  );

  if (
    caregiverProfile?.workStartTime &&
    caregiverProfile?.workEndTime &&
    !isWithinWorkingHours(
      startTime,
      endTime,
      caregiverProfile.workStartTime,
      caregiverProfile.workEndTime,
    )
  ) {
    return caregiverProfile;
  }

  return null;
};

let stripeClient;

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

const normalizeBookingPayload = payload => {
  const {
    serviceType,
    date,
    startTime,
    endTime,
    time,
    duration,
    location,
    needs,
    notes,
    hourlyRate,
  } = payload;

  const normalizedServiceTypeMap = {
    'General Care': 'Personal Care',
    'Medical Care': 'Medical Support',
    Companionship: 'Companionship',
    'Personal Care': 'Personal Care',
  };

  const normalizedServiceType = normalizedServiceTypeMap[serviceType] || serviceType;
  const normalizedStartTime = startTime || time;
  const normalizedEndTime = endTime || normalizedStartTime;
  const normalizedDuration = Number(duration) > 0 ? Number(duration) : 1;
  const normalizedHourlyRate = Number(hourlyRate);
  const computedTotalAmount = Number((normalizedHourlyRate * normalizedDuration).toFixed(2));
  const normalizedNeeds = (typeof needs === 'string' && needs.trim())
    ? needs.trim()
    : (typeof notes === 'string' ? notes.trim() : '');

  return {
    normalizedServiceType,
    normalizedStartTime,
    normalizedEndTime,
    normalizedDuration,
    normalizedHourlyRate,
    computedTotalAmount,
    normalizedNeeds,
    date: parseCalendarDate(date) || date,
    location,
  };
};

const resolveCaregiverUser = async caregiverId => {
  let caregiverUser = await User.findOne({
    _id: caregiverId,
    role: 'caregiver',
  });

  let caregiverUserId = caregiverId;
  if (!caregiverUser) {
    const caregiverProfile = await Caregiver.findById(caregiverId).populate('userId', '_id role');
    if (caregiverProfile?.userId?._id) {
      caregiverUserId = caregiverProfile.userId._id;
      caregiverUser = await User.findOne({
        _id: caregiverUserId,
        role: 'caregiver',
      });
    }
  }

  return { caregiverUser, caregiverUserId };
};

// Create Stripe payment intent for booking advance payment
exports.createBookingPaymentIntent = async (req, res) => {
  try {
    const careReceiverId = req.user._id;
    const { caregiverId } = req.body;

    const {
      normalizedServiceType,
      normalizedStartTime,
      normalizedEndTime,
      normalizedDuration,
      normalizedHourlyRate,
      computedTotalAmount,
      normalizedNeeds,
      date,
      location,
    } = normalizeBookingPayload(req.body);

    if (!caregiverId || !normalizedServiceType || !date || !normalizedStartTime || !normalizedEndTime || !location || Number.isNaN(normalizedHourlyRate)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for booking payment',
      });
    }

    if (normalizedHourlyRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be a non-negative number',
      });
    }

    if (Number.isNaN(computedTotalAmount) || computedTotalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate total amount for booking',
      });
    }

    if (!isBookingDateAllowed(date)) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be made from tomorrow onwards',
      });
    }

    const { caregiverUser, caregiverUserId } = await resolveCaregiverUser(caregiverId);

    if (!caregiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    const conflictingBooking = await findCaregiverBookingConflict(
      caregiverUserId,
      date,
      normalizedStartTime,
      normalizedEndTime,
    );

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This caregiver is already booked for the selected time slot. Please choose a different time.',
        data: {
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
        },
      });
    }

    const outsideWorkingHours = await validateCaregiverWorkingHours(
      caregiverUserId,
      normalizedStartTime,
      normalizedEndTime,
    );

    if (outsideWorkingHours) {
      return res.status(400).json({
        success: false,
        message: `Booking must be within caregiver working hours (${outsideWorkingHours.workStartTime} - ${outsideWorkingHours.workEndTime})`,
      });
    }

    const advanceAmount = Number((computedTotalAmount * 0.5).toFixed(2));
    const remainingAmount = Number((computedTotalAmount - advanceAmount).toFixed(2));
    const stripeAmount = Math.round(advanceAmount * 100);

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: 'lkr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'mobile_booking_advance',
        careReceiverId: String(careReceiverId),
        caregiverId: String(caregiverUserId),
        serviceType: String(normalizedServiceType),
        date: String(date),
        startTime: String(normalizedStartTime),
        endTime: String(normalizedEndTime),
        duration: String(normalizedDuration),
        location: String(location),
        needs: String(normalizedNeeds || ''),
        hourlyRate: String(normalizedHourlyRate),
        totalAmount: String(computedTotalAmount),
        advanceAmount: String(advanceAmount),
        remainingAmount: String(remainingAmount),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Booking payment intent created successfully',
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        totalAmount: computedTotalAmount,
        advanceAmount,
        remainingAmount,
      },
    });
  } catch (error) {
    console.error('Error creating booking payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking payment intent',
      error: error.message,
    });
  }
};

// Get booked time slots for a caregiver on a specific date
exports.getCaregiverBookedSlots = async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    const { caregiverUser, caregiverUserId } = await resolveCaregiverUser(caregiverId);

    if (!caregiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    const dayRange = getDayRange(date);
    const bookings = await Booking.find({
      caregiverId: caregiverUserId,
      status: { $in: BLOCKING_BOOKING_STATUSES },
      date: { $gte: dayRange.start, $lte: dayRange.end },
    })
      .select('startTime endTime duration status')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map(booking => ({
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        status: booking.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching caregiver booked slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching caregiver booked slots',
      error: error.message,
    });
  }
};

// Get all bookings for care receiver
exports.getCareReceiverBookings = async (req, res) => {
  try {
    const careReceiverId = req.user._id;
    const { status } = req.query;

    const filter = { careReceiverId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('caregiverId', 'name email phone phoneNumber profileImage')
      .sort({ date: -1, startTime: 1 });

    const bookingIds = bookings.map(booking => booking._id);
    const reviewedBookingIds = await Feedback.find({
      userId: careReceiverId,
      bookingId: { $in: bookingIds },
    }).distinct('bookingId');

    const reviewedBookingIdSet = new Set(reviewedBookingIds.map(id => String(id)));
    const enrichedBookings = bookings.map(booking => {
      const hasReview = reviewedBookingIdSet.has(String(booking._id));
      return {
        ...booking.toObject(),
        hasReview,
        canReview: booking.status === 'completed' && !hasReview,
      };
    });

    console.log(`Found ${bookings.length} bookings for care receiver ${careReceiverId}`);

    res.status(200).json({
      success: true,
      count: enrichedBookings.length,
      data: enrichedBookings,
    });
  } catch (error) {
    console.error('Error fetching care receiver bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

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

    // Block approval when the 20-booking flat fee is unpaid
    const caregiver = await Caregiver.findOne({ userId: caregiverId });
    if (caregiver) {
      const bookingsSinceLastPayment =
        caregiver.totalBookingsCompleted - (caregiver.lastCommissionPaymentBookingCount || 0);
      if (bookingsSinceLastPayment >= 20) {
        return res.status(403).json({
          success: false,
          message:
            'You have an outstanding flat fee of LKR 1,000 due after completing 20 bookings. Please pay the fee from the Payments section before accepting new bookings.',
        });
      }
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
      paymentIntentId,
    } = req.body;

    const {
      normalizedServiceType,
      normalizedStartTime,
      normalizedEndTime,
      normalizedDuration,
      normalizedHourlyRate,
      computedTotalAmount,
      normalizedNeeds,
      date,
      location,
    } = normalizeBookingPayload(req.body);

    if (!caregiverId || !normalizedServiceType || !date || !normalizedStartTime || !normalizedEndTime || !location || Number.isNaN(normalizedHourlyRate)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for booking creation',
      });
    }

    if (normalizedHourlyRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Hourly rate must be a non-negative number',
      });
    }

    if (Number.isNaN(computedTotalAmount) || computedTotalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate total amount for booking',
      });
    }

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Advance payment is required before booking confirmation',
      });
    }

    if (!isBookingDateAllowed(date)) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be made from tomorrow onwards',
      });
    }

    const { caregiverUser, caregiverUserId } = await resolveCaregiverUser(caregiverId);

    if (!caregiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    const conflictingBooking = await findCaregiverBookingConflict(
      caregiverUserId,
      date,
      normalizedStartTime,
      normalizedEndTime,
    );

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This caregiver is already booked for the selected time slot. Please choose a different time.',
        data: {
          startTime: conflictingBooking.startTime,
          endTime: conflictingBooking.endTime,
        },
      });
    }

    const outsideWorkingHours = await validateCaregiverWorkingHours(
      caregiverUserId,
      normalizedStartTime,
      normalizedEndTime,
    );

    if (outsideWorkingHours) {
      return res.status(400).json({
        success: false,
        message: `Booking must be within caregiver working hours (${outsideWorkingHours.workStartTime} - ${outsideWorkingHours.workEndTime})`,
      });
    }

    const existingPayment = await Payment.findOne({
      userId: careReceiverId,
      transactionId: paymentIntentId,
      status: 'completed',
      paymentType: 'service_payment',
    });

    if (existingPayment) {
      const existingBooking = existingPayment.bookingId
        ? await Booking.findById(existingPayment.bookingId)
        : null;

      return res.status(200).json({
        success: true,
        message: 'Booking was already created for this payment',
        data: existingBooking || null,
      });
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Advance payment is not completed',
      });
    }

    if (paymentIntent.metadata?.careReceiverId !== String(careReceiverId)) {
      return res.status(403).json({
        success: false,
        message: 'Payment does not belong to the logged-in user',
      });
    }

    const expectedAdvanceAmount = Number((computedTotalAmount * 0.5).toFixed(2));
    const receivedAdvanceAmount = Number(((paymentIntent.amount_received || 0) / 100).toFixed(2));

    if (Math.abs(receivedAdvanceAmount - expectedAdvanceAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch with booking advance amount',
      });
    }

    const remainingAmount = Number((computedTotalAmount - expectedAdvanceAmount).toFixed(2));

    const booking = await Booking.create({
      caregiverId: caregiverUserId,
      careReceiverId,
      serviceType: normalizedServiceType,
      date,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      duration: normalizedDuration,
      location,
      needs: normalizedNeeds,
      notes: normalizedNeeds,
      hourlyRate: normalizedHourlyRate,
      totalAmount: computedTotalAmount,
      advanceAmount: expectedAdvanceAmount,
      remainingAmount,
      advancePaymentStatus: 'completed',
      remainingPaymentStatus: 'pending_physical',
      advancePaymentIntentId: paymentIntent.id,
      advancePaidAt: new Date(),
      status: 'pending',
    });

    await Payment.create({
      userId: careReceiverId,
      amount: expectedAdvanceAmount,
      currency: 'LKR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: paymentIntent.id,
      description: `Booking advance payment (50%) - ${normalizedServiceType}`,
      serviceType: 'Hourly Care',
      paymentType: 'service_payment',
      paidTo: 'platform',
      bookingCount: 1,
      bookingId: booking._id,
      metadata: {
        paymentGateway: 'stripe',
        paymentPhase: 'advance_50',
        caregiverUserId: String(caregiverUserId),
        bookingId: String(booking._id),
        totalAmount: String(computedTotalAmount),
        remainingAmount: String(remainingAmount),
      },
    });

    // TODO: Send notification to caregiver about new booking

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        ...booking.toObject(),
        totalAmount: booking.totalAmount,
        computedFrom: {
          hourlyRate: normalizedHourlyRate,
          duration: normalizedDuration,
          formula: `${normalizedHourlyRate} x ${normalizedDuration}`,
        },
      },
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

    createNotification({
      type: 'booking_completed',
      title: 'Booking Completed',
      message: `A ${booking.serviceType} booking has been marked as completed by caregiver.`,
      relatedId: booking._id,
      relatedModel: 'Booking',
    });

    // Update caregiver booking count for commission tracking
    const caregiver = await Caregiver.findOne({ userId: caregiverId });
    if (caregiver) {
      caregiver.totalBookingsCompleted += 1;
      await caregiver.save();
    }

    const [careReceiverUser, caregiverUser] = await Promise.all([
      User.findById(booking.careReceiverId).select('name email'),
      User.findById(caregiverId).select('name'),
    ]);

    if (careReceiverUser?.email) {
      const completionDateText = booking.completionDate
        ? new Date(booking.completionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US');

      await sendEmail({
        email: careReceiverUser.email,
        subject: 'Your CareConnect Booking is Completed',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2 style="margin-bottom: 8px;">Booking Completed</h2>
            <p>Hi ${careReceiverUser.name || 'there'},</p>
            <p>Your booking for <strong>${booking.serviceType}</strong> has been marked as completed by caregiver <strong>${caregiverUser?.name || 'your caregiver'}</strong>.</p>
            <p><strong>Completed on:</strong> ${completionDateText}</p>
            <p>You can now open <strong>My Bookings</strong> in the app and submit your rating and review for this booking.</p>
            <p>Thank you for using CareConnect.</p>
          </div>
        `,
        text: `Hi ${careReceiverUser.name || 'there'}, your booking for ${booking.serviceType} has been marked as completed by ${caregiverUser?.name || 'your caregiver'}. You can now submit your review from My Bookings in the app.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking marked as completed. Care receiver notification sent.',
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
