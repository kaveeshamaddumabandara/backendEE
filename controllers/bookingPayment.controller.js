const Booking = require('../models/Booking.model');
const Payment = require('../models/Payment.model');

// @desc    Mark remaining booking payment as received (physical)
// @route   POST /api/caregiver/bookings/:id/remaining-payment
// @access  Private/Caregiver
exports.markRemainingPaymentReceivedByCaregiver = async (req, res) => {
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

    if (booking.advancePaymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Advance online payment is not completed for this booking',
      });
    }

    if (booking.remainingPaymentStatus === 'completed_physical') {
      return res.status(400).json({
        success: false,
        message: 'Remaining physical payment is already marked as completed',
      });
    }

    booking.remainingPaymentStatus = 'completed_physical';
    await booking.save();

    const existingRemainingPayment = await Payment.findOne({
      bookingId: booking._id,
      status: 'completed',
      paymentType: 'service_payment',
      'metadata.paymentPhase': 'remaining_50',
    });

    if (!existingRemainingPayment) {
      await Payment.create({
        userId: booking.careReceiverId,
        amount: booking.remainingAmount,
        currency: 'LKR',
        paymentMethod: 'Cash',
        status: 'completed',
        transactionId: Payment.generateTransactionId(),
        description: `Booking remaining payment (50%) - ${booking.serviceType}`,
        serviceType: 'Hourly Care',
        paymentType: 'service_payment',
        paidTo: 'caregiver',
        bookingCount: 1,
        bookingId: booking._id,
        metadata: {
          paymentGateway: 'physical',
          paymentPhase: 'remaining_50',
          caregiverUserId: String(booking.caregiverId),
          careReceiverUserId: String(booking.careReceiverId),
          markedByCaregiverId: String(caregiverId),
          bookingId: String(booking._id),
          totalAmount: String(booking.totalAmount),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Remaining physical payment marked successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error recording remaining booking payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error recording remaining booking payment',
      error: error.message,
    });
  }
};
