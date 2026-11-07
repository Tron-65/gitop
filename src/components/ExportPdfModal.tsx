import React, { useState } from 'react';
import { Repository, PdfExportOptions } from '../types/github';
import { generatePdfReport } from '../services/pdfReportService';
import { X, FileText, Download, CheckCircle, Table, FileSpreadsheet } from 'lucide-react';

interface ExportPdfModalProps {
  repos: Repository[];
  top10Repos: Repository[];
  onClose: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  repos,
  top10Repos,
  onClose,
}) => {
  const [reportTitle, setReportTitle] = useState('GitHub Repository Intelligence & Growth Analysis');
  const [organizationName, setOrganizationName] = useState('Executive Engineering & Product Strategy');
  const [preparedBy, setPreparedBy] = useState('Senior Technical Research Analyst');
  const [includeTop10Growth, setIncludeTop10Growth] = useState(true);
  const [includeCommitTimelines, setIncludeCommitTimelines] = useState(true);
  const [includeLanguageStats, setIncludeLanguageStats] = useState(true);
  const [notes, setNotes] = useState(
    'This report evaluates repository velocity, 10-day community star trajectory, commit cadence health, and language footprint for open-source technical due diligence.'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Generate & Download PDF
  const handleDownloadPdf = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const options: PdfExportOptions = {
        reportTitle,
        organizationName,
        preparedBy,
        includeTop10Growth,
        includeCommitTimelines,
        includeLanguageStats,
        includeComparativeMatrix: true,
        notes,
      };

      const doc = generatePdfReport(repos, options, top10Repos);
      const filename = `gitpulse-intelligence-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Unable to generate PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Export for spreadsheets
  const handleDownloadCsv = () => {
    const headers = ['Rank', 'Name', 'Full Name', 'Language', 'Total Stars', '10-Day Stars Gained', '10-Day Commits', 'Forks', 'Health Score', 'URL'];
    const rows = top10Repos.map((r, i) => [
      i + 1,
      `"${r.name}"`,
      `"${r.full_name}"`,
      `"${r.language || 'Multi'}"`,
      r.stargazers_count,
      r.growth10Days?.starsGained || 0,
      r.commitStats?.commitsLast10Days || 0,
      r.forks_count,
      r.healthScore || 90,
      r.html_url,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gitpulse-data-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Export Executive Intelligence Report
              </h2>
              <p className="text-xs text-slate-500">
                Generate formatted, presentation-grade PDF documents for offline analysis and briefings.
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

        {/* Modal Form */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Report Title:
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Organization / Client:
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Prepared By (Analyst / Team):
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* Sections Inclusion Checkboxes */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Included Report Sections:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTop10Growth}
                    onChange={(e) => setIncludeTop10Growth(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Top 10 Growing Projects (Last 10 Days Trajectory Table)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCommitTimelines}
                    onChange={(e) => setIncludeCommitTimelines(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Commit Activity Timelines & Maintenance Health Audit</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLanguageStats}
                    onChange={(e) => setIncludeLanguageStats(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Technology Composition & Ecosystem Language Breakdown</span>
                </label>
              </div>
            </div>

            {/* Executive Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Executive Analyst Notes & Methodology:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Success Banner */}
          {exportSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Report successfully compiled and downloaded to your device!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-6 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleDownloadCsv}
            type="button"
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Raw CSV</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              type="button"
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
