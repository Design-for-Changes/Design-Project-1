export const technologyLabels = { confirmed: '確認済み', inferred: '推測', reproduction_candidate: '再現候補', unknown: '未確認' };
export const observationLabels = { direct_observation: '直接観察', student_report: '学生の観察', source_description: '資料による説明' };
export function safeUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function host(value) { try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return 'URL未登録'; } }
export function uniqueContributors(entry) { return [...new Map(entry.contributions.map(c=>[c.contributor.id,c.contributor])).values()]; }
export function searchText(entry) {
  return [entry.title,entry.url,...entry.tags,...entry.technologies,...entry.contributions.flatMap(c=>[c.description,c.contributor.nickname,...(c.student_comments || []).map(x=>x.text),...(c.highlights || []).map(x=>x.detail)])].filter(Boolean).join(' ').toLowerCase();
}
export function technologyTags(entry) {
  const names=entry.technologies.flatMap(name=>name.split(/\s+\/\s+/)).map(name=>name.trim()).filter(Boolean);
  return [...new Set(names.map(name=>/^three\.js$/i.test(name)?'three.js':name))];
}
