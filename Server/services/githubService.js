const axios = require('axios');

/**
 * Extract GitHub username from a profile URL.
 * Accepts: https://github.com/username  or just "username"
 */
const extractUsername = (githubUrl) => {
  if (!githubUrl) return null;
  try {
    const url = new URL(githubUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[0] || null;
  } catch {
    // Not a valid URL — treat the whole string as a username
    return githubUrl.trim().replace(/^@/, '') || null;
  }
};

/**
 * Fetch GitHub profile + repos and return a plain-text summary for the AI prompt.
 * Returns { summary: string, username: string|null, repoCount: number, totalStars: number, languages: string[] }
 */
const fetchGitHubSummary = async (githubUrl) => {
  const username = extractUsername(githubUrl);

  if (!username) {
    return {
      summary: 'No valid GitHub URL or username provided.',
      username: null,
      repoCount: 0,
      totalStars: 0,
      languages: [],
    };
  }

  const headers = { 'User-Agent': 'MentorPlatformBot/1.0' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const [profileRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { headers, timeout: 10000 }),
      axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
        headers,
        timeout: 10000,
      }),
    ]);

    const profile = profileRes.data;
    const repos   = reposRes.data;

    const totalStars = repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
    const languages  = [...new Set(repos.map((r) => r.language).filter(Boolean))];

    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(
        (r) =>
          `  - ${r.name} [${r.stargazers_count} stars] ${r.language ? `(${r.language})` : ''}: ${
            r.description || 'No description'
          }`
      );

    const summary = [
      `GitHub Username : ${username}`,
      `Public Repos    : ${profile.public_repos}`,
      `Followers       : ${profile.followers}`,
      `Total Stars     : ${totalStars}`,
      `Languages Used  : ${languages.join(', ') || 'None detected'}`,
      `Bio             : ${profile.bio || 'Not provided'}`,
      `Top Repositories:`,
      ...topRepos,
    ].join('\n');

    return { summary, username, repoCount: profile.public_repos, totalStars, languages };
  } catch (err) {
    console.error('[githubService] Fetch error:', err.message);
    return {
      summary: `Could not fetch GitHub data for username "${username}". (${err.message})`,
      username,
      repoCount: 0,
      totalStars: 0,
      languages: [],
    };
  }
};

module.exports = { fetchGitHubSummary, extractUsername };
