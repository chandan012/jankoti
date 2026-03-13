const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const normalizeEnv = (value) => (typeof value === 'string' ? value.trim() : value);

cloudinary.config({
  cloud_name: normalizeEnv(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: normalizeEnv(process.env.CLOUDINARY_API_KEY),
  api_secret: normalizeEnv(process.env.CLOUDINARY_API_SECRET)
});

const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed (jpg, jpeg, png, webp).'));
};

const createImageUpload = (folder, fieldName = 'image') => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      resource_type: 'image'
    }
  });

  const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE }
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) {
        return next();
      }
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 2MB or smaller.'
        : err.message || 'Image upload failed.';
      return res.status(400).json({ message });
    });
  };
};

const createMultiImageUpload = (folder, fields) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      resource_type: 'image'
    }
  });

  const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE }
  }).fields(fields);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) {
        return next();
      }
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 2MB or smaller.'
        : err.message || 'Image upload failed.';
      return res.status(400).json({ message });
    });
  };
};

const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF or Word documents are allowed.'));
};

const createDocumentUpload = (fieldName = 'resume') => {
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: documentFileFilter,
    limits: { fileSize: MAX_DOCUMENT_SIZE }
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) {
        return next();
      }
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Resume must be 5MB or smaller.'
        : err.message || 'Resume upload failed.';
      return res.status(400).json({ message });
    });
  };
};

const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn(`Failed to delete Cloudinary image ${publicId}:`, err.message);
  }
};

module.exports = {
  cloudinary,
  createImageUpload,
  createMultiImageUpload,
  createDocumentUpload,
  deleteImage
};
