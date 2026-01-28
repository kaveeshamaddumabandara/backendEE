const User = require('../models/User.model');
const Caregiver = require('../models/Caregiver.model');
const CareReceiver = require('../models/CareReceiver.model');
const Payment = require('../models/Payment.model');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get users by role
    const careReceivers = await User.countDocuments({ role: 'carereceiver' });
    const caregivers = await User.countDocuments({ role: 'caregiver' });
    const admins = await User.countDocuments({ role: 'admin' });
    
    // Get active caregivers
    const activeCaregivers = await User.countDocuments({ 
      role: 'caregiver', 
      isActive: true 
    });

    // Calculate growth percentages (comparing with last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth }
    });
    
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 2);
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: previousMonth, $lt: lastMonth }
    });
    
    const userGrowthPercentage = newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : 0;

    // Get revenue data from payments
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const paymentsThisMonth = await Payment.find({
      createdAt: { $gte: startOfMonth },
      status: 'completed'
    });
    
    const revenueThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + payment.amount, 0);
    
    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);
    
    const paymentsLastMonth = await Payment.find({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      status: 'completed'
    });
    
    const revenueLastMonth = paymentsLastMonth.reduce((sum, payment) => sum + payment.amount, 0);
    const revenueGrowth = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : 0;

    // Get appointments/completed payments this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const appointmentsThisWeek = await Payment.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        careReceivers,
        caregivers,
        admins,
        activeCaregivers,
        userGrowthPercentage,
        appointmentsThisWeek,
        appointmentGrowth: 15, // Sample growth
        revenueThisMonth,
        revenueGrowth,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard statistics',
    });
  }
};

// @desc    Get user growth data (last 6 months)
// @route   GET /api/dashboard/user-growth
// @access  Private/Admin
exports.getUserGrowth = async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const growthData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const careReceivers = await User.countDocuments({
        role: 'carereceiver',
        createdAt: { $lt: nextMonth }
      });
      
      const caregivers = await User.countDocuments({
        role: 'caregiver',
        createdAt: { $lt: nextMonth }
      });

      growthData.push({
        month: months[monthDate.getMonth()],
        careReceivers,
        caregivers,
      });
    }

    res.status(200).json({
      status: 'success',
      data: growthData,
    });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user growth data',
    });
  }
};

// @desc    Get user distribution
// @route   GET /api/dashboard/user-distribution
// @access  Private/Admin
exports.getUserDistribution = async (req, res) => {
  try {
    const careReceivers = await User.countDocuments({ role: 'carereceiver' });
    const caregivers = await User.countDocuments({ role: 'caregiver' });
    const admins = await User.countDocuments({ role: 'admin' });

    const distribution = [
      { name: 'Care Receivers', value: careReceivers, color: '#3B82F6' },
      { name: 'Caregivers', value: caregivers, color: '#8B5CF6' },
      { name: 'Admins', value: admins, color: '#10B981' },
    ];

    res.status(200).json({
      status: 'success',
      data: distribution,
    });
  } catch (error) {
    console.error('Get user distribution error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user distribution',
    });
  }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private/Admin
exports.getRecentActivities = async (req, res) => {
  try {
    // Get recently registered users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt');

    const activities = recentUsers.map(user => {
      const timeAgo = getTimeAgo(user.createdAt);
      return {
        id: user._id,
        type: 'new_user',
        message: `New ${user.role} registered: ${user.name}`,
        time: timeAgo,
        status: 'pending',
      };
    });

    res.status(200).json({
      status: 'success',
      data: activities,
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching recent activities',
    });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return '1 year ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return '1 month ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return '1 day ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return '1 hour ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} min ago`;
  if (interval === 1) return '1 min ago';
  
  return 'just now';
}

// @desc    Get platform activity (mock data for now)
// @route   GET /api/dashboard/platform-activity
// @access  Private/Admin
exports.getPlatformActivity = async (req, res) => {
  try {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activityData = [];
    
    // Get last 7 days of payment data
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayPayments = await Payment.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const completedPayments = await Payment.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
        status: 'completed'
      });
      
      activityData.push({
        day: days[date.getDay()],
        appointments: dayPayments,
        completedCare: completedPayments,
      });
    }

    res.status(200).json({
      status: 'success',
      data: activityData,
    });
  } catch (error) {
    console.error('Get platform activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching platform activity',
    });
  }
};

// @desc    Get revenue trends (last 6 months)
// @route   GET /api/dashboard/revenue-trends
// @access  Private/Admin
exports.getRevenueTrends = async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const revenueData = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const monthPayments = await Payment.find({
        createdAt: { $gte: monthStart, $lt: monthEnd },
        status: 'completed'
      });
      
      const revenue = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      revenueData.push({
        month: months[monthStart.getMonth()],
        revenue,
      });
    }

    res.status(200).json({
      status: 'success',
      data: revenueData,
    });
  } catch (error) {
    console.error('Get revenue trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching revenue trends',
    });
  }
};
