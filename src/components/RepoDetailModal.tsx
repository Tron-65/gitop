import React, { useEffect, useState } from 'react';
import { Repository, CommitHistoryItem } from '../types/github';
import { githubService } from '../services/githubService';
import { X, ExternalLink, GitCommit, Star, GitFork, AlertCircle, Shield, Code, CheckCircle } from 'lucide-react';

interface RepoDetailModalProps {
  repo: Repository | null;
  onClose: () => void;
  onCompare: (repo: Repository) => void;
  isCompared: boolean;
}

export const RepoDetailModal: React.FC<RepoDetailModalProps> = ({
  repo,
  onClose,
  onCompare,
  isCompared,
}) => {
  const [commits, setCommits] = useState<CommitHistoryItem[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);

  useEffect(() => {
    if (repo) {
      setLoadingCommits(true);
      githubService.getRecentCommits(repo.full_name)
        .then((data) => setCommits(data))
        .catch(() => setCommits([]))
        .finally(() => setLoadingCommits(false));
    }
  }, [repo]);

  if (!repo) return null;

  // Language Breakdown computation
  const totalLangBytes = Object.values(repo.languagesBreakdown || {}).reduce((a, b) => a + b, 0);
  const langEntries = Object.entries(repo.languagesBreakdown || { [repo.language || 'Code']: 1000 }).map(
    ([name, bytes]) => ({
      name,
      bytes,
      percent: totalLangBytes > 0 ? Number(((bytes / totalLangBytes) * 100).toFixed(1)) : 100,
    })
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Bar */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <img
              src={repo.owner.avatar_url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {repo.full_name}
                </h2>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                {repo.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>Total Stars</span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {repo.stargazers_count.toLocaleString()}
              </div>
              {repo.growth10Days && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  +{repo.growth10Days.starsGained.toLocaleString()} in last 10d
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
                <span>10D Commits</span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {repo.commitStats?.commitsLast10Days || 0}
              </div>
              <div className="text-[11px] text-slate-500">
                {repo.commitStats?.cadenceScore || 'Steady'} Cadence
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-slate-400" />
                <span>Forks & Network</span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {repo.forks_count.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                ~{repo.contributorsCount || 50} active contributors
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Health Index</span>
              </div>
              <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {repo.healthScore}/100
              </div>
              <div className="text-[11px] text-slate-500">
                {repo.open_issues_count} open issues
              </div>
            </div>
          </div>

          {/* Languages Breakdown Bar */}
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
              <span>Codebase Composition & Languages</span>
              <span className="text-[11px] font-normal text-slate-500">
                {langEntries.length} detected languages
              </span>
            </div>

            {/* Visual segmented bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
              {langEntries.map((l, i) => {
                const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-violet-500'];
                return (
                  <div
                    key={l.name}
                    className={`${colors[i % colors.length]} h-full transition-all`}
                    style={{ width: `${Math.max(1, l.percent)}%` }}
                    title={`${l.name}: ${l.percent}%`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-2.5 flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-400">
              {langEntries.map((l, i) => {
                const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-violet-500'];
                return (
                  <div key={l.name} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{l.name}</span>
                    <span className="font-mono tabular-nums text-slate-500">{l.percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Commits Log Stream */}
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-2.5 flex items-center justify-between">
              <span>Recent Commit History Activity</span>
              <span className="text-[11px] font-normal text-slate-500">Direct from repository git head</span>
            </div>

            {loadingCommits ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Fetching latest commits...
              </div>
            ) : commits.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                No recent commits found or rate-limited.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                {commits.map((c) => (
                  <div
                    key={c.sha}
                    className="p-3 text-xs flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                        {c.sha}
                      </span>
                      <span className="text-slate-900 dark:text-white truncate">
                        {c.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-500 shrink-0 text-[11px]">
                      <span>{c.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            Updated: {new Date(repo.updated_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onCompare(repo)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {isCompared ? 'Remove from Comparison' : 'Add to Comparison'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
