const Notification = require('../models/Notification.model');

// @desc    Get all notifications (admin only), newest first
// @route   GET /api/notifications
// @access  Private (Admin)
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = unreadOnly === 'true' ? { isRead: false } : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ isRead: false }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

// @desc    Get unread notification count only (lightweight poll)
// @route   GET /api/notifications/unread-count
// @access  Private (Admin)
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ status: 'success', data: { count } });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch unread count' });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (Admin)
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    res.status(200).json({ status: 'success', data: { notification } });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private (Admin)
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to mark notifications as read' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (Admin)
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    res.status(200).json({ status: 'success', message: 'Notification deleted' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete notification' });
  }
};

// @desc    Delete all read notifications (cleanup)
// @route   DELETE /api/notifications/read
// @access  Private (Admin)
exports.deleteAllRead = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ isRead: true });
    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} read notification(s) deleted`,
    });
  } catch (error) {
    console.error('deleteAllRead error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to clear notifications' });
  }
};
