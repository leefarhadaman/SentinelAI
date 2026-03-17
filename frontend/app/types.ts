export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Category = "bug" | "security" | "performance" | "quality";

export interface Issue {
  issueType: string;
  severity: Severity;
  category: Category;
  explanation: string;
  suggestedFix: string;
}

export interface FileResult {
  fileName: string;
  filePath: string;
  language: string;
  issues: Issue[];
  optimizedCode: string;
  scores?: { security: number; maintainability: number; performance: number };
  skipped: boolean;
  skipReason?: string;
}

export interface Scores {
  security: number;
  maintainability: number;
  performance: number;
  overall: number;
}

export interface Summary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScanResult {
  success: boolean;
  scanId: string;
  repoUrl?: string;
  repoName?: string;
  fileName?: string;
  totalFiles: number;
  analyzedFiles: number;
  scores: Scores;
  summary: Summary;
  fileResults: FileResult[];
  createdAt: string;
}

export interface ProgressEvent {
  type: "status" | "file" | "file_done" | "complete" | "error";
  step?: string;
  message?: string;
  fileName?: string;
  filePath?: string;
  language?: string;
  current?: number;
  total?: number;
  totalFiles?: number;
  analyzedFiles?: number;
  issueCount?: number;
  repoUrl?: string;
  [key: string]: unknown;
}
