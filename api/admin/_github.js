// Helper: GitHub Contents API
// Used by all admin API endpoints to read/write files in the repo

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = process.env.GITHUB_REPO  || 'thichlammoctools-collab/Website-Toyoko';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const BASE = 'https://api.github.com';

function githubHeaders() {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'ToyokoAdmin/1.0',
  };
}

/**
 * Get a file from the repo.
 * Returns { content: <decoded string>, sha: <string> } or null if not found.
 */
async function getFile(path) {
  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
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
async function putFile(path, contentStr, message, sha, isBase64 = false) {
  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${path}`;
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
    const err = await res.text();
    throw new Error(`GitHub putFile failed (${res.status}): ${err}`);
  }
  return await res.json();
}

/**
 * Delete a file from the repo.
 */
async function deleteFile(path, sha, message) {
  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${path}`;
  const body = { message, sha, branch: GITHUB_BRANCH };

  const res = await fetch(url, {
    method: 'DELETE',
    headers: githubHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub deleteFile failed (${res.status}): ${err}`);
  }
  return await res.json();
}

/**
 * List all files in a directory.
 * Returns array of { name, path, sha, type } or [] if not found.
 */
async function listDir(path) {
  const url = `${BASE}/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub listDir failed (${res.status}): ${body}`);
  }
  return await res.json();
}

module.exports = { getFile, putFile, deleteFile, listDir };
