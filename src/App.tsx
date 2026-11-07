import React, { useState, useEffect } from 'react';
import { Repository } from './types/github';
import { githubService, RateLimitInfo } from './services/githubService';
import { Header } from './components/Header';
import { TopGrowingSection } from './components/TopGrowingSection';
import { RepoExplorer } from './components/RepoExplorer';
import { CommitTimelineChart } from './components/CommitTimelineChart';
import { CompareModal } from './components/CompareModal';
import { RepoDetailModal } from './components/RepoDetailModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { TokenSettingsModal } from './components/TokenSettingsModal';
import { TOP_10_GROWING_REPOS, POPULAR_SEED_REPOS } from './services/mockData';
import { TrendingUp, Compass, Activity, Layers, Download, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'growth' | 'explorer' | 'timeline' | 'compare'>('growth');
  const [top10Repos, setTop10Repos] = useState<Repository[]>(TOP_10_GROWING_REPOS);
  const [allRepos, setAllRepos] = useState<Repository[]>(POPULAR_SEED_REPOS);
  const [comparedRepos, setComparedRepos] = useState<Repository[]>([
    TOP_10_GROWING_REPOS[0],
    TOP_10_GROWING_REPOS[1],
  ]);
  const [inspectingRepo, setInspectingRepo] = useState<Repository | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo>({
    limit: 60,
    remaining: 60,
    resetTime: null,
    used: 0,
  });

  // Dark mode synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Initial Data Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const top10 = await githubService.getTop10Growing();
      if (top10 && top10.length > 0) {
        setTop10Repos(top10);
      }
      const initialCatalog = await githubService.searchRepos('');
      if (initialCatalog && initialCatalog.length > 0) {
        setAllRepos(initialCatalog);
      }
      setRateLimit(githubService.getRateLimitInfo());
    } catch (err) {
      console.warn('Initial load error, seed data is already active', err);
    }
  };

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Compare toggling
  const handleToggleCompare = (repo: Repository) => {
    if (comparedRepos.some((r) => r.id === repo.id)) {
      setComparedRepos((prev) => prev.filter((r) => r.id !== repo.id));
    } else {
      if (comparedRepos.length >= 4) {
        alert('You can compare up to 4 repositories simultaneously.');
        return;
      }
      setComparedRepos((prev) => [...prev, repo]);
    }
  };

  const handleRemoveCompared = (repoId: number) => {
    setComparedRepos((prev) => prev.filter((r) => r.id !== repoId));
  };

  // Live GitHub Search query
  const handleCustomSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await githubService.searchRepos(query);
      if (results && results.length > 0) {
        setAllRepos(results);
      }
      setRateLimit(githubService.getRateLimitInfo());
    } catch (err) {
      console.warn('Search query error', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 3-Zone Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        isDark={isDark}
        toggleTheme={handleToggleTheme}
        rateLimit={rateLimit}
      />

      {/* Hero / Quick Navigation Bar for Mobile & Compact Screens */}
      <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('growth')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'growth'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Top 10 Growing
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'explorer'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Explorer
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Commit Timelines
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
            activeTab === 'compare'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Compare ({comparedRepos.length})
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* VIEW 1: TOP 10 GROWING IN LAST 10 DAYS */}
        {activeTab === 'growth' && (
          <TopGrowingSection
            repos={top10Repos}
            onSelectRepo={(r) => setInspectingRepo(r)}
            onCompareRepo={handleToggleCompare}
            comparedRepoIds={comparedRepos.map((r) => r.id)}
          />
        )}

        {/* VIEW 2: REPOSITORY EXPLORER */}
        {activeTab === 'explorer' && (
          <RepoExplorer
            repos={allRepos}
            onSelectRepo={(r) => setInspectingRepo(r)}
            onCompareRepo={handleToggleCompare}
            comparedRepoIds={comparedRepos.map((r) => r.id)}
            onSearchCustom={handleCustomSearch}
            isSearching={isSearching}
          />
        )}

        {/* VIEW 3: COMMIT TIMELINES */}
        {activeTab === 'timeline' && (
          <CommitTimelineChart
            selectedRepo={inspectingRepo || allRepos[0]}
            allRepos={allRepos}
            onSelectRepo={(r) => setInspectingRepo(r)}
          />
        )}

        {/* VIEW 4: COMPARISON MATRIX */}
        {activeTab === 'compare' && (
          <CompareModal
            comparedRepos={comparedRepos}
            onClose={() => setActiveTab('explorer')}
            onRemoveRepo={handleRemoveCompared}
            onSelectRepo={(r) => setInspectingRepo(r)}
            onOpenPdfReport={() => setIsExportModalOpen(true)}
          />
        )}
      </main>

      {/* Detail Inspector Modal */}
      {inspectingRepo && (
        <RepoDetailModal
          repo={inspectingRepo}
          onClose={() => setInspectingRepo(null)}
          onCompare={handleToggleCompare}
          isCompared={comparedRepos.some((r) => r.id === inspectingRepo.id)}
        />
      )}

      {/* Export to PDF Modal */}
      {isExportModalOpen && (
        <ExportPdfModal
          repos={allRepos}
          top10Repos={top10Repos}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Token Settings & Rate Limit Modal */}
      {isTokenModalOpen && (
        <TokenSettingsModal
          onClose={() => setIsTokenModalOpen(false)}
          rateLimit={rateLimit}
          onTokenUpdated={loadData}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">GitPulse</span>
            <span aria-hidden="true">·</span>
            <span>Open Source Repository Intelligence & Growth Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              Export PDF Report
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-mono"
            >
              API Quota ({rateLimit.remaining}/{rateLimit.limit})
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
