const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  issueType: { type: String, default: 'Unknown Issue' },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'info' },
  explanation: { type: String, default: '' },
  suggestedFix: { type: String, default: '' },
  category: { type: String, enum: ['bug', 'security', 'performance', 'quality'], default: 'quality' },
}, { _id: false });

const fileResultSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, default: '' },
  language: { type: String, required: true },
  issues: [issueSchema],
  optimizedCode: { type: String, default: '' },
  skipped: { type: Boolean, default: false },
  skipReason: { type: String, default: '' },
}, { _id: false });

const scoresSchema = new mongoose.Schema({
  security: { type: Number, min: 0, max: 10, default: 0 },
  maintainability: { type: Number, min: 0, max: 10, default: 0 },
  performance: { type: Number, min: 0, max: 10, default: 0 },
  overall: { type: Number, min: 0, max: 10, default: 0 },
}, { _id: false });

const scanSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ['github', 'upload'], required: true },
    repoUrl: { type: String, default: '' },
    repoName: { type: String, default: '' },
    totalFiles: { type: Number, default: 0 },
    analyzedFiles: { type: Number, default: 0 },
    scores: scoresSchema,
    summary: {
      totalIssues: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },
    fileResults: [fileResultSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scan', scanSchema);
