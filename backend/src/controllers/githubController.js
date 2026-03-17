const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { cloneAndCollect, cleanup } = require('../services/githubService');
const { buildScanPrompt } = require('../utils/promptBuilder');
const { analyzeCode } = require('../services/aiService');
const { calculateScanScores } = require('../utils/scoreCalculator');
const Scan = require('../models/scanModel');

const MAX_FILES = 15;
const MAX_FILE_SIZE = 50000;

const parseAIResponse = (rawResponse, code) => {
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);

    const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
    const issues = rawIssues.map((issue) => {
      if (typeof issue === 'string') {
        return { issueType: 'Issue', severity: 'medium', category: 'quality', explanation: issue, suggestedFix: '' };
      }
      return {
        issueType: issue.issueType || issue.type || 'Issue',
        severity: ['critical','high','medium','low','info'].includes(issue.severity) ? issue.severity : 'medium',
        category: ['bug','security','performance','quality'].includes(issue.category) ? issue.category : 'quality',
        explanation: issue.explanation || issue.description || '',
        suggestedFix: issue.suggestedFix || issue.fix || '',
      };
    });

    return { issues, optimizedCode: parsed.optimizedCode || code, scores: parsed.scores || null };
  } catch {
    const issues = extractPlainTextIssues(rawResponse);
    return { issues, optimizedCode: code, scores: null };
  }
};

const extractPlainTextIssues = (text) => {
  const issues = [];
  const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
  for (const line of lines.slice(0, 10)) {
    const clean = line.replace(/^-\s*/, '').trim();
    if (!clean) continue;
    const lower = clean.toLowerCase();
    let severity = 'medium', category = 'quality';
    if (lower.includes('security') || lower.includes('api key') || lower.includes('secret')) { category = 'security'; severity = 'high'; }
    else if (lower.includes('performance') || lower.includes('blocking')) { category = 'performance'; severity = 'medium'; }
    else if (lower.includes('bug') || lower.includes('error')) { category = 'bug'; severity = 'high'; }
    issues.push({ issueType: category.charAt(0).toUpperCase() + category.slice(1) + ' Issue', severity, category, explanation: clean.length > 200 ? clean.substring(0, 200) + '...' : clean, suggestedFix: '' });
  }
  if (issues.length === 0) {
    issues.push({ issueType: 'Analysis Complete', severity: 'info', category: 'quality', explanation: 'AI analysis completed.', suggestedFix: '' });
  }
  return issues;
};

/**
 * POST /api/github/analyze
 * SSE streaming — sends progress events then final result.
 */
const analyzeRepo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { repoUrl } = req.body;
  let repoDir = null;

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send('status', { step: 'cloning', message: 'Cloning repository...', repoUrl });

    const { files, repoDir: dir } = await cloneAndCollect(repoUrl);
    repoDir = dir;

    if (files.length === 0) {
      cleanup(repoDir);
      send('error', { message: 'No supported code files found in this repository.' });
      return res.end();
    }

    const filesToAnalyze = files.slice(0, MAX_FILES);
    send('status', { step: 'scanning', message: `Found ${files.length} files. Analyzing ${filesToAnalyze.length}...`, totalFiles: files.length, analyzedFiles: filesToAnalyze.length });

    const fileResults = [];

    for (let i = 0; i < filesToAnalyze.length; i++) {
      const file = filesToAnalyze[i];
      const code = fs.readFileSync(file.filePath, 'utf-8');

      send('file', {
        step: 'analyzing',
        fileName: file.fileName,
        filePath: file.relativePath || file.fileName,
        language: file.language,
        current: i + 1,
        total: filesToAnalyze.length,
      });

      if (!code.trim()) {
        fileResults.push({ fileName: file.fileName, filePath: file.relativePath, language: file.language, skipped: true, skipReason: 'Empty file', issues: [] });
        continue;
      }
      if (code.length > MAX_FILE_SIZE) {
        fileResults.push({ fileName: file.fileName, filePath: file.relativePath, language: file.language, skipped: true, skipReason: 'File too large (>50k chars)', issues: [] });
        continue;
      }

      try {
        const { prompt, system } = buildScanPrompt(code, file.language, file.fileName);
        const rawResponse = await analyzeCode(prompt, system);
        const { issues, optimizedCode, scores } = parseAIResponse(rawResponse, code);

        fileResults.push({ fileName: file.fileName, filePath: file.relativePath || file.fileName, language: file.language, issues, optimizedCode, scores, skipped: false });

        send('file_done', {
          fileName: file.fileName,
          issueCount: issues.length,
          current: i + 1,
          total: filesToAnalyze.length,
        });
      } catch (fileError) {
        fileResults.push({ fileName: file.fileName, filePath: file.relativePath || file.fileName, language: file.language, skipped: true, skipReason: fileError.message, issues: [] });
      }
    }

    cleanup(repoDir);

    const { scores, summary } = calculateScanScores(fileResults);
    const repoName = repoUrl.split('/').slice(-2).join('/').replace('.git', '');

    const scan = await Scan.create({ source: 'github', repoUrl, repoName, totalFiles: files.length, analyzedFiles: filesToAnalyze.length, scores, summary, fileResults });

    send('complete', {
      success: true,
      scanId: scan._id,
      repoUrl,
      repoName,
      totalFiles: files.length,
      analyzedFiles: filesToAnalyze.length,
      scores,
      summary,
      fileResults,
      createdAt: scan.createdAt,
    });

    res.end();

  } catch (error) {
    if (repoDir) cleanup(repoDir);
    console.error(`GitHub analysis error: ${error.message}`);
    send('error', { message: error.message.includes('not found') || error.message.includes('Authentication') ? 'Repository not found or is private. Only public repos are supported.' : error.message });
    res.end();
  }
};

/**
 * GET /api/github/scans
 */
const getScanHistory = async (req, res) => {
  try {
    const scans = await Scan.find({ source: 'github' }).sort({ createdAt: -1 }).limit(20).select('-fileResults -__v');
    return res.status(200).json({ success: true, count: scans.length, scans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/github/scans/:id
 */
const getScanById = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id).select('-__v');
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
    return res.status(200).json({ success: true, scan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { analyzeRepo, getScanHistory, getScanById };
