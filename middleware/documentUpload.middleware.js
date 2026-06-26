const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const isPdfFile = file => {
  const fileName = (file.originalname || '').toLowerCase();
  return file.mimetype === 'application/pdf' || fileName.endsWith('.pdf');
};

const isImageFile = file =>
  ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (isPdfFile(file)) {
      return {
        folder: 'elderease/documents',
        resource_type: 'raw',
        format: 'pdf',
      };
    }

    return {
      folder: 'elderease/documents',
      allowed_formats: ['jpg', 'jpeg', 'png'],
      resource_type: 'image',
    };
  },
});

const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    if (isPdfFile(file) || isImageFile(file)) {
      cb(null, true);
      return;
    }

    if (
      file.mimetype === 'application/octet-stream' &&
      (file.originalname || '').toLowerCase().endsWith('.pdf')
    ) {
      cb(null, true);
      return;
    }

    cb(new Error('Only images (jpg, png) and PDFs are allowed'), false);
  },
});

module.exports = documentUpload;
