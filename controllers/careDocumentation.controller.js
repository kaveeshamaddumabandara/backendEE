const CareDocumentation = require('../models/CareDocumentation.model');
const Booking = require('../models/Booking.model');

// Create or update care documentation for a booking
exports.createOrUpdateDocumentation = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { bookingId } = req.params;
    const documentationData = req.body;

    // Verify booking exists and belongs to caregiver
    const booking = await Booking.findOne({
      _id: bookingId,
      caregiverId: caregiverId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized',
      });
    }

    // Check if documentation already exists
    let documentation = await CareDocumentation.findOne({ bookingId });

    if (documentation) {
      // Update existing documentation
      Object.assign(documentation, {
        ...documentationData,
        caregiverId,
        careReceiverId: booking.careReceiverId,
        documentedAt: new Date(),
      });
      await documentation.save();
    } else {
      // Create new documentation
      documentation = await CareDocumentation.create({
        bookingId,
        caregiverId,
        careReceiverId: booking.careReceiverId,
        ...documentationData,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Care documentation saved successfully',
      data: { documentation },
    });
  } catch (error) {
    console.error('Error saving care documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving care documentation',
      error: error.message,
    });
  }
};

// Get care documentation for a specific booking
exports.getDocumentationByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (
      userRole === 'caregiver' &&
      booking.caregiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this documentation',
      });
    }

    if (
      userRole === 'carereceiver' &&
      booking.careReceiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this documentation',
      });
    }

    const documentation = await CareDocumentation.findOne({ bookingId })
      .populate('bookingId', 'date startTime endTime serviceType')
      .populate('caregiverId', 'name profileImage')
      .populate('careReceiverId', 'name profileImage');

    if (!documentation) {
      return res.status(404).json({
        success: false,
        message: 'No documentation found for this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: { documentation },
    });
  } catch (error) {
    console.error('Error fetching care documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching care documentation',
      error: error.message,
    });
  }
};

// Get all care documentation for caregiver
exports.getCaregiverDocumentations = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const documentations = await CareDocumentation.find({ caregiverId })
      .populate('bookingId', 'date startTime endTime serviceType status')
      .populate('careReceiverId', 'name profileImage')
      .sort({ documentedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CareDocumentation.countDocuments({ caregiverId });

    res.status(200).json({
      success: true,
      count: documentations.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: documentations,
    });
  } catch (error) {
    console.error('Error fetching caregiver documentations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documentations',
      error: error.message,
    });
  }
};

// Get all care documentation for care receiver
exports.getCareReceiverDocumentations = async (req, res) => {
  try {
    const careReceiverId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const documentations = await CareDocumentation.find({ careReceiverId })
      .populate('bookingId', 'date startTime endTime serviceType status')
      .populate('caregiverId', 'name profileImage')
      .sort({ documentedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CareDocumentation.countDocuments({ careReceiverId });

    res.status(200).json({
      success: true,
      count: documentations.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: documentations,
    });
  } catch (error) {
    console.error('Error fetching care receiver documentations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documentations',
      error: error.message,
    });
  }
};

// Delete care documentation
exports.deleteDocumentation = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { documentationId } = req.params;

    const documentation = await CareDocumentation.findOne({
      _id: documentationId,
      caregiverId,
    });

    if (!documentation) {
      return res.status(404).json({
        success: false,
        message: 'Documentation not found or unauthorized',
      });
    }

    await documentation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Documentation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting care documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting documentation',
      error: error.message,
    });
  }
};

// Add todo item to documentation
exports.addTodoItem = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { bookingId } = req.params;
    const { text, priority = 'medium' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Todo text is required',
      });
    }

    // Verify booking belongs to caregiver
    const booking = await Booking.findOne({
      _id: bookingId,
      caregiverId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized',
      });
    }

    // Find or create documentation
    let documentation = await CareDocumentation.findOne({ bookingId });

    if (!documentation) {
      documentation = await CareDocumentation.create({
        bookingId,
        caregiverId,
        careReceiverId: booking.careReceiverId,
        todoList: [],
      });
    }

    // Add todo item
    documentation.todoList.push({
      text: text.trim(),
      priority,
      completed: false,
    });

    await documentation.save();

    res.status(200).json({
      success: true,
      message: 'Todo item added successfully',
      data: { documentation },
    });
  } catch (error) {
    console.error('Error adding todo item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding todo item',
      error: error.message,
    });
  }
};

// Update todo item
exports.updateTodoItem = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { bookingId, todoId } = req.params;
    const { text, priority, completed } = req.body;

    const documentation = await CareDocumentation.findOne({
      bookingId,
      caregiverId,
    });

    if (!documentation) {
      return res.status(404).json({
        success: false,
        message: 'Documentation not found or unauthorized',
      });
    }

    const todoItem = documentation.todoList.id(todoId);
    if (!todoItem) {
      return res.status(404).json({
        success: false,
        message: 'Todo item not found',
      });
    }

    // Update fields if provided
    if (text !== undefined) todoItem.text = text;
    if (priority !== undefined) todoItem.priority = priority;
    if (completed !== undefined) todoItem.completed = completed;

    await documentation.save();

    res.status(200).json({
      success: true,
      message: 'Todo item updated successfully',
      data: { documentation },
    });
  } catch (error) {
    console.error('Error updating todo item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating todo item',
      error: error.message,
    });
  }
};

// Delete todo item
exports.deleteTodoItem = async (req, res) => {
  try {
    const caregiverId = req.user._id;
    const { bookingId, todoId } = req.params;

    const documentation = await CareDocumentation.findOne({
      bookingId,
      caregiverId,
    });

    if (!documentation) {
      return res.status(404).json({
        success: false,
        message: 'Documentation not found or unauthorized',
      });
    }

    // Remove todo item using pull
    documentation.todoList.pull(todoId);
    await documentation.save();

    res.status(200).json({
      success: true,
      message: 'Todo item deleted successfully',
      data: { documentation },
    });
  } catch (error) {
    console.error('Error deleting todo item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting todo item',
      error: error.message,
    });
  }
};

// Get todo list for a booking
exports.getTodoList = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Verify user has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (
      (userRole === 'caregiver' &&
        booking.caregiverId.toString() !== userId.toString()) ||
      (userRole === 'carereceiver' &&
        booking.careReceiverId.toString() !== userId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this todo list',
      });
    }

    const documentation = await CareDocumentation.findOne({ bookingId });

    if (!documentation) {
      return res.status(200).json({
        success: true,
        data: { todoList: [] },
      });
    }

    res.status(200).json({
      success: true,
      data: { todoList: documentation.todoList },
    });
  } catch (error) {
    console.error('Error fetching todo list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching todo list',
      error: error.message,
    });
  }
};
