import React, { useState } from 'react';
import { Repository } from '../types/github';
import { GitCommit, Calendar, Activity, Zap } from 'lucide-react';

interface CommitTimelineChartProps {
  selectedRepo: Repository | null;
  allRepos: Repository[];
  onSelectRepo: (repo: Repository) => void;
}

export const CommitTimelineChart: React.FC<CommitTimelineChartProps> = ({
  selectedRepo,
  allRepos,
  onSelectRepo,
}) => {
  const [activeWindow, setActiveWindow] = useState<'10days' | '30days' | '1year'>('30days');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; count: number; x: number; y: number } | null>(null);

  const currentRepo = selectedRepo || allRepos[0];
  if (!currentRepo) return null;

  // Generate timeline points based on active window
  interface TimelinePoint {
    label: string;
    commits: number;
    sublabel?: string;
  }

  let timelinePoints: TimelinePoint[] = [];

  if (activeWindow === '10days') {
    // 10 day breakdown
    const base = currentRepo.commitStats?.commitsLast10Days || 30;
    const daily = currentRepo.growth10Days?.dailySparkline || [3, 4, 6, 5, 7, 4, 5, 6, 8, 5];
    timelinePoints = daily.map((val, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (9 - i));
      const dateName = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        label: dateName,
        commits: Math.max(1, Math.round((val / 100) + (i % 3) * 2)),
      };
    });
  } else if (activeWindow === '30days') {
    // 4 weeks breakdown
    const weeks = currentRepo.commitStats?.weeklyCommits || [
      { week: 1, days: [4, 5, 6, 4, 5, 2, 1], total: 27 },
      { week: 2, days: [5, 6, 7, 5, 6, 3, 2], total: 34 },
      { week: 3, days: [6, 7, 8, 7, 6, 2, 3], total: 39 },
      { week: 4, days: [7, 9, 10, 8, 6, 3, 4], total: 47 },
    ];
    // Flatten days into 28 points
    let dayCount = 0;
    weeks.forEach((w, wIdx) => {
      w.days.forEach((cnt, dIdx) => {
        dayCount++;
        const d = new Date();
        d.setDate(d.getDate() - (28 - dayCount));
        timelinePoints.push({
          label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          sublabel: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dIdx],
          commits: cnt,
        });
      });
    });
  } else {
    // 1 year (12 months approximation)
    const totalYear = currentRepo.commitStats?.totalCommitsLastYear || 1200;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    timelinePoints = months.map((m, i) => {
      const variation = 0.7 + Math.sin(i * 0.8) * 0.4 + (i > 8 ? 0.3 : 0);
      return {
        label: m,
        commits: Math.round((totalYear / 12) * variation),
      };
    });
  }

  // Chart Dimensions
  const chartWidth = 800;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const maxCommits = Math.max(...timelinePoints.map((p) => p.commits), 5);

  const getX = (index: number) => paddingX + (index / (timelinePoints.length - 1)) * usableWidth;
  const getY = (val: number) => paddingY + usableHeight - (val / maxCommits) * usableHeight;

  // Build SVG Path
  const pointsString = timelinePoints.map((p, i) => `${getX(i)},${getY(p.commits)}`).join(' ');
  const areaPath = `M ${getX(0)},${chartHeight - paddingY} L ${pointsString} L ${getX(
    timelinePoints.length - 1
  )},${chartHeight - paddingY} Z`;

  // Punchcard Days Matrix
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekTotals = currentRepo.commitStats?.weeklyCommits?.[0]?.days || [6, 8, 12, 10, 9, 3, 4];

  return (
    <div className="space-y-6">
      {/* Title & Repo Quick Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Commit Activity Timeline & Cadence
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Interactive commit frequency curves, developer velocity metrics, and punchcard habits.
          </p>
        </div>

        {/* Selected Repo Pill Dropdown / Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Inspecting:</label>
          <select
            value={currentRepo.full_name}
            onChange={(e) => {
              const matched = allRepos.find((r) => r.full_name === e.target.value);
              if (matched) onSelectRepo(matched);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white cursor-pointer"
          >
            {allRepos.map((r) => (
              <option key={r.id} value={r.full_name}>
                {r.full_name} ({r.stargazers_count.toLocaleString()} ★)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chart Box */}
      <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        {/* Timeline Header with Timeframe Tabs & KPI Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {currentRepo.full_name}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{currentRepo.commitStats?.cadenceScore || 'Steady'} Cadence</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {currentRepo.commitStats?.commitsLast10Days || 0} commits in last 10 days
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {currentRepo.commitStats?.totalCommitsLastYear.toLocaleString() || 0} annual
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveWindow('10days')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeWindow === '10days'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 10 Days
            </button>
            <button
              onClick={() => setActiveWindow('30days')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeWindow === '30days'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setActiveWindow('1year')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeWindow === '1year'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1-Year Cadence
            </button>
          </div>
        </div>

        {/* Responsive Interactive SVG Area Chart */}
        <div className="relative w-full overflow-x-auto pt-2">
          <svg
            className="w-full h-56 min-w-[600px] overflow-visible"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingY + usableHeight * (1 - pct);
              const val = Math.round(maxCommits * pct);
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#areaGradient)" />

            {/* Continuous Line */}
            <path
              d={`M ${pointsString}`}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Nodes */}
            {timelinePoints.map((pt, i) => {
              const cx = getX(i);
              const cy = getY(pt.commits);
              const isHovered = hoveredPoint?.label === pt.label;

              return (
                <g key={i}>
                  {/* Subtle vertical indicator on hover */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={paddingY}
                      x2={cx}
                      y2={chartHeight - paddingY}
                      stroke="#818cf8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 3}
                    className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 cursor-pointer transition-all"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredPoint({ label: pt.label, count: pt.commits, x: cx, y: cy })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* X Axis Labels */}
                  {(i === 0 || i === timelinePoints.length - 1 || i % Math.max(1, Math.floor(timelinePoints.length / 6)) === 0) && (
                    <text
                      x={cx}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 font-mono"
              style={{
                left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                marginTop: '-10px',
              }}
            >
              <div className="font-semibold text-indigo-300">{hoveredPoint.count} commits</div>
              <div className="text-[10px] text-slate-400">{hoveredPoint.label}</div>
            </div>
          )}
        </div>

        {/* Day-of-Week Punchcard Habit Matrix */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
            <span>Commit Distribution by Day of Week</span>
            <span className="text-[11px] font-normal text-slate-500">Peak cadence on mid-week development sprints</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dayLabels.map((day, idx) => {
              const val = weekTotals[idx] || 0;
              const intensity = Math.min(100, (val / 15) * 100);
              return (
                <div
                  key={day}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center"
                >
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{day}</div>
                  <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {val}
                  </div>
                  <div className="mt-1.5 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full"
                      style={{ width: `${Math.max(10, intensity)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
