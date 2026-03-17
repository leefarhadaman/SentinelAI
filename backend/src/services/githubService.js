const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const os = require('os');

const LANGUAGE_MAP = {
  '.js': 'javascript', '.jsx': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript',
  '.py': 'python', '.java': 'java',
  '.c': 'c', '.cpp': 'cpp', '.cs': 'csharp',
  '.go': 'go', '.rs': 'rust', '.php': 'php',
  '.rb': 'ruby', '.swift': 'swift', '.kt': 'kotlin',
  '.html': 'html', '.css': 'css', '.sql': 'sql', '.sh': 'bash',
};

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'vendor',
  '__pycache__', '.venv', 'venv', 'coverage', '.cache', '.idea', '.vscode',
]);

/**
 * Recursively collect all supported code files.
 * @param {string} dir - Root directory to scan
 * @param {string} baseDir - Base dir for computing relative paths
 * @param {Array} files
 */
const collectFiles = (dir, baseDir = dir, files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        collectFiles(path.join(dir, entry.name), baseDir, files);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (LANGUAGE_MAP[ext]) {
        const filePath = path.join(dir, entry.name);
        files.push({
          filePath,
          relativePath: path.relative(baseDir, filePath),
          language: LANGUAGE_MAP[ext],
          fileName: entry.name,
        });
      }
    }
  }

  return files;
};

/**
 * Clone a GitHub repo to a temp directory and return collected files.
 */
const cloneAndCollect = async (repoUrl) => {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sentinelai-'));
  const git = simpleGit();
  await git.clone(repoUrl, repoDir, ['--depth', '1']);
  const files = collectFiles(repoDir, repoDir);
  return { files, repoDir };
};

const cleanup = (repoDir) => {
  try {
    fs.rmSync(repoDir, { recursive: true, force: true });
  } catch (e) {
    console.warn('⚠️ Could not clean up temp dir:', e.message);
  }
};

module.exports = { cloneAndCollect, collectFiles, cleanup, LANGUAGE_MAP };
