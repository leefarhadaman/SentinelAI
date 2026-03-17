/**
 * Aggregates scores and issue counts across all file results.
 * @param {Array} fileResults
 * @returns {{ scores, summary }}
 */
const calculateScanScores = (fileResults) => {
  const summary = { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const scoreAccum = { security: [], maintainability: [], performance: [] };

  for (const file of fileResults) {
    if (file.skipped || !file.issues) continue;

    for (const issue of file.issues) {
      summary.totalIssues++;
      if (summary[issue.severity] !== undefined) summary[issue.severity]++;
    }

    if (file.scores) {
      if (file.scores.security != null) scoreAccum.security.push(file.scores.security);
      if (file.scores.maintainability != null) scoreAccum.maintainability.push(file.scores.maintainability);
      if (file.scores.performance != null) scoreAccum.performance.push(file.scores.performance);
    }
  }

  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 7;

  const scores = {
    security: avg(scoreAccum.security),
    maintainability: avg(scoreAccum.maintainability),
    performance: avg(scoreAccum.performance),
  };
  scores.overall = Math.round(((scores.security + scores.maintainability + scores.performance) / 3) * 10) / 10;

  return { scores, summary };
};

module.exports = { calculateScanScores };
