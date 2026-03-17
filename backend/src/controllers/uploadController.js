const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { collectFiles } = require('../services/githubService');
const { buildScanPrompt } = require('../utils/promptBuilder');
const { analyzeCode } = require('../services/aiService');
const { calculateScanScores } = require('../utils/scoreCalculator');
const Scan = require('../models/scanModel');

const MAX_FILES = 15;
const MAX_FILE_SIZE = 50000;

const parseAIResponse = (rawResponse, code) => {
  try {
    const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      optimizedCode: parsed.optimizedCode || code,
      scores: parsed.scores || null,
    };
  } catch {
    return {
      issues: [{ issueType: 'Parse Error', severity: 'info', category: 'quality', explanation: 'AI response could not be parsed.', suggestedFix: 'Retry.' }],
      optimizedCode: code,
      scores: null,
    };
  }
};

/**
 * POST /api/upload/analyze
 * Accepts a zip file, extracts it, and runs SentinelAI scan.
 */
const analyzeUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Send a .zip file.' });
  }

  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentinelai-upload-'));

  try {
    const zipPath = req.file.path;

    // Extract zip
    execSync(`unzip -q "${zipPath}" -d "${uploadDir}"`);
    fs.unlinkSync(zipPath);

    const files = collectFiles(uploadDir);

    if (files.length === 0) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
      return res.status(400).json({ success: false, message: 'No supported code files found in the uploaded archive.' });
    }

    const filesToAnalyze = files.slice(0, MAX_FILES);
    console.log(`🔍 Analyzing ${filesToAnalyze.length} of ${files.length} uploaded file(s)`);

    const fileResults = [];

    for (const file of filesToAnalyze) {
      const code = fs.readFileSync(file.filePath, 'utf-8');

      if (!code.trim() || code.length > MAX_FILE_SIZE) {
        fileResults.push({ fileName: file.fileName, filePath: file.relativePath || file.fileName, language: file.language, skipped: true, skipReason: code.length > MAX_FILE_SIZE ? 'File too large' : 'Empty file', issues: [] });
        continue;
      }

      console.log(`🤖 Analyzing: ${file.fileName}`);

      try {
        const { prompt, system } = buildScanPrompt(code, file.language, file.fileName);
        const rawResponse = await analyzeCode(prompt, system);
        const { issues, optimizedCode, scores } = parseAIResponse(rawResponse, code);

        fileResults.push({ fileName: file.fileName, filePath: file.relativePath || file.fileName, language: file.language, issues, optimizedCode, scores, skipped: false });
      } catch (err) {
        fileResults.push({ fileName: file.fileName, filePath: file.relativePath || file.fileName, language: file.language, skipped: true, skipReason: err.message, issues: [] });
      }
    }

    fs.rmSync(uploadDir, { recursive: true, force: true });

    const { scores, summary } = calculateScanScores(fileResults);

    const scan = await Scan.create({
      source: 'upload',
      repoName: req.file.originalname,
      totalFiles: files.length,
      analyzedFiles: filesToAnalyze.length,
      scores,
      summary,
      fileResults,
    });

    return res.status(200).json({
      success: true,
      scanId: scan._id,
      fileName: req.file.originalname,
      totalFiles: files.length,
      analyzedFiles: filesToAnalyze.length,
      scores,
      summary,
      fileResults,
      createdAt: scan.createdAt,
    });

  } catch (error) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    console.error(`❌ Upload analysis error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { analyzeUpload };
