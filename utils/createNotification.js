const Notification = require('../models/Notification.model');

/**
 * Fire-and-forget helper — creates a notification without blocking the caller.
 * Safe to call from any controller; errors are only logged, never thrown.
 */
const createNotification = ({ type, title, message, relatedId, relatedModel }) => {
  Notification.create({ type, title, message, relatedId, relatedModel }).catch(err =>
    console.error('createNotification failed:', err.message)
  );
};

module.exports = createNotification;
