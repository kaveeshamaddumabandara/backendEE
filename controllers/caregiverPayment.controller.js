const Payment = require('../models/Payment.model');
const Caregiver = require('../models/Caregiver.model');
const User = require('../models/User.model');

// @desc    Get registration fee details
// @route   GET /api/caregiver/payment/registration-fee
// @access  Private/Caregiver
exports.getRegistrationFeeDetails = async (req, res) => {
  try {
    const caregiverId = req.user._id;

    const user = await User.findById(caregiverId);
    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        registrationFeePaid: caregiver.registrationFeePaid,
        registrationFeeAmount: caregiver.registrationFeeAmount,
        approvalStatus: user.approvalStatus,
        canMakePayment: user.approvalStatus === 'approved' && !caregiver.registrationFeePaid,
      },
    });
  } catch (error) {
    console.error('Error fetching registration fee details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration fee details',
      error: error.message,
    });
  }
};

// @desc    Process registration fee payment
// @route   POST /api/caregiver/payment/registration-fee
// @access  Private/Caregiver
exports.processRegistrationFeePayment = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { paymentMethod, transactionReference } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    const user = await User.findById(caregiverId);
    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found',
      });
    }

    // Check if already paid
    if (caregiver.registrationFeePaid) {
      return res.status(400).json({
        success: false,
        message: 'Registration fee already paid',
      });
    }

    // Check if approved
    if (user.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Your account must be approved by admin before making payment',
      });
    }

    // Generate transaction ID
    const transactionId = transactionReference || Payment.generateTransactionId();

    // Create payment record
    const payment = await Payment.create({
      userId: caregiverId,
      caregiverId: caregiver._id,
      amount: caregiver.registrationFeeAmount,
      currency: 'LKR',
      paymentMethod,
      status: 'completed', // In production, this would be 'pending' until payment gateway confirms
      transactionId,
      description: 'Caregiver Registration Fee',
      serviceType: 'Subscription',
      paymentType: 'registration_fee',
      paidTo: 'admin',
    });

    // Update caregiver status
    caregiver.registrationFeePaid = true;
    caregiver.registrationFeePaymentId = payment._id;
    await caregiver.save();

    // Activate user account
    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Registration fee payment processed successfully. Your account is now active!',
      data: {
        payment,
        caregiver,
      },
    });
  } catch (error) {
    console.error('Error processing registration fee payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

// @desc    Get commission payment status
// @route   GET /api/caregiver/payment/commission-status
// @access  Private/Caregiver
exports.getCommissionStatus = async (req, res) => {
  try {
    const caregiverId = req.user._id;

    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found',
      });
    }

    const bookingsSinceLastPayment = 
      caregiver.totalBookingsCompleted - (caregiver.lastCommissionPaymentBookingCount || 0);
    
    const commissionDue = Math.floor(bookingsSinceLastPayment / 20) * caregiver.commissionRate;
    const bookingsUntilNextPayment = 20 - (bookingsSinceLastPayment % 20);
    const requiresPayment = bookingsSinceLastPayment >= 20;

    res.status(200).json({
      success: true,
      data: {
        totalBookingsCompleted: caregiver.totalBookingsCompleted,
        bookingsSinceLastPayment,
        commissionRate: caregiver.commissionRate,
        commissionDue,
        bookingsUntilNextPayment,
        requiresPayment,
        lastCommissionPaymentDate: caregiver.lastCommissionPaymentDate,
        paymentHistory: caregiver.commissionPaymentHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching commission status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching commission status',
      error: error.message,
    });
  }
};

// @desc    Process commission payment
// @route   POST /api/caregiver/payment/commission
// @access  Private/Caregiver
exports.processCommissionPayment = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { paymentMethod, transactionReference } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found',
      });
    }

    const bookingsSinceLastPayment = 
      caregiver.totalBookingsCompleted - (caregiver.lastCommissionPaymentBookingCount || 0);

    if (bookingsSinceLastPayment < 20) {
      return res.status(400).json({
        success: false,
        message: 'Commission payment not due yet. Complete at least 20 bookings.',
      });
    }

    const bookingsToPay = Math.floor(bookingsSinceLastPayment / 20) * 20;
    const commissionAmount = (bookingsToPay / 20) * caregiver.commissionRate;

    // Generate transaction ID
    const transactionId = transactionReference || Payment.generateTransactionId();

    // Create payment record
    const payment = await Payment.create({
      userId: caregiverId,
      caregiverId: caregiver._id,
      amount: commissionAmount,
      currency: 'LKR',
      paymentMethod,
      status: 'completed',
      transactionId,
      description: `Booking Commission Fee - ${bookingsToPay} bookings`,
      serviceType: 'Subscription',
      paymentType: 'booking_commission',
      paidTo: 'admin',
      bookingCount: bookingsToPay,
    });

    // Update caregiver commission tracking
    caregiver.lastCommissionPaymentDate = new Date();
    caregiver.lastCommissionPaymentBookingCount = caregiver.totalBookingsCompleted;
    caregiver.commissionPaymentHistory.push({
      paymentId: payment._id,
      amount: commissionAmount,
      bookingCount: bookingsToPay,
      paidAt: new Date(),
    });

    await caregiver.save();

    res.status(200).json({
      success: true,
      message: 'Commission payment processed successfully!',
      data: {
        payment,
        bookingsPaid: bookingsToPay,
        amountPaid: commissionAmount,
      },
    });
  } catch (error) {
    console.error('Error processing commission payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

// @desc    Get payment history
// @route   GET /api/caregiver/payment/history
// @access  Private/Caregiver
exports.getPaymentHistory = async (req, res) => {
  try {
    const caregiverId = req.user._id;

    const payments = await Payment.find({
      userId: caregiverId,
      paidTo: 'admin',
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message,
    });
  }
};

// @desc    Get payment analytics
// @route   GET /api/caregiver/payment/analytics
// @access  Private/Caregiver
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const caregiverId = req.user._id;

    // Get all payments
    const payments = await Payment.find({
      userId: caregiverId,
      paidTo: 'admin',
      status: 'completed',
    }).sort({ createdAt: -1 });

    // Calculate total payments
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Group by payment type
    const paymentByType = payments.reduce((acc, payment) => {
      const type = payment.paymentType || 'other';
      acc[type] = (acc[type] || 0) + payment.amount;
      return acc;
    }, {});

    // Get monthly data for last 6 months
    const monthlyData = {};
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      const monthLabel = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
      last6Months.push({ key: monthKey, label: monthLabel });
      monthlyData[monthKey] = 0;
    }

    payments.forEach(payment => {
      const monthKey = new Date(payment.createdAt).toISOString().substring(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += payment.amount;
      }
    });

    const monthlyPayments = last6Months.map(month => ({
      month: month.label,
      amount: monthlyData[month.key],
    }));

    // Get payment method distribution
    const paymentByMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Recent payments (last 10)
    const recentPayments = payments.slice(0, 10).map(payment => ({
      id: payment._id,
      amount: payment.amount,
      type: payment.paymentType,
      method: payment.paymentMethod,
      date: payment.createdAt,
      description: payment.description,
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPaid,
          totalTransactions: payments.length,
          paymentByType,
          averagePayment: payments.length > 0 ? totalPaid / payments.length : 0,
        },
        monthlyPayments,
        paymentByMethod,
        recentPayments,
      },
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment analytics',
      error: error.message,
    });
  }
};

// @desc    Update booking count (called when booking is completed)
// @route   POST /api/caregiver/payment/update-booking-count
// @access  Private/Caregiver
exports.updateBookingCount = async (req, res) => {
  try {
    const caregiverId = req.user._id;

    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found',
      });
    }

    caregiver.totalBookingsCompleted += 1;
    await caregiver.save();

    const bookingsSinceLastPayment = 
      caregiver.totalBookingsCompleted - (caregiver.lastCommissionPaymentBookingCount || 0);
    
    const requiresCommissionPayment = bookingsSinceLastPayment >= 5;

    res.status(200).json({
      success: true,
      message: 'Booking count updated',
      data: {
        totalBookingsCompleted: caregiver.totalBookingsCompleted,
        bookingsSinceLastPayment,
        requiresCommissionPayment,
      },
    });
  } catch (error) {
    console.error('Error updating booking count:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking count',
      error: error.message,
    });
  }
};
