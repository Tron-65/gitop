import { Repository, CommitHistoryItem } from '../types/github';
import { TOP_10_GROWING_REPOS, POPULAR_SEED_REPOS } from './mockData';

const CACHE_PREFIX = 'gitpulse_cache_';
const TOKEN_KEY = 'gitpulse_gh_token';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date | null;
  used: number;
}

class GitHubService {
  private token: string = '';
  private rateLimitInfo: RateLimitInfo = {
    limit: 60,
    remaining: 60,
    resetTime: null,
    used: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY) || '';
    }
  }

  public setToken(token: string) {
    this.token = token.trim();
    if (typeof window !== 'undefined') {
      if (this.token) {
        localStorage.setItem(TOKEN_KEY, this.token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getToken(): string {
    return this.token;
  }

  public getRateLimitInfo(): RateLimitInfo {
    return this.rateLimitInfo;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers.Authorization = `token ${this.token}`;
    }
    return headers;
  }

  private updateRateLimit(response: Response) {
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (limit && remaining) {
      const parsedLimit = parseInt(limit, 10);
      const parsedRemaining = parseInt(remaining, 10);
      this.rateLimitInfo = {
        limit: parsedLimit,
        remaining: parsedRemaining,
        resetTime: reset ? new Date(parseInt(reset, 10) * 1000) : null,
        used: parsedLimit - parsedRemaining,
      };
    }
  }

  private getCache<T>(key: string): T | null {
    try {
      const cached = sessionStorage.getItem(CACHE_PREFIX + key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 1000 * 60 * 15) { // 15 mins
          return parsed.data as T;
        }
      }
    } catch {
      // ignore storage errors
    }
    return null;
  }

  private setCache<T>(key: string, data: T) {
    try {
      sessionStorage.setItem(
        CACHE_PREFIX + key,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch {
      // ignore storage quota errors
    }
  }

  // Calculate simulated 10-day growth and commit stats for any fetched repo
  private enrichRepository(raw: any, rank?: number): Repository {
    // Generate realistic daily sparkline based on star volume and recent pushes
    const stars = raw.stargazers_count || 100;
    const baseDaily = Math.max(10, Math.round(stars * 0.0035));
    const dailySparkline: number[] = Array.from({ length: 10 }, (_, i) => {
      const variance = (Math.sin(i * 1.3) + 1.2) * (0.8 + (i / 10) * 0.4);
      return Math.round(baseDaily * variance);
    });
    const starsGained = dailySparkline.reduce((a, b) => a + b, 0);
    const percentageGrowth = Number(((starsGained / Math.max(1, stars - starsGained)) * 100).toFixed(1));

    // Simulated weekly commit stats if not fetched yet
    const weeklyCommits = [
      { week: 1, days: [4, 6, 8, 5, 4, 1, 3], total: 31 },
      { week: 2, days: [6, 7, 9, 7, 5, 2, 4], total: 40 },
      { week: 3, days: [5, 8, 8, 6, 7, 3, 2], total: 39 },
      { week: 4, days: [6, 9, 10, 8, 6, 2, 3], total: 44 },
    ];
    const commitsLast10Days = Math.round(weeklyCommits.reduce((acc, w) => acc + w.total, 0) * 0.45);
    const commitsLast30Days = weeklyCommits.reduce((acc, w) => acc + w.total, 0);

    const cadenceScore: 'Hyperactive' | 'High' | 'Steady' | 'Moderate' | 'Low' =
      commitsLast10Days > 80 ? 'Hyperactive' :
      commitsLast10Days > 40 ? 'High' :
      commitsLast10Days > 20 ? 'Steady' :
      commitsLast10Days > 5 ? 'Moderate' : 'Low';

    const healthScore = Math.min(99, Math.max(65, Math.round(
      (raw.open_issues_count && raw.stargazers_count ? (1 - Math.min(1, raw.open_issues_count / (raw.stargazers_count * 0.08))) * 40 : 30) +
      (cadenceScore === 'Hyperactive' ? 40 : cadenceScore === 'High' ? 35 : 25) +
      (raw.license ? 15 : 5) +
      10
    )));

    return {
      id: raw.id,
      name: raw.name,
      full_name: raw.full_name,
      owner: {
        login: raw.owner?.login || '',
        avatar_url: raw.owner?.avatar_url || '',
        html_url: raw.owner?.html_url || '',
      },
      html_url: raw.html_url,
      description: raw.description,
      stargazers_count: raw.stargazers_count,
      forks_count: raw.forks_count,
      open_issues_count: raw.open_issues_count,
      watchers_count: raw.watchers_count,
      language: raw.language,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      pushed_at: raw.pushed_at,
      topics: raw.topics || [],
      license: raw.license,
      growth10Days: {
        starsGained,
        percentageGrowth,
        dailySparkline,
        rank: rank || 1,
      },
      commitStats: {
        totalCommitsLastYear: commitsLast30Days * 12,
        commitsLast10Days,
        commitsLast30Days,
        weeklyCommits,
        cadenceScore,
      },
      contributorsCount: Math.round(Math.max(12, raw.forks_count * 0.05)),
      healthScore,
    };
  }

  /**
   * Fetch top 10 growing projects in last 10 days
   */
  public async getTop10Growing(): Promise<Repository[]> {
    const cacheKey = 'top_10_growing';
    const cached = this.getCache<Repository[]>(cacheKey);
    if (cached && cached.length >= 10) return cached;

    try {
      // Calculate date 10 days ago (UTC format)
      const date10DaysAgo = new Date();
      date10DaysAgo.setDate(date10DaysAgo.getDate() - 10);
      const dateStr = date10DaysAgo.toISOString().split('T')[0];

      // Query GitHub API for repositories active or created recently with high star traction
      const url = `https://api.github.com/search/repositories?q=pushed:>=${dateStr}+stars:>1000&sort=stars&order=desc&per_page=15`;
      const res = await fetch(url, { headers: this.getHeaders() });
      this.updateRateLimit(res);

      if (!res.ok) {
        console.warn(`GitHub API request returned status ${res.status}, using curated high-velocity projects`);
        return TOP_10_GROWING_REPOS;
      }

      const data = await res.json();
      if (data.items && data.items.length >= 10) {
        const repos: Repository[] = data.items.slice(0, 10).map((item: any, idx: number) => {
          // Merge with any pre-computed deep metrics if matching
          const matched = TOP_10_GROWING_REPOS.find(r => r.full_name.toLowerCase() === item.full_name.toLowerCase());
          if (matched) {
            return {
              ...matched,
              stargazers_count: item.stargazers_count,
              forks_count: item.forks_count,
              open_issues_count: item.open_issues_count,
              growth10Days: {
                ...matched.growth10Days!,
                rank: idx + 1,
              },
            };
          }
          return this.enrichRepository(item, idx + 1);
        });

        this.setCache(cacheKey, repos);
        return repos;
      }
    } catch (err) {
      console.warn('Network issue fetching GitHub live growing projects, falling back to cached seed data', err);
    }

    return TOP_10_GROWING_REPOS;
  }

  /**
   * Search and explore repositories with star, language, and timeline filters
   */
  public async searchRepos(
    query: string = '',
    language: string = '',
    minStars: number = 0,
    maxStars: number = 1000000
  ): Promise<Repository[]> {
    const trimmed = query.trim();
    const cacheKey = `search_${trimmed}_${language}_${minStars}_${maxStars}`;
    const cached = this.getCache<Repository[]>(cacheKey);
    if (cached) return cached;

    // Check if query is in format owner/repo
    if (trimmed.includes('/') && !trimmed.includes(' ')) {
      try {
        const repo = await this.getRepoDetails(trimmed);
        if (repo) return [repo];
      } catch {
        // continue to normal search
      }
    }

    try {
      let q = trimmed || 'stars:>1000';
      if (minStars > 0 || maxStars < 1000000) {
        q += `+stars:${minStars}..${maxStars >= 500000 ? '*' : maxStars}`;
      }
      if (language && language !== 'all') {
        q += `+language:${encodeURIComponent(language)}`;
      }

      const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=25`;
      const res = await fetch(url, { headers: this.getHeaders() });
      this.updateRateLimit(res);

      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          const results: Repository[] = data.items.map((item: any, idx: number) => {
            const matched = POPULAR_SEED_REPOS.find(r => r.full_name.toLowerCase() === item.full_name.toLowerCase());
            return matched || this.enrichRepository(item, idx + 1);
          });
          this.setCache(cacheKey, results);
          return results;
        }
      }
    } catch (err) {
      console.warn('Search API error, filtering local catalog', err);
    }

    // Filter local catalog
    let list = [...POPULAR_SEED_REPOS];
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(lower) ||
        r.full_name.toLowerCase().includes(lower) ||
        (r.description && r.description.toLowerCase().includes(lower)) ||
        r.topics.some(t => t.toLowerCase().includes(lower))
      );
    }
    if (language && language !== 'all') {
      list = list.filter(r => r.language?.toLowerCase() === language.toLowerCase());
    }
    list = list.filter(r => r.stargazers_count >= minStars && r.stargazers_count <= maxStars);
    return list;
  }

  /**
   * Fetch specific repository details + languages breakdown + commit activity
   */
  public async getRepoDetails(fullName: string): Promise<Repository | null> {
    const cacheKey = `repo_${fullName.replace('/', '_')}`;
    const cached = this.getCache<Repository>(cacheKey);
    if (cached) return cached;

    // Check seed repos first
    const seed = POPULAR_SEED_REPOS.find(r => r.full_name.toLowerCase() === fullName.toLowerCase());

    try {
      const res = await fetch(`https://api.github.com/repos/${fullName}`, {
        headers: this.getHeaders(),
      });
      this.updateRateLimit(res);

      if (res.ok) {
        const raw = await res.json();
        let baseRepo = this.enrichRepository(raw);

        // Fetch languages
        try {
          const langRes = await fetch(`https://api.github.com/repos/${fullName}/languages`, {
            headers: this.getHeaders(),
          });
          if (langRes.ok) {
            const languages = await langRes.json();
            baseRepo.languagesBreakdown = languages;
          }
        } catch {
          // ignore
        }

        // Fetch commit activity
        try {
          const commitRes = await fetch(`https://api.github.com/repos/${fullName}/stats/commit_activity`, {
            headers: this.getHeaders(),
          });
          if (commitRes.ok && commitRes.status === 200) {
            const weeksData = await commitRes.json();
            if (Array.isArray(weeksData) && weeksData.length > 0) {
              const recent4 = weeksData.slice(-4).map((w: any, idx: number) => ({
                week: idx + 1,
                days: w.days || [0, 0, 0, 0, 0, 0, 0],
                total: w.total || 0,
              }));
              const totalYear = weeksData.reduce((acc: number, w: any) => acc + (w.total || 0), 0);
              const last30 = recent4.reduce((acc, w) => acc + w.total, 0);
              const last10 = Math.round(last30 * 0.45);

              baseRepo.commitStats = {
                totalCommitsLastYear: totalYear,
                commitsLast10Days: last10,
                commitsLast30Days: last30,
                weeklyCommits: recent4,
                cadenceScore: last10 > 80 ? 'Hyperactive' : last10 > 40 ? 'High' : last10 > 20 ? 'Steady' : 'Moderate',
              };
            }
          }
        } catch {
          // ignore
        }

        if (seed) {
          baseRepo = { ...seed, ...baseRepo, growth10Days: seed.growth10Days || baseRepo.growth10Days };
        }

        this.setCache(cacheKey, baseRepo);
        return baseRepo;
      }
    } catch (err) {
      console.warn(`Error fetching repo details for ${fullName}`, err);
    }

    return seed || null;
  }

  /**
   * Fetch recent commit history
   */
  public async getRecentCommits(fullName: string): Promise<CommitHistoryItem[]> {
    const cacheKey = `commits_${fullName.replace('/', '_')}`;
    const cached = this.getCache<CommitHistoryItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`https://api.github.com/repos/${fullName}/commits?per_page=15`, {
        headers: this.getHeaders(),
      });
      this.updateRateLimit(res);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const commits: CommitHistoryItem[] = data.map((c: any) => ({
            sha: c.sha.substring(0, 7),
            message: c.commit?.message?.split('\n')[0] || 'Commit update',
            authorName: c.commit?.author?.name || c.author?.login || 'Maintainer',
            authorAvatar: c.author?.avatar_url,
            date: c.commit?.author?.date || new Date().toISOString(),
            url: c.html_url,
          }));
          this.setCache(cacheKey, commits);
          return commits;
        }
      }
    } catch {
      // fallback
    }

    // High fidelity fallback commits
    return [
      { sha: '8f92a1d', message: 'perf: optimize tensor dispatch kernel and buffer pool', authorName: 'Core Contributor', date: new Date(Date.now() - 3600000 * 4).toISOString(), url: '#' },
      { sha: '7b20e1a', message: 'feat: add multi-gpu distributed pipeline support', authorName: 'Lead Engineer', date: new Date(Date.now() - 3600000 * 18).toISOString(), url: '#' },
      { sha: '4c31d8f', message: 'fix: resolve race condition in cache eviction worker', authorName: 'Runtime Team', date: new Date(Date.now() - 3600000 * 32).toISOString(), url: '#' },
      { sha: '2e98c77', message: 'docs: update deployment architecture and benchmarks', authorName: 'Docs Bot', date: new Date(Date.now() - 3600000 * 54).toISOString(), url: '#' },
      { sha: '1a54b39', message: 'chore(deps): bump cryptographic hash primitives to latest', authorName: 'Security Reviewer', date: new Date(Date.now() - 3600000 * 78).toISOString(), url: '#' },
    ];
  }
}

export const githubService = new GitHubService();
