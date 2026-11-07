import React from 'react';
import { Download, Sliders, Moon, Sun, Key } from 'lucide-react';
import { RateLimitInfo } from '../services/githubService';

interface HeaderProps {
  activeTab: 'growth' | 'explorer' | 'timeline' | 'compare';
  setActiveTab: (tab: 'growth' | 'explorer' | 'timeline' | 'compare') => void;
  onOpenExportModal: () => void;
  onOpenTokenModal: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  rateLimit: RateLimitInfo;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  onOpenTokenModal,
  isDark,
  toggleTheme,
  rateLimit,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#growth"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('growth');
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
            </svg>
          </div>
          <span>GitPulse</span>
        </a>
      </div>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('growth')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
            activeTab === 'growth'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Top 10 Growing
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
            activeTab === 'explorer'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Repository Explorer
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
            activeTab === 'timeline'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Commit Timelines
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
            activeTab === 'compare'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Compare Matrix
        </button>
      </nav>

      {/* Zone 3: 1 primary action + utility buttons */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenTokenModal}
          title={`API Rate limit: ${rateLimit.remaining}/${rateLimit.limit} requests`}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono tabular-nums"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{rateLimit.remaining} req</span>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PDF Report</span>
        </button>
      </div>
    </header>
  );
};
