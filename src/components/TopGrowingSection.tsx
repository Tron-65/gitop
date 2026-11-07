import React, { useState } from 'react';
import { Repository } from '../types/github';
import { TrendingUp, GitCommit, Star, ExternalLink, ArrowUpRight, BarChart2, Layers } from 'lucide-react';

interface TopGrowingSectionProps {
  repos: Repository[];
  onSelectRepo: (repo: Repository) => void;
  onCompareRepo: (repo: Repository) => void;
  comparedRepoIds: number[];
}

export const TopGrowingSection: React.FC<TopGrowingSectionProps> = ({
  repos,
  onSelectRepo,
  onCompareRepo,
  comparedRepoIds,
}) => {
  const [sortBy, setSortBy] = useState<'starsGained' | 'percentageGrowth' | 'commitsLast10Days'>('starsGained');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Filter & sort
  let list = [...repos];
  if (selectedLanguage !== 'all') {
    list = list.filter((r) => r.language?.toLowerCase() === selectedLanguage.toLowerCase());
  }

  list.sort((a, b) => {
    if (sortBy === 'starsGained') {
      return (b.growth10Days?.starsGained || 0) - (a.growth10Days?.starsGained || 0);
    }
    if (sortBy === 'percentageGrowth') {
      return (b.growth10Days?.percentageGrowth || 0) - (a.growth10Days?.percentageGrowth || 0);
    }
    if (sortBy === 'commitsLast10Days') {
      return (b.commitStats?.commitsLast10Days || 0) - (a.commitStats?.commitsLast10Days || 0);
    }
    return 0;
  });

  // Calculate totals
  const totalStarsGained = repos.reduce((acc, r) => acc + (r.growth10Days?.starsGained || 0), 0);
  const total10DayCommits = repos.reduce((acc, r) => acc + (r.commitStats?.commitsLast10Days || 0), 0);
  const avgGrowthPercent = (
    repos.reduce((acc, r) => acc + (r.growth10Days?.percentageGrowth || 0), 0) / Math.max(1, repos.length)
  ).toFixed(1);

  // Sparkline renderer
  const renderSparkline = (data: number[]) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = Math.max(1, max - min);
    const width = 110;
    const height = 30;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-28 h-8 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#sparkGradient)"
          points={`0,${height} ${points} ${width},${height}`}
        />
        <polyline
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <section className="space-y-6">
      {/* Editorial Title & Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Top 10 Growing Projects in Last 10 Days
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl text-balance">
            Real-time star acceleration, commit timelines, and ecosystem surge across open-source repositories audited over the past 10 days.
          </p>
        </div>

        {/* 10-day summary metrics */}
        <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Stars Added
            </div>
            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              +{totalStarsGained.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500">
              10-Day Commits
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {total10DayCommits.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Avg Surge
            </div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              +{avgGrowthPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
        {/* Sort segmented buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">Sort By:</span>
          <button
            onClick={() => setSortBy('starsGained')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              sortBy === 'starsGained'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Stars Gained
          </button>
          <button
            onClick={() => setSortBy('percentageGrowth')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              sortBy === 'percentageGrowth'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            % Growth
          </button>
          <button
            onClick={() => setSortBy('commitsLast10Days')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              sortBy === 'commitsLast10Days'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recent Commits
          </button>
        </div>

        {/* Language Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Language:</span>
          {['all', 'Python', 'Rust', 'TypeScript', 'Go', 'Zig'].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedLanguage.toLowerCase() === lang.toLowerCase()
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'all' ? 'All' : lang}
            </button>
          ))}
        </div>
      </div>

      {/* Top 10 High-Density Leaderboard Grid */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50">
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {list.map((repo, index) => {
            const isCompared = comparedRepoIds.includes(repo.id);
            const rank = repo.growth10Days?.rank || index + 1;
            const starsGained = repo.growth10Days?.starsGained || 0;
            const pct = repo.growth10Days?.percentageGrowth || 0;
            const commits10 = repo.commitStats?.commitsLast10Days || 0;

            return (
              <div
                key={repo.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Rank, Avatar, Title & Metadata */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Rank Index */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {rank <= 3 ? (
                      <span className="text-indigo-600 dark:text-indigo-400">#{rank}</span>
                    ) : (
                      <span>#{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <img
                    src={repo.owner.avatar_url}
                    alt={repo.owner.login}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                  />

                  {/* Name and Description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectRepo(repo)}
                        className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left truncate"
                      >
                        {repo.full_name}
                      </button>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        title="View on GitHub"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {repo.description || 'No description provided.'}
                    </p>

                    {/* Unboxed Metadata with Typographic Separators */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{repo.language || 'Multi-language'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{repo.stargazers_count.toLocaleString()} stars total</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{repo.forks_count.toLocaleString()} forks</span>
                      <span aria-hidden="true">·</span>
                      <span>Health score {repo.healthScore}/100</span>
                      {repo.license && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{repo.license.spdx_id || repo.license.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center / Right: 10-Day Sparkline, Metrics, and Action Buttons */}
                <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80">
                  {/* Daily Sparkline */}
                  <div className="hidden sm:block text-right">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      10-Day Trajectory
                    </div>
                    {repo.growth10Days?.dailySparkline && renderSparkline(repo.growth10Days.dailySparkline)}
                  </div>

                  {/* Velocity Stats */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+{starsGained.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      +{pct}% growth · {commits10} commits
                    </div>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectRepo(repo)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Inspect commit timeline and stats"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Inspect</span>
                    </button>

                    <button
                      onClick={() => onCompareRepo(repo)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isCompared
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isCompared ? 'Compared' : 'Compare'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
