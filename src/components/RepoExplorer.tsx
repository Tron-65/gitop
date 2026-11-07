import React, { useState } from 'react';
import { Repository } from '../types/github';
import { Search, Star, GitCommit, SlidersHorizontal, LayoutGrid, List, Layers, ExternalLink, BarChart2 } from 'lucide-react';

interface RepoExplorerProps {
  repos: Repository[];
  onSelectRepo: (repo: Repository) => void;
  onCompareRepo: (repo: Repository) => void;
  comparedRepoIds: number[];
  onSearchCustom: (query: string) => void;
  isSearching: boolean;
}

export const RepoExplorer: React.FC<RepoExplorerProps> = ({
  repos,
  onSelectRepo,
  onCompareRepo,
  comparedRepoIds,
  onSearchCustom,
  isSearching,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [minStars, setMinStars] = useState<number>(0);
  const [commitCadence, setCommitCadence] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'stars' | 'commits' | 'health'>('stars');

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchCustom(searchInput);
  };

  // Filter repos
  const filteredRepos = repos.filter((repo) => {
    // Search text
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      const matchName = repo.full_name.toLowerCase().includes(q);
      const matchDesc = repo.description?.toLowerCase().includes(q);
      const matchTopic = repo.topics?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTopic) return false;
    }

    // Language
    if (selectedLanguage !== 'all' && repo.language?.toLowerCase() !== selectedLanguage.toLowerCase()) {
      return false;
    }

    // Min Stars
    if (repo.stargazers_count < minStars) {
      return false;
    }

    // Commit Cadence Filter
    if (commitCadence !== 'all') {
      const cadence = repo.commitStats?.cadenceScore?.toLowerCase();
      if (cadence !== commitCadence.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Sort
  filteredRepos.sort((a, b) => {
    if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
    if (sortBy === 'commits') return (b.commitStats?.commitsLast10Days || 0) - (a.commitStats?.commitsLast10Days || 0);
    if (sortBy === 'health') return (b.healthScore || 0) - (a.healthScore || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Repository Intelligence Explorer
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Query and filter GitHub projects by star thresholds, commit cadence, and language ecosystem.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR: Search, Star Slider, Cadence & Language */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        {/* Row 1: Search Form + Live GitHub Fetch */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords, topic, or exact repo (e.g. facebook/react, astral-sh/uv)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isSearching ? 'Querying...' : 'Search GitHub'}
          </button>
        </form>

        {/* Row 2: Star Filter Presets & Slider */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          {/* Star Threshold Presets */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Filter by Star Threshold:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                {minStars === 0 ? 'All Stars' : `≥ ${minStars.toLocaleString()} ★`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'All', val: 0 },
                { label: '≥ 5k', val: 5000 },
                { label: '≥ 25k', val: 25000 },
                { label: '≥ 50k', val: 50000 },
                { label: '≥ 100k', val: 100000 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setMinStars(p.val)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer font-mono tabular-nums ${
                    minStars === p.val
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Commit Activity Timeline Cadence Filter */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Commit Activity Cadence:
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'All Cadence', val: 'all' },
                { label: 'Hyperactive', val: 'hyperactive' },
                { label: 'High', val: 'high' },
                { label: 'Steady', val: 'steady' },
              ].map((c) => (
                <button
                  key={c.val}
                  type="button"
                  onClick={() => setCommitCadence(c.val)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                    commitCadence === c.val
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language & Sorting */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Language:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
              >
                <option value="all">All Languages</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Rust">Rust</option>
                <option value="Go">Go</option>
                <option value="JavaScript">JavaScript</option>
                <option value="C++">C++</option>
                <option value="Zig">Zig</option>
                <option value="C">C</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Sort By:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
              >
                <option value="stars">Total Stars</option>
                <option value="commits">Recent Commits</option>
                <option value="health">Health Score</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MATCHING RESULTS COUNT */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div>
          Showing <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">{filteredRepos.length}</span> repositories matching criteria
        </div>
        {comparedRepoIds.length > 0 && (
          <div className="text-indigo-600 dark:text-indigo-400 font-medium">
            {comparedRepoIds.length} repo{comparedRepoIds.length > 1 ? 's' : ''} in comparison deck
          </div>
        )}
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => {
            const isCompared = comparedRepoIds.includes(repo.id);

            return (
              <div
                key={repo.id}
                className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar with Avatar and Name */}
                  <div className="flex items-start gap-3">
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => onSelectRepo(repo)}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer truncate text-left"
                        >
                          {repo.full_name}
                        </button>
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-1 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {repo.language || 'Multi-language'}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {repo.description || 'No repository description available.'}
                  </p>
                </div>

                {/* Key Metrics Strip */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-400 uppercase">Stars</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                        {repo.stargazers_count.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-400 uppercase">10D Commits</div>
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                        {repo.commitStats?.commitsLast10Days || 0}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-400 uppercase">Health</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                        {repo.healthScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectRepo(repo)}
                      className="flex-1 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Inspect Details</span>
                    </button>
                    <button
                      onClick={() => onCompareRepo(repo)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        isCompared
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isCompared ? 'Added' : 'Compare'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-3">Language</th>
                  <th className="py-3 px-3 text-right">Stars</th>
                  <th className="py-3 px-3 text-right">Forks</th>
                  <th className="py-3 px-3 text-right">10D Commits</th>
                  <th className="py-3 px-3">Commit Cadence</th>
                  <th className="py-3 px-3 text-right">Health</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRepos.map((repo) => {
                  const isCompared = comparedRepoIds.includes(repo.id);

                  return (
                    <tr
                      key={repo.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={repo.owner.avatar_url}
                            alt=""
                            className="w-6 h-6 rounded-md shrink-0 bg-slate-100 dark:bg-slate-800"
                          />
                          <button
                            onClick={() => onSelectRepo(repo)}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate max-w-xs text-left"
                          >
                            {repo.full_name}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {repo.language || 'Multi'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 dark:text-white font-bold">
                        {repo.stargazers_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {repo.forks_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                        +{repo.commitStats?.commitsLast10Days || 0}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {repo.commitStats?.cadenceScore || 'Steady'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {repo.healthScore}/100
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectRepo(repo)}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => onCompareRepo(repo)}
                            className={`px-2.5 py-1 rounded cursor-pointer ${
                              isCompared
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isCompared ? 'Added' : 'Compare'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
