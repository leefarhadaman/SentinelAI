const express = require('express');
const { body } = require('express-validator');
const { reviewCode, getReviewHistory, getReviewById } = require('../controllers/reviewController');

const router = express.Router();

const reviewValidation = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .isString().withMessage('Code must be a string')
    .isLength({ min: 1, max: 50000 }).withMessage('Code must be between 1 and 50,000 characters')
    .trim(),
  body('language')
    .notEmpty().withMessage('Language is required')
    .isString().withMessage('Language must be a string')
    .isIn([
      'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
      'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
      'html', 'css', 'sql', 'bash', 'other'
    ]).withMessage('Unsupported language'),
];

router.post('/', reviewValidation, reviewCode);
router.get('/history', getReviewHistory);
router.get('/:id', getReviewById);

module.exports = router;
