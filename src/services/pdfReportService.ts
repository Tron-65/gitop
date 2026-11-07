import { jsPDF } from 'jspdf';
import { Repository, PdfExportOptions } from '../types/github';

export function generatePdfReport(
  repos: Repository[],
  options: PdfExportOptions,
  top10Repos: Repository[]
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [79, 70, 229]; // Indigo 600
  const secondaryColor = [71, 85, 105]; // Slate 600
  const borderColor = [226, 232, 240]; // Slate 200
  const tableHeaderBg = [241, 245, 249]; // Slate 100

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      currentY = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('GITPULSE · EXECUTIVE REPOSITORY INTELLIGENCE REPORT', margin, 10);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    doc.text(dateStr, pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  const drawPageFooter = (pageNum: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      `Confidential & Proprietary · Prepared by ${options.preparedBy || 'GitPulse Intelligence Engine'}`,
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    });
  };

  // COVER / EXECUTIVE HEADER
  drawPageHeader();
  currentY = 20;

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(options.reportTitle || 'GitHub Repository Intelligence Report', margin, currentY);
  currentY += 8;

  // Subtitle & Meta info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const subtitle = `Analysis Period: Last 10 Days to 52-Week Trajectory · Scope: ${repos.length} Repositories Evaluated`;
  doc.text(subtitle, margin, currentY);
  currentY += 5;

  if (options.organizationName) {
    doc.text(`Organization: ${options.organizationName}`, margin, currentY);
    currentY += 5;
  }
  currentY += 4;

  // Horizontal Accent Bar
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(1.5);
  doc.line(margin, currentY, margin + 40, currentY);
  currentY += 8;

  // EXECUTIVE KPI CARDS GRID (4 blocks across)
  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const totalForks = repos.reduce((acc, r) => acc + r.forks_count, 0);
  const total10DayCommits = repos.reduce((acc, r) => acc + (r.commitStats?.commitsLast10Days || 0), 0);
  const fastestGrowing = [...top10Repos].sort((a, b) =>
    (b.growth10Days?.starsGained || 0) - (a.growth10Days?.starsGained || 0)
  )[0];

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 22;

  const kpis = [
    { label: 'EVALUATED STARS', val: totalStars.toLocaleString(), sub: `${repos.length} core repos` },
    { label: 'TOTAL FORKS', val: totalForks.toLocaleString(), sub: 'Fork ecosystem reach' },
    { label: '10-DAY COMMITS', val: total10DayCommits.toLocaleString(), sub: 'Recent code velocity' },
    {
      label: 'FASTEST GROWING',
      val: fastestGrowing ? fastestGrowing.name : 'N/A',
      sub: fastestGrowing?.growth10Days ? `+${fastestGrowing.growth10Days.starsGained.toLocaleString()} stars` : 'High velocity',
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(kpi.label, cardX + 3.5, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(kpi.val, cardX + 3.5, currentY + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(kpi.sub, cardX + 3.5, currentY + 18);
  });

  currentY += cardHeight + 8;

  // SECTION 1: TOP 10 GROWING PROJECTS IN LAST 10 DAYS
  if (options.includeTop10Growth && top10Repos.length > 0) {
    checkPageBreak(70);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. Top 10 Growing Projects (Last 10 Days Trajectory)', margin, currentY);
    currentY += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      'Ranked by net star velocity, sustained commit cadence, and community acceleration over the 10-day audit cycle.',
      margin,
      currentY + 2
    );
    currentY += 7;

    // Structured Table
    const colWidths = [12, 58, 26, 26, 24, 32];
    const headers = ['#', 'Repository', 'Total Stars', '10-Day Gain', 'Language', 'Cadence'];
    const rowHeight = 7.5;

    // Table Header
    doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    let xPos = margin;
    headers.forEach((h, i) => {
      doc.text(h, xPos + 2, currentY + 5);
      xPos += colWidths[i];
    });
    currentY += rowHeight;

    // Rows
    top10Repos.slice(0, 10).forEach((repo, idx) => {
      checkPageBreak(rowHeight + 2);

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

      let colX = margin;
      // Rank
      doc.text(String(idx + 1), colX + 2, currentY + 5);
      colX += colWidths[0];

      // Repo name
      const nameText = repo.full_name.length > 28 ? repo.name : repo.full_name;
      doc.text(nameText, colX + 2, currentY + 5);
      colX += colWidths[1];

      // Stars
      doc.setFont('helvetica', 'normal');
      doc.text(repo.stargazers_count.toLocaleString(), colX + 2, currentY + 5);
      colX += colWidths[2];

      // 10-day gain
      const gain = repo.growth10Days?.starsGained || 0;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`+${gain.toLocaleString()}`, colX + 2, currentY + 5);
      colX += colWidths[3];

      // Language
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(repo.language || 'Multi', colX + 2, currentY + 5);
      colX += colWidths[4];

      // Cadence
      const cadence = repo.commitStats?.cadenceScore || 'Steady';
      doc.text(`${cadence} (${repo.commitStats?.commitsLast10Days || 0} commits)`, colX + 2, currentY + 5);

      currentY += rowHeight;
    });

    currentY += 8;
  }

  // SECTION 2: COMMIT TIMELINES & ACTIVITY AUDIT
  if (options.includeCommitTimelines) {
    checkPageBreak(65);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. Commit Activity Timelines & Maintenance Health', margin, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      'Evaluating 4-week active velocity, weekly push volumes, and issue-to-resolution stability index.',
      margin,
      currentY + 1
    );
    currentY += 7;

    const commitCols = [60, 28, 28, 28, 34];
    const commitHeaders = ['Repository', 'Last 10 Days', 'Last 30 Days', 'Active Health', 'Status Index'];
    const commitRowHeight = 7.5;

    // Header
    doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
    doc.rect(margin, currentY, contentWidth, commitRowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    let xP = margin;
    commitHeaders.forEach((h, i) => {
      doc.text(h, xP + 2, currentY + 5);
      xP += commitCols[i];
    });
    currentY += commitRowHeight;

    repos.slice(0, 8).forEach((repo, idx) => {
      checkPageBreak(commitRowHeight + 2);

      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, currentY, contentWidth, commitRowHeight, 'F');
      }

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + commitRowHeight, margin + contentWidth, currentY + commitRowHeight);

      let cX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(repo.full_name, cX + 2, currentY + 5);
      cX += commitCols[0];

      doc.setFont('helvetica', 'normal');
      doc.text(`${repo.commitStats?.commitsLast10Days || 0} commits`, cX + 2, currentY + 5);
      cX += commitCols[1];

      doc.text(`${repo.commitStats?.commitsLast30Days || 0} commits`, cX + 2, currentY + 5);
      cX += commitCols[2];

      const health = repo.healthScore || 90;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(health >= 90 ? 22 : 180, health >= 90 ? 101 : 83, health >= 90 ? 52 : 9);
      doc.text(`${health}/100`, cX + 2, currentY + 5);
      cX += commitCols[3];

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      const issueRatio = ((repo.open_issues_count / Math.max(1, repo.stargazers_count)) * 100).toFixed(2);
      doc.text(`${repo.open_issues_count} open (${issueRatio}%)`, cX + 2, currentY + 5);

      currentY += commitRowHeight;
    });

    currentY += 8;
  }

  // SECTION 3: LANGUAGE DISTRIBUTION & TECHNOLOGY COMPOSITION
  if (options.includeLanguageStats) {
    checkPageBreak(45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. Technology Composition & Language Breakdown', margin, currentY);
    currentY += 4;

    // Aggregate languages
    const langCounts: Record<string, number> = {};
    repos.forEach((r) => {
      const l = r.language || 'Other';
      langCounts[l] = (langCounts[l] || 0) + 1;
    });

    const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const langSummary = sortedLangs
      .map(([lang, count]) => `${lang}: ${count} (${Math.round((count / repos.length) * 100)}%)`)
      .join(' · ');
    doc.text(langSummary, margin, currentY + 2);
    currentY += 8;

    // Draw visual language bar
    const barHeight = 6;
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(margin, currentY, contentWidth, barHeight, 1, 1, 'S');

    const langPalette: Record<string, number[]> = {
      Python: [53, 114, 165],
      Rust: [222, 85, 39],
      TypeScript: [49, 120, 198],
      JavaScript: [241, 224, 90],
      Go: [0, 173, 216],
      Zig: [236, 145, 61],
      C: [85, 85, 85],
      'C++': [243, 75, 125],
    };

    let startX = margin;
    sortedLangs.forEach(([lang, count]) => {
      const fraction = count / repos.length;
      const width = contentWidth * fraction;
      const rgb = langPalette[lang] || [148, 163, 184];
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(startX, currentY, width, barHeight, 'F');
      startX += width;
    });

    currentY += barHeight + 8;
  }

  // OPTIONAL NOTES
  if (options.notes) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Executive Analyst Notes & Methodology:', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const splitNotes = doc.splitTextToSize(options.notes, contentWidth);
    doc.text(splitNotes, margin, currentY);
    currentY += splitNotes.length * 4 + 4;
  }

  // Draw footers on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(i, totalPages);
  }

  return doc;
}
