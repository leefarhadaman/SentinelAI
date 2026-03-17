const express = require('express');
const { body } = require('express-validator');
const { analyzeRepo, getScanHistory, getScanById } = require('../controllers/githubController');

const router = express.Router();

const repoValidation = [
  body('repoUrl')
    .notEmpty().withMessage('repoUrl is required')
    .isURL().withMessage('repoUrl must be a valid URL')
    .matches(/github\.com/).withMessage('Only GitHub URLs are supported'),
];

router.post('/analyze', repoValidation, analyzeRepo);   // POST /api/github/analyze
router.get('/scans', getScanHistory);                   // GET  /api/github/scans
router.get('/scans/:id', getScanById);                  // GET  /api/github/scans/:id

module.exports = router;
