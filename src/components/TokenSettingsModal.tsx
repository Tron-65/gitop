import React, { useState } from 'react';
import { githubService, RateLimitInfo } from '../services/githubService';
import { X, Key, ShieldCheck, ExternalLink, Check } from 'lucide-react';

interface TokenSettingsModalProps {
  onClose: () => void;
  rateLimit: RateLimitInfo;
  onTokenUpdated: () => void;
}

export const TokenSettingsModal: React.FC<TokenSettingsModalProps> = ({
  onClose,
  rateLimit,
  onTokenUpdated,
}) => {
  const [tokenInput, setTokenInput] = useState(githubService.getToken());
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    githubService.setToken(tokenInput);
    setSaved(true);
    onTokenUpdated();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    githubService.setToken('');
    setTokenInput('');
    onTokenUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              GitHub API & Rate Limits
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Rate Limit Stats Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span>Remaining Requests:</span>
              <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">
                {rateLimit.remaining} / {rateLimit.limit} req/hr
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${Math.max(5, (rateLimit.remaining / Math.max(1, rateLimit.limit)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Unauthenticated requests are capped at 60/hr by GitHub. Providing a Personal Access Token increases this to 5,000/hr.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Personal Access Token (Optional):
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Stored strictly in your local browser storage. No server transmission.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {tokenInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Token
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1.5"
                >
                  {saved ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{saved ? 'Saved' : 'Save Token'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
