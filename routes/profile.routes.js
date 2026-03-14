const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getProfile,
  updateProfile,
  getProfileStats,
  changePassword,
  uploadProfileImage,
} = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// All routes require authentication
router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/stats', getProfileStats);
router.put('/change-password', changePassword);
router.put('/upload-image', upload.single('profileImage'), uploadProfileImage);

module.exports = router;
