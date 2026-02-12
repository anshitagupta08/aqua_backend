const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Store files in memory for direct S3 upload

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only specific file types are allowed!'));
    }
  },
});

module.exports = upload;
