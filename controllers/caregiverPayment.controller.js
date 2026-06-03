const Payment = require('../models/Payment.model');
const Caregiver = require('../models/Caregiver.model');
const User = require('../models/User.model');
const Stripe = require('stripe');

const REGISTRATION_FEE_LKR = 1000;
const FLAT_FEE_PER_CYCLE_LKR = 1000; // flat fee charged every 20 completed bookings

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

// @desc    Get registration fee details
// @route   GET /api/caregiver/payment/registration-fee
// @access  Private/Caregiver
exports.getRegistrationFeeDetails = async (req, res) => {
  try {
    const caregiverId = req.user._id;

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
        registrationFeeAmount: REGISTRATION_FEE_LKR,
        canMakePayment: !caregiver.registrationFeePaid,
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
exports.createRegistrationFeePaymentIntent = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const user = await User.findById(caregiverId);
    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver || !user) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found',
      });
    }

    if (caregiver.registrationFeePaid) {
      return res.status(400).json({
        success: false,
        message: 'Registration fee already paid',
      });
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: REGISTRATION_FEE_LKR * 100,
      currency: 'lkr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'caregiver_registration_fee',
        caregiverUserId: String(caregiverId),
        caregiverName: String(user.name || ''),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Registration fee payment intent created successfully',
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: REGISTRATION_FEE_LKR,
      },
    });
  } catch (error) {
    console.error('Error creating registration fee payment intent:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating registration payment intent',
      error: error.message,
    });
  }
};

exports.processRegistrationFeePayment = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId is required',
      });
    }

    const user = await User.findById(caregiverId);
    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver || !user) {
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

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Stripe payment is not completed',
      });
    }

    if (paymentIntent.metadata?.caregiverUserId !== String(caregiverId)) {
      return res.status(403).json({
        success: false,
        message: 'Payment does not belong to this caregiver',
      });
    }

    const amountReceivedLkr = Number(((paymentIntent.amount_received || 0) / 100).toFixed(2));
    if (Math.abs(amountReceivedLkr - REGISTRATION_FEE_LKR) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration fee amount received',
      });
    }

    const existingPayment = await Payment.findOne({
      transactionId: paymentIntent.id,
      paymentType: 'registration_fee',
      status: 'completed',
    });

    if (existingPayment) {
      caregiver.registrationFeePaid = true;
      caregiver.registrationFeeAmount = REGISTRATION_FEE_LKR;
      caregiver.registrationFeePaymentId = existingPayment._id;
      await caregiver.save();

      return res.status(200).json({
        success: true,
        message: 'Registration fee payment already recorded',
        data: {
          payment: existingPayment,
          caregiver,
        },
      });
    }

    // Create payment record
    const payment = await Payment.create({
      userId: caregiverId,
      caregiverId: caregiver._id,
      amount: REGISTRATION_FEE_LKR,
      currency: 'LKR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: paymentIntent.id,
      description: `Registration fee for ${user.name}`,
      serviceType: 'Subscription',
      paymentType: 'registration_fee',
      paidTo: 'platform',
      metadata: {
        paymentGateway: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        feeType: 'registration_flat_fee',
        feeAmount: String(REGISTRATION_FEE_LKR),
      },
    });

    // Update caregiver status
    caregiver.registrationFeePaid = true;
    caregiver.registrationFeeAmount = REGISTRATION_FEE_LKR;
    caregiver.registrationFeePaymentId = payment._id;
    await caregiver.save();

    res.status(200).json({
      success: true,
      message: 'Registration fee payment processed successfully.',
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

    const cyclesDue = Math.floor(bookingsSinceLastPayment / 20);
    const commissionDue = cyclesDue * FLAT_FEE_PER_CYCLE_LKR;
    const bookingsUntilNextPayment = 20 - (bookingsSinceLastPayment % 20);
    const requiresPayment = bookingsSinceLastPayment >= 20;

    res.status(200).json({
      success: true,
      data: {
        totalBookingsCompleted: caregiver.totalBookingsCompleted,
        bookingsSinceLastPayment,
        commissionRate: FLAT_FEE_PER_CYCLE_LKR,
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

// @desc    Create Stripe PaymentIntent for the 20-booking flat fee
// @route   POST /api/caregiver/payment/flat-fee/payment-intent
// @access  Private/Caregiver
exports.createFlatFeePaymentIntent = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const user = await User.findById(caregiverId);
    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver || !user) {
      return res.status(404).json({ success: false, message: 'Caregiver profile not found' });
    }

    const bookingsSinceLastPayment =
      caregiver.totalBookingsCompleted - (caregiver.lastCommissionPaymentBookingCount || 0);

    if (bookingsSinceLastPayment < 20) {
      return res.status(400).json({
        success: false,
        message: 'Flat fee not due yet. Complete at least 20 bookings.',
      });
    }

    const cyclesDue = Math.floor(bookingsSinceLastPayment / 20);
    const totalAmount = cyclesDue * FLAT_FEE_PER_CYCLE_LKR;

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100,
      currency: 'lkr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'caregiver_booking_flat_fee',
        caregiverUserId: String(caregiverId),
        caregiverName: String(user.name || ''),
        cyclesDue: String(cyclesDue),
        bookingsSinceLastPayment: String(bookingsSinceLastPayment),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Flat fee payment intent created successfully',
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        cyclesDue,
      },
    });
  } catch (error) {
    console.error('Error creating flat fee payment intent:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating flat fee payment intent',
      error: error.message,
    });
  }
};

// @desc    Process 20-booking flat fee payment (Stripe-verified)
// @route   POST /api/caregiver/payment/commission
// @access  Private/Caregiver
exports.processCommissionPayment = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId is required',
      });
    }

    const user = await User.findById(caregiverId);
    const caregiver = await Caregiver.findOne({ userId: caregiverId });

    if (!caregiver || !user) {
      return res.status(404).json({ success: false, message: 'Caregiver profile not found' });
    }

    const bookingsSinceLastPayment =
      caregiver.totalBookingsCompleted - (caregiver.lastCommissionPaymentBookingCount || 0);

    if (bookingsSinceLastPayment < 20) {
      return res.status(400).json({
        success: false,
        message: 'Flat fee not due yet. Complete at least 20 bookings.',
      });
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Stripe payment is not completed',
      });
    }

    if (paymentIntent.metadata?.caregiverUserId !== String(caregiverId)) {
      return res.status(403).json({
        success: false,
        message: 'Payment does not belong to this caregiver',
      });
    }

    // Guard against duplicate recording
    const existing = await Payment.findOne({
      transactionId: paymentIntent.id,
      paymentType: 'booking_commission',
      status: 'completed',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been recorded',
      });
    }

    const cyclesDue = Math.floor(bookingsSinceLastPayment / 20);
    const bookingsToPay = cyclesDue * 20;
    const commissionAmount = cyclesDue * FLAT_FEE_PER_CYCLE_LKR;

    const expectedAmountLkr = Number(((paymentIntent.amount_received || 0) / 100).toFixed(2));
    if (Math.abs(expectedAmountLkr - commissionAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match the flat fee due',
      });
    }

    const payment = await Payment.create({
      userId: caregiverId,
      caregiverId: caregiver._id,
      amount: commissionAmount,
      currency: 'LKR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      transactionId: paymentIntent.id,
      description: `Booking Flat Fee - ${bookingsToPay} bookings (${cyclesDue} × LKR ${FLAT_FEE_PER_CYCLE_LKR})`,
      serviceType: 'Subscription',
      paymentType: 'booking_commission',
      paidTo: 'admin',
      bookingCount: bookingsToPay,
      metadata: {
        paymentGateway: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        feeType: 'booking_flat_fee',
        cyclesPaid: String(cyclesDue),
      },
    });

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
      message: 'Flat fee payment processed successfully!',
      data: {
        payment,
        bookingsPaid: bookingsToPay,
        amountPaid: commissionAmount,
      },
    });
  } catch (error) {
    console.error('Error processing flat fee payment:', error);
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
      paidTo: { $in: ['admin', 'platform'] },
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
      paidTo: { $in: ['admin', 'platform'] },
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
