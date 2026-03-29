// functions/api/admin/_github.js
// Helper: GitHub Contents API for Cloudflare Workers

export function getGitHubConfig(env) {
  const GITHUB_TOKEN = (env.GITHUB_TOKEN || env.GITHUB_PAT || env.GH_TOKEN || '').trim();
  const GITHUB_REPO  = env.GITHUB_REPO  || 'thichlammoctools-collab/Website-Toyoko';
  const GITHUB_BRANCH = env.GITHUB_BRANCH || 'main';

  return { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH };
}

const BASE = 'https://api.github.com';

function hasGitHubToken(config) {
  return Boolean(config.GITHUB_TOKEN && config.GITHUB_TOKEN.trim());
}

function requireGitHubToken(config) {
  if (!hasGitHubToken(config)) {
    throw new Error('Missing GITHUB_TOKEN on server. Configure it in Cloudflare Pages Dashboard to enable save/delete/upload.');
  }
}

function githubHeaders(config) {
  requireGitHubToken(config);
  return {
    Authorization: `Bearer ${config.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'ToyokoAdmin-Cloudflare/1.0',
  };
}

async function readErrorBody(res) {
  const body = await res.text();
  if (res.status === 401) return 'GitHub token invalid or expired (401 Bad credentials)';
  if (res.status === 403) return 'GitHub token lacks required permissions (403 Forbidden)';
  return body;
}

function b64EncodeUnicode(str) {
  const bytes = new TextEncoder().encode(str);
  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
      binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString);
}

function b64DecodeUnicode(b64) {
  const binString = atob(b64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function getFile(repoPath, env) {
  const config = getGitHubConfig(env);
  if (!hasGitHubToken(config)) throw new Error('GITHUB_TOKEN missing');

  const url = `${BASE}/repos/${config.GITHUB_REPO}/contents/${repoPath}?ref=${config.GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders(config) });
  
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(`GitHub getFile failed (${res.status}): ${body}`);
  }
  
  const data = await res.json();
  const content = b64DecodeUnicode(data.content.replace(/\n/g, ''));
  return { content, sha: data.sha };
}

export async function putFile(repoPath, contentStr, message, sha, isBase64, env) {
  const config = getGitHubConfig(env);
  requireGitHubToken(config);

  const url = `${BASE}/repos/${config.GITHUB_REPO}/contents/${repoPath}`;
  
  let encoded = isBase64 ? contentStr : b64EncodeUnicode(contentStr);

  const body = {
    message,
    content: encoded,
    branch: config.GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(config),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await readErrorBody(res);
    throw new Error(`GitHub putFile failed (${res.status}): ${err}`);
  }
  return await res.json();
}

export async function deleteFile(repoPath, sha, message, env) {
  const config = getGitHubConfig(env);
  requireGitHubToken(config);

  const url = `${BASE}/repos/${config.GITHUB_REPO}/contents/${repoPath}`;
  const body = { message, sha, branch: config.GITHUB_BRANCH };

  const res = await fetch(url, {
    method: 'DELETE',
    headers: githubHeaders(config),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await readErrorBody(res);
    throw new Error(`GitHub deleteFile failed (${res.status}): ${err}`);
  }
  return await res.json();
}

export async function listDir(repoPath, env) {
  const config = getGitHubConfig(env);
  if (!hasGitHubToken(config)) throw new Error('GITHUB_TOKEN missing');

  const url = `${BASE}/repos/${config.GITHUB_REPO}/contents/${repoPath}?ref=${config.GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders(config) });
  
  if (res.status === 404) return [];
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(`GitHub listDir failed (${res.status}): ${body}`);
  }
  return await res.json();
}
