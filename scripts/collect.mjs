import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { digest, sanitizeSubmission, sourcePrivacyFix } from './privacy.mjs';
import { parseTree } from './git-tree.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const readJson = (path, fallback) => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
mkdirSync('data/submissions', { recursive: true });
mkdirSync('.local', { recursive: true });
const previous = readJson('data/manifest.json', { records: [], issues: [] });
const records = new Map(previous.records.map(r => [r.archive, { ...r }]));
const privateSources = [];
const issues = [];
const fixes = [];
const refs = git('for-each-ref', '--format=%(refname)', 'refs/remotes/origin').trim().split('\n').filter(r => r && !r.endsWith('/HEAD'));
const now = new Date().toISOString();
const ignored = /^(?:data|public|src|scripts|tests|node_modules|dist|\.git|\.github|\.local)\//;
const excludedFiles = new Set(['package.json', 'package-lock.json', 'tsconfig.json']);
const manualFiles = new Set(['README.md', 'AGENTS.md', 'FOR_AI.md', 'MAINTENANCE.md', 'index.html']);
let fileCount = 0;
for (const ref of refs) {
  const commit = git('rev-parse', ref).trim();
  const location = ref.endsWith('/main') ? 'main' : 'branch';
  const files = parseTree(git('ls-tree', '-rlz', ref));
  for (const {type, blob, size, path} of files) {
    if (!path || ignored.test(path) || excludedFiles.has(path) || manualFiles.has(path)) continue;
    if (!/\.(?:json|md|html)$/i.test(path)) continue;
    if (type !== 'blob') continue;
    const sourceId = `source-${digest(`${commit}:${path}`).slice(0, 12)}`;
    fileCount++;
    privateSources.push({ sourceId, ref, path, commit, blob });
    if (!path.endsWith('.json')) { issues.push({id:sourceId,reason:'投稿JSONへの整理待ち（Markdown / HTML）',location,blob}); continue; }
    if (Number(size) > 2_000_000) { issues.push({ id: sourceId, reason: 'ファイルサイズ上限超過', location }); continue; }
    const raw = git('show', blob);
    let input;
    try { input = JSON.parse(raw); } catch { issues.push({ id: sourceId, reason: raw.trim() ? 'JSONの途中欠落または形式エラー' : '空の投稿ファイル', location, blob }); continue; }
    if (!input || !Array.isArray(input.items) || !input.contributor || typeof input.submission_id !== 'string') {
      issues.push({ id: sourceId, reason: '投稿形式ではないJSON', location, blob }); continue;
    }
    const { cleaned, replacedNickname } = sanitizeSubmission(input);
    const content = JSON.stringify(cleaned, null, 2) + '\n';
    const archive = `data/submissions/entry-${digest(content).slice(0, 20)}.json`;
    if (!existsSync(archive)) writeFileSync(archive, content);
    const fileTime = Number(git('log', '-1', '--format=%ct', ref, '--', path).trim()) || 0;
    const record = records.get(archive) || { archive, submission_id: cleaned.submission_id, contributor_id: cleaned.contributor.id, first_seen: now, source_revisions: [], locations: [], source_updated_at: fileTime };
    record.source_revisions = [...new Set([...record.source_revisions, commit])].sort();
    record.locations = [...new Set([...record.locations, location])].sort();
    record.source_updated_at = Math.max(record.source_updated_at || 0, fileTime);
    records.set(archive, record);
    // Private remediation plan: never add to git or public assets.
    const fixed = sourcePrivacyFix(input);
    const hasIdentifyingText = /\b(?:cy|ds|di|ad|ae|af|ag)\d{5,8}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\/Users\/|\/home\//i.test(raw);
    if (replacedNickname || hasIdentifyingText) fixes.push({ ref, path, blob, content: JSON.stringify(fixed, null, 2)+'\n', nickname: cleaned.contributor.nickname });
  }
}
const uniqueIssues = [...new Map(issues.map(i => [i.blob || i.id, { id: i.id, reason: i.reason, location: i.location }])).values()];
const manifest = { schema_version: 1, collected_at: now, scanned_branches: refs.length, scanned_files: fileCount, records: [...records.values()].sort((a,b)=>a.archive.localeCompare(b.archive)), issues: uniqueIssues };
writeFileSync('data/manifest.json', JSON.stringify(manifest, null, 2)+'\n');
writeFileSync('.local/source-map.json', JSON.stringify(privateSources, null, 2));
writeFileSync('.local/privacy-fixes.json', JSON.stringify(fixes, null, 2));
console.log(`Collected ${manifest.records.length} sanitized submissions from ${refs.length} branches; ${uniqueIssues.length} files need review.`);
