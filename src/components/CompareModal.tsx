import React from 'react';
import { Repository } from '../types/github';
import { X, Trash2, ArrowUpRight, Star, GitCommit, GitFork, Shield, ExternalLink } from 'lucide-react';

interface CompareModalProps {
  comparedRepos: Repository[];
  onClose: () => void;
  onRemoveRepo: (repoId: number) => void;
  onSelectRepo: (repo: Repository) => void;
  onOpenPdfReport: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  comparedRepos,
  onClose,
  onRemoveRepo,
  onSelectRepo,
  onOpenPdfReport,
}) => {
  if (comparedRepos.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg mx-auto space-y-4 my-12">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Comparison Deck is Empty
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Click the "Compare" button on any repository in the Top 10 Growth table or Explorer to benchmark projects side-by-side.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          Explore Repositories
        </button>
      </div>
    );
  }

  // Max calculations for bar scaling
  const maxStars = Math.max(...comparedRepos.map((r) => r.stargazers_count), 1);
  const maxCommits = Math.max(...comparedRepos.map((r) => r.commitStats?.commitsLast10Days || 0), 1);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Repository Benchmark Matrix
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Side-by-side performance audit across stars, commit volume, community scale, and maintenance health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPdfReport}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
          >
            Export Comparison to PDF
          </button>
        </div>
      </div>

      {/* Comparison Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparedRepos.map((repo) => {
          const starsPct = (repo.stargazers_count / maxStars) * 100;
          const commitsPct = ((repo.commitStats?.commitsLast10Days || 0) / maxCommits) * 100;

          return (
            <div
              key={repo.id}
              className="p-6 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header with Avatar, Name & Remove button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={repo.owner.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <button
                        onClick={() => onSelectRepo(repo)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block text-left"
                      >
                        {repo.full_name}
                      </button>
                      <div className="text-xs text-slate-500">{repo.language || 'Multi-language'}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveRepo(repo.id)}
                    aria-label="Remove repository from comparison"
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {repo.description || 'No description provided.'}
                </p>

                {/* Star Metric & Relative Benchmark Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Stargazers</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${starsPct}%` }} />
                  </div>
                </div>

                {/* 10-Day Commit Velocity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">10-Day Commits</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {repo.commitStats?.commitsLast10Days || 0} commits
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${commitsPct}%` }} />
                  </div>
                </div>

                {/* Detailed Spec List */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Health Index:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {repo.healthScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cadence Score:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {repo.commitStats?.cadenceScore || 'Steady'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Forks & Network:</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {repo.forks_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Open Issues:</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {repo.open_issues_count.toLocaleString()}
                    </span>
                  </div>
                  {repo.growth10Days && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">10-Day Star Gain:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{repo.growth10Days.starsGained.toLocaleString()} (+{repo.growth10Days.percentageGrowth}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Deep Dive */}
              <div className="pt-3">
                <button
                  onClick={() => onSelectRepo(repo)}
                  className="w-full py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  View Full Deep Dive
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
