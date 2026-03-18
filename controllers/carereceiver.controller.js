const CareReceiver = require('../models/CareReceiver.model');
const User = require('../models/User.model');
const Booking = require('../models/Booking.model');

// @desc    Get care receiver dashboard statistics
// @route   GET /api/carereceiver/dashboard
// @access  Private/CareReceiver
exports.getDashboardStats = async (req, res) => {
  try {
    const careReceiver = await CareReceiver.findOne({ userId: req.user.id });
    
    if (!careReceiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Care receiver profile not found',
      });
    }

    // Get all bookings for this care receiver (using User ID, not CareReceiver profile ID)
    const bookings = await Booking.find({ careReceiverId: req.user.id })
      .populate('caregiverId', 'name rating experience specializations')
      .sort({ date: -1 });

    // Get current month dates
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter bookings for current month
    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.getMonth() === currentMonth && 
             bookingDate.getFullYear() === currentYear;
    });

    // Get unique assigned caregivers
    const uniqueCaregiverIds = new Set(
      bookings
        .map(b => b.caregiverId?._id?.toString())
        .filter(Boolean)
    );

    // Calculate monthly hours from completed bookings
    const monthlyHours = monthlyBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.duration || 0), 0);

    // Calculate satisfaction rate from completed bookings with ratings
    const completedWithRatings = bookings.filter(
      b => b.status === 'completed' && b.rating
    );
    const avgRating = completedWithRatings.length > 0
      ? completedWithRatings.reduce((sum, b) => sum + (b.rating || 0), 0) / completedWithRatings.length
      : 4.5;
    const satisfactionRate = Math.round((avgRating / 5) * 100);

    // Generate weekly activity data (last 7 days)
    const weeklyActivity = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= date && bookingDate < nextDay && b.status === 'completed';
      });
      
      const hours = dayBookings.reduce((sum, b) => sum + (b.duration || 0), 0);
      const appointments = dayBookings.length;
      
      weeklyActivity.push({
        day: dayName,
        hours: hours,
        appointments: appointments,
      });
    }

    // Calculate service distribution
    const serviceTypes = {};
    bookings.forEach(booking => {
      const service = booking.serviceType || 'General Care';
      serviceTypes[service] = (serviceTypes[service] || 0) + 1;
    });

    const serviceDistribution = Object.entries(serviceTypes)
      .map(([name, count]) => ({
        name,
        value: count,
        percentage: Math.round((count / bookings.length) * 100),
      }))
      .sort((a, b) => b.value - a.value);

    // Get upcoming appointments
    const upcomingBookings = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .slice(0, 10)
      .map(booking => ({
        id: booking._id,
        caregiver: booking.caregiverId?.name || 'Unknown Caregiver',
        service: booking.serviceType || 'General Care',
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
          monthlyHours: monthlyHours,
          satisfactionRate: satisfactionRate,
        },
        weeklyActivity,
        serviceDistribution,
        upcomingAppointments: upcomingBookings,
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

    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (profileImage !== undefined) user.profileImage = profileImage;
    
    // Update address object
    if (address || city || district) {
      if (!user.address) user.address = {};
      if (address) user.address.street = address;
      if (city) user.address.city = city;
      if (district) user.address.state = district;
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
    
    // Convert careRequirements to careNeeds array
    if (careRequirements) {
      const needsMap = {
        'medication': 'medication',
        'bathing': 'bathing',
        'feeding': 'feeding',
        'mobility': 'mobility',
        'companionship': 'companionship',
        'medical': 'medical-monitoring',
        'housekeeping': 'housekeeping',
      };
      
      const needs = [];
      const requirementsLower = careRequirements.toLowerCase();
      
      Object.keys(needsMap).forEach(key => {
        if (requirementsLower.includes(key)) {
          needs.push(needsMap[key]);
        }
      });
      
      if (needs.length > 0) {
        careReceiverUpdate.careNeeds = needs;
      }
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
    
    // Get all caregivers with their user details
    const caregivers = await Caregiver.find({})
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
