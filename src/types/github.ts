export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  // Computed & Extended Metrics
  growth10Days?: {
    starsGained: number;
    percentageGrowth: number;
    dailySparkline: number[]; // 10 data points
    rank: number;
  };
  commitStats?: {
    totalCommitsLastYear: number;
    commitsLast10Days: number;
    commitsLast30Days: number;
    weeklyCommits: { week: number; days: number[]; total: number }[];
    cadenceScore: 'Hyperactive' | 'High' | 'Steady' | 'Moderate' | 'Low';
  };
  languagesBreakdown?: Record<string, number>;
  contributorsCount?: number;
  healthScore?: number; // 0-100 calculated from commit cadence, issue ratio, activity
}

export interface CommitHistoryItem {
  sha: string;
  message: string;
  authorName: string;
  authorAvatar?: string;
  date: string;
  url: string;
}

export interface FilterOptions {
  searchQuery: string;
  minStars: number;
  maxStars: number;
  language: string;
  timelineWindow: '10days' | '30days' | '90days' | '1year';
  commitIntensity: 'all' | 'high' | 'steady' | 'low';
  sortBy: 'stars' | 'growth' | 'commits' | 'pushed';
}

export interface PdfExportOptions {
  reportTitle: string;
  organizationName: string;
  preparedBy: string;
  includeTop10Growth: boolean;
  includeCommitTimelines: boolean;
  includeLanguageStats: boolean;
  includeComparativeMatrix: boolean;
  notes?: string;
}
