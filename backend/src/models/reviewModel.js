const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Code is required'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      lowercase: true,
      enum: {
        values: [
          'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
          'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
          'html', 'css', 'sql', 'bash', 'other'
        ],
        message: 'Language "{VALUE}" is not supported',
      },
    },
    aiResponse: {
      issues: { type: [String], default: [] },
      security: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
      optimizedCode: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
