import { createHash } from 'node:crypto';

export const digest = (value) => createHash('sha256').update(String(value)).digest('hex');
export const studentNumber = /\b(?:cy|ds|di|ad|ae|af|ag)\d{5,8}\b/gi;
const email = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const localPath = /(?:\/Users\/|\/home\/|(?<![A-Za-z0-9])[A-Za-z]:[\\/])[^\s"<>]+/g;
const privateKeys = /^(?:real_?name|full_?name|student_?(?:id|number|name)|email|phone|address|local_?path|file_?path|github_?(?:username|login)|account_?name)$/i;

export function publicNickname(nickname, identity) {
  const value = typeof nickname === 'string' ? nickname.trim() : '';
  const looksPersonal = /\b(?:cy|ds|di|ad|ae|af|ag)\d{5,8}\b/i.test(value)
    || /@|\/Users\/|[\\/]/.test(value)
    || /^[A-Za-z]+(?:[\s]+[A-Za-z]+)+$/.test(value)
    || /^[\p{Script=Han}]{1,4}[\s　]+[\p{Script=Han}\p{Script=Hiragana}]{1,5}$/u.test(value);
  return value && !looksPersonal ? value : `投稿者-${digest(identity).slice(0, 4)}`;
}

export function cleanUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (/(?:^|\.)(?:notion\.so|notion\.site)$/.test(url.hostname)) return null;
    if (/\b(?:cy|ds|di|ad|ae|af|ag)\d{5,8}\b/i.test(value)) return null;
    return url.href;
  } catch { return null; }
}

export function sanitizeSubmission(input) {
  const identity = input.contributor?.id || input.submission_id || JSON.stringify(input);
  const originalName = input.contributor?.nickname || '';
  const nickname = publicNickname(originalName, identity);
  const replacements = new Set();
  if (originalName && originalName !== nickname) replacements.add(originalName);
  for (const [key, value] of Object.entries(input.contributor || {})) {
    if (privateKeys.test(key) && typeof value === 'string' && value.length > 2) replacements.add(value);
  }
  function scrub(value, key = '') {
    if (privateKeys.test(key)) return undefined;
    if (Array.isArray(value)) return value.map(v => /urls$/.test(key) ? cleanUrl(scrub(v)) : scrub(v)).filter(v => v !== undefined && v !== null);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,scrub(v,k)]).filter(([,v])=>v!==undefined));
    if (typeof value !== 'string') return value;
    let text = value;
    for (const token of replacements) text = text.split(token).join(nickname);
    text = text.replace(studentNumber, nickname).replace(email, '[連絡先を削除]').replace(localPath, '[私有パスを削除]');
    if (/url$/.test(key)) return cleanUrl(text);
    return text;
  }
  const cleaned = scrub(input);
  cleaned.contributor = { id: `p-${digest(identity).slice(0, 12)}`, nickname };
  // Student source materials may contain private exports or identifying filenames.
  cleaned.source_materials = (input.source_materials || []).map((m, i) => ({
    id: m.id || `m${i+1}`, label: `提供資料 ${i+1}`, format: typeof m.format === 'string' ? scrub(m.format) : 'unknown', public_url: null,
  }));
  return { cleaned, nickname, replacedNickname: originalName !== nickname };
}

export function sourcePrivacyFix(input) {
  const { cleaned, nickname } = sanitizeSubmission(input);
  // Keep random submission and contributor IDs so students can reuse their identity.
  const output = { ...cleaned, contributor: { id: input.contributor?.id || cleaned.contributor.id, nickname } };
  return output;
}
