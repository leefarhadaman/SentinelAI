const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const { analyzeUpload } = require('../controllers/uploadController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => cb(null, `sentinelai-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are supported'));
    }
  },
});

router.post('/analyze', upload.single('file'), analyzeUpload); // POST /api/upload/analyze

module.exports = router;
