const CareReceiver = require('../models/CareReceiver.model');
const User = require('../models/User.model');
const Booking = require('../models/Booking.model');
const Feedback = require('../models/Feedback.model');

// @desc    Get care receiver dashboard statistics
// @route   GET /api/carereceiver/dashboard
// @access  Private/CareReceiver
exports.getDashboardStats = async (req, res) => {
  try {
    const careReceiverUserId = req.user._id;

    const careReceiver = await CareReceiver.findOne({ userId: careReceiverUserId });

    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    const bookings = await Booking.find({ careReceiverId: careReceiverUserId })
      .populate('caregiverId', 'name')
      .sort({ date: -1 })
      .lean();

    const activeBookings = bookings.filter(b => b.status !== 'cancelled');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const monthlyBookings = activeBookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return (
        bookingDate.getMonth() === currentMonth &&
        bookingDate.getFullYear() === currentYear
      );
    });

    const uniqueCaregiverIds = new Set(
      activeBookings
        .filter(b => ['pending', 'confirmed', 'completed'].includes(b.status))
        .map(b => b.caregiverId?._id?.toString())
        .filter(Boolean),
    );

    const monthlyHours = monthlyBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.duration) || 0), 0);

    const careReceiverReviews = await Feedback.find({
      userId: careReceiverUserId,
      bookingId: { $ne: null },
      caregiverId: { $exists: true, $ne: null },
    })
      .select('rating')
      .lean();

    const satisfactionRate =
      careReceiverReviews.length > 0
        ? Math.round(
            (careReceiverReviews.reduce((sum, review) => sum + review.rating, 0) /
              careReceiverReviews.length /
              5) *
              100,
          )
        : 0;

    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayStart);
      date.setDate(date.getDate() - i);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

      const dayBookings = activeBookings.filter(b => {
        const bookingDate = new Date(b.date);
        return (
          bookingDate >= date &&
          bookingDate < nextDay &&
          b.status === 'completed'
        );
      });

      weeklyActivity.push({
        day: dayName,
        hours: dayBookings.reduce((sum, b) => sum + (Number(b.duration) || 0), 0),
        appointments: dayBookings.length,
      });
    }

    const serviceTypes = {};
    activeBookings.forEach(booking => {
      const service = booking.serviceType || 'Other';
      serviceTypes[service] = (serviceTypes[service] || 0) + 1;
    });

    const totalActiveBookings = activeBookings.length;
    const serviceDistribution = Object.entries(serviceTypes)
      .map(([name, count]) => ({
        name,
        value: count,
        percentage:
          totalActiveBookings > 0
            ? Math.round((count / totalActiveBookings) * 100)
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const upcomingAppointments = activeBookings
      .filter(b => {
        const bookingDate = new Date(b.date);
        bookingDate.setHours(0, 0, 0, 0);
        return (
          (b.status === 'confirmed' || b.status === 'pending') &&
          bookingDate >= todayStart
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10)
      .map(booking => ({
        id: booking._id,
        caregiver: booking.caregiverId?.name || 'Unknown Caregiver',
        service: booking.serviceType || 'Other',
        date: booking.date,
        startTime: booking.startTime,
        duration: booking.duration,
        status: booking.status,
        totalAmount: booking.totalAmount,
      }));

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          monthlyAppointments: monthlyBookings.length,
          assignedCaregivers: uniqueCaregiverIds.size,
          monthlyHours: Math.round(monthlyHours),
          satisfactionRate,
          totalReviews: careReceiverReviews.length,
        },
        weeklyActivity,
        serviceDistribution,
        upcomingAppointments,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching dashboard statistics',
    });
  }
};

// @desc    Get care receiver profile
// @route   GET /api/carereceiver/profile
// @access  Private/CareReceiver
exports.getProfile = async (req, res) => {
  try {
    const careReceiver = await CareReceiver.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone address profileImage dateOfBirth emergencyContact')
      .populate('assignedCaregivers')
      .populate('primaryCaregiver');

    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { careReceiver },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching profile',
    });
  }
};

// @desc    Update care receiver profile
// @route   PUT /api/carereceiver/profile
// @access  Private/CareReceiver
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      city,
      district,
      dateOfBirth,
      emergencyContact,
      medicalConditions,
      careRequirements,
      profileImage,
    } = req.body;

    // Update User fields
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (profileImage !== undefined) user.profileImage = profileImage;

    if (
      address !== undefined ||
      city !== undefined ||
      district !== undefined
    ) {
      if (!user.address) user.address = {};
      if (address !== undefined) user.address.street = address;
      if (city !== undefined) user.address.city = city;
      if (district !== undefined) user.address.state = district;
    }
    
    // Update emergency contact
    if (emergencyContact) {
      user.emergencyContact = {
        name: emergencyContact.name || user.emergencyContact?.name || '',
        phone: emergencyContact.phone || user.emergencyContact?.phone || '',
        relationship: emergencyContact.relationship || user.emergencyContact?.relationship || '',
      };
    }

    await user.save();

    // Update CareReceiver fields
    const careReceiverUpdate = {};
    
    // Convert medicalConditions array to medicalHistory format
    if (medicalConditions && Array.isArray(medicalConditions)) {
      careReceiverUpdate.medicalHistory = medicalConditions.map(condition => ({
        condition: condition,
        notes: '',
      }));
    }
    
    if (careRequirements !== undefined) {
      careReceiverUpdate.careRequirements = String(careRequirements).trim();
    }

    // Update CareReceiver if there are fields to update
    let careReceiver;
    if (Object.keys(careReceiverUpdate).length > 0) {
      careReceiver = await CareReceiver.findOneAndUpdate(
        { userId: req.user.id },
        careReceiverUpdate,
        { new: true, runValidators: true }
      ).populate('userId', 'name email phone address profileImage dateOfBirth emergencyContact');
    } else {
      careReceiver = await CareReceiver.findOne({ userId: req.user.id })
        .populate('userId', 'name email phone address profileImage dateOfBirth emergencyContact');
    }

    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { careReceiver },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating profile',
    });
  }
};

// @desc    Get assigned caregivers
// @route   GET /api/carereceiver/assigned-caregivers
// @access  Private/CareReceiver
exports.getAssignedCaregivers = async (req, res) => {
  try {
    const careReceiver = await CareReceiver.findOne({ userId: req.user.id })
      .populate({
        path: 'assignedCaregivers',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage',
        },
      })
      .populate({
        path: 'primaryCaregiver',
        populate: {
          path: 'userId',
          select: 'name email phone profileImage',
        },
      });

    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        assignedCaregivers: careReceiver.assignedCaregivers,
        primaryCaregiver: careReceiver.primaryCaregiver,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching assigned caregivers',
    });
  }
};

// @desc    Get available caregivers for booking
// @route   GET /api/carereceiver/available-caregivers
// @access  Private/CareReceiver
exports.getAvailableCaregivers = async (req, res) => {
  try {
    const Caregiver = require('../models/Caregiver.model');

    // Only show caregivers who are admin-approved (isVerified) AND have paid the registration fee
    const activatedUserIds = (
      await User.find({ role: 'caregiver', isVerified: true, isActive: true }).select('_id')
    ).map(u => u._id);

    const caregivers = await Caregiver.find({
      userId: { $in: activatedUserIds },
      registrationFeePaid: true,
    })
      .populate({
        path: 'userId',
        select: 'name email phone profileImage address',
      })
      .sort({ createdAt: -1 });

    // Format the response
    const formattedCaregivers = caregivers.map(caregiver => ({
      _id: caregiver._id,
      name: caregiver.userId?.name,
      email: caregiver.userId?.email,
      phone: caregiver.userId?.phone,
      profileImage: caregiver.userId?.profileImage,
      qualification: caregiver.qualification,
      experience: caregiver.experience,
      specialization: caregiver.specialization,
      skills: caregiver.skills,
      languages: caregiver.languages,
      hourlyRate: caregiver.hourlyRate,
      rating: caregiver.rating,
      availability: caregiver.status === 'available',
      status: caregiver.status,
      hasTransportation: caregiver.hasTransportation,
      bio: caregiver.bio,
      workStartTime: caregiver.workStartTime,
      workEndTime: caregiver.workEndTime,
      role: 'caregiver',
    }));

    res.status(200).json({
      status: 'success',
      count: formattedCaregivers.length,
      data: formattedCaregivers,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching available caregivers',
    });
  }
};
