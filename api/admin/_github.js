// Helper: GitHub Contents API
// Used by all admin API endpoints to read/write files in the repo

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const GITHUB_TOKEN = (
  process.env.GITHUB_TOKEN ||
  process.env.GITHUB_PAT ||
  process.env.GH_TOKEN ||
  ''
).trim();
const GITHUB_REPO  = process.env.GITHUB_REPO  || 'thichlammoctools-collab/Website-Toyoko';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const BASE = 'https://api.github.com';
const REPO_ROOT = process.cwd();

function hasGitHubToken() {
  return Boolean(GITHUB_TOKEN && GITHUB_TOKEN.trim());
}

function requireGitHubToken() {
  if (!hasGitHubToken()) {
    throw new Error('Missing GITHUB_TOKEN on server. Configure it in Vercel to enable save/delete/upload.');
  }
}

function resolveSafeLocalPath(repoPath) {
  const safeRel = String(repoPath || '').replace(/^\/+/, '').replace(/\\/g, '/');
  const full = path.resolve(REPO_ROOT, safeRel);
  if (!full.startsWith(REPO_ROOT)) {
    throw new Error('Invalid path');
  }
  return full;
}

async function getFileLocal(repoPath) {
  try {
    const full = resolveSafeLocalPath(repoPath);
    const content = await fs.readFile(full, 'utf8');
    const sha = crypto.createHash('sha1').update(content).digest('hex');
    return { content, sha };
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

async function listDirLocal(repoPath) {
  try {
    const full = resolveSafeLocalPath(repoPath);
    const entries = await fs.readdir(full, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      path: `${repoPath.replace(/\/$/, '')}/${entry.name}`,
      sha: '',
      type: entry.isDirectory() ? 'dir' : 'file',
    }));
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
}

function githubHeaders() {
  requireGitHubToken();
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'ToyokoAdmin/1.0',
  };
}

async function readErrorBody(res) {
  const body = await res.text();
  if (res.status === 401) {
    return 'GitHub token invalid or expired (401 Bad credentials)';
  }
  if (res.status === 403) {
    return 'GitHub token lacks required permissions (403 Forbidden)';
  }
  return body;
}

function shouldFallbackToLocal(statusCode) {
  return statusCode === 401 || statusCode === 403;
}

/**
 * Get a file from the repo.
 * Returns { content: <decoded string>, sha: <string> } or null if not found.
 */
async function getFile(repoPath) {
  if (!hasGitHubToken()) return getFileLocal(repoPath);

  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    if (shouldFallbackToLocal(res.status)) return getFileLocal(repoPath);
    const body = await readErrorBody(res);
    throw new Error(`GitHub getFile failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { content, sha: data.sha };
}

/**
 * Create or update a file in the repo.
 * If sha is provided, this is an update; omit sha to create.
 * @param {string} contentStr - UTF-8 string (for JSON/text) or base64 string when isBase64=true (for binary)
 * @param {boolean} [isBase64=false] - If true, contentStr is already base64-encoded (for images)
 */
async function putFile(repoPath, contentStr, message, sha, isBase64 = false) {
  requireGitHubToken();

  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${repoPath}`;
  const encoded = isBase64 ? contentStr : Buffer.from(contentStr, 'utf8').toString('base64');
  const body = {
    message,
    content: encoded,
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await readErrorBody(res);
    throw new Error(`GitHub putFile failed (${res.status}): ${err}`);
  }
  return await res.json();
}

/**
 * Delete a file from the repo.
 */
async function deleteFile(repoPath, sha, message) {
  requireGitHubToken();

  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${repoPath}`;
  const body = { message, sha, branch: GITHUB_BRANCH };

  const res = await fetch(url, {
    method: 'DELETE',
    headers: githubHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await readErrorBody(res);
    throw new Error(`GitHub deleteFile failed (${res.status}): ${err}`);
  }
  return await res.json();
}

/**
 * List all files in a directory.
 * Returns array of { name, path, sha, type } or [] if not found.
 */
async function listDir(repoPath) {
  if (!hasGitHubToken()) return listDirLocal(repoPath);

  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) {
    if (shouldFallbackToLocal(res.status)) return listDirLocal(repoPath);
    const body = await readErrorBody(res);
    throw new Error(`GitHub listDir failed (${res.status}): ${body}`);
  }
  return await res.json();
}

module.exports = { getFile, putFile, deleteFile, listDir };
