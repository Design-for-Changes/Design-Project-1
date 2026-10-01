import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { digest, cleanUrl } from './privacy.mjs';

export function canonicalUrl(value) {
  const safe = cleanUrl(value);
  if (!safe) return null;
  const u = new URL(safe);
  for (const key of [...u.searchParams.keys()]) if (/^utm_|^(?:fbclid|gclid)$/.test(key)) u.searchParams.delete(key);
  u.hostname = u.hostname.toLowerCase();
  // Preserve path, functional query, fragment, and protocol to avoid false merges.
  return u.href;
}

export function createCatalog(manifest, load) {
  const versions = new Map();
  for (const record of manifest.records) {
    const data = load(record.archive);
    const key = `${data.contributor.id}:${data.submission_id}`;
    const old = versions.get(key);
    if (!old || (record.source_updated_at || 0) > (old.record.source_updated_at || 0)) versions.set(key, {record,data});
  }
  const submissions = [...versions.values()];
  const superseded = new Set(submissions.flatMap(({data})=>(data.supersedes || []).map(s=>`${data.contributor.id}:${s}`)));
  const active = submissions.filter(({data})=>!superseded.has(`${data.contributor.id}:${data.submission_id}`));
  const groups = new Map();
  const contributors = new Map();
  let observations = 0;
  for (const {record,data} of active) {
    contributors.set(data.contributor.id, data.contributor);
    for (const [index,item] of data.items.entries()) {
      if (!item || !['site','technology'].includes(item.kind) || typeof item.title !== 'string') continue;
      observations++;
      const url = canonicalUrl(item.url);
      const key = url ? `${item.kind}:${url}` : `${data.submission_id}:${item.id || index}`;
      const group = groups.get(key) || {id: `item-${digest(key).slice(0,12)}`,title:item.title,url,kind:item.kind,contributions:[],tags:[],technologies:[]};
      group.contributions.push({ ...item, contributor:data.contributor, submission_id:data.submission_id, archive:record.archive, source_state:record.locations.includes('main')?'main':'branch' });
      group.tags = [...new Set([...group.tags, ...(item.tags || []).filter(t=>typeof t==='string')])];
      group.technologies = [...new Set([...group.technologies, ...(item.technologies || []).map(t=>t.name).filter(t=>typeof t==='string'&&t.trim())])];
      groups.set(key, group);
    }
  }
  return { generated_at:manifest.collected_at, summary:{submissions:active.length,archived:manifest.records.length,observations,entries:groups.size,contributors:contributors.size,issues:manifest.issues.length,branches:manifest.scanned_branches}, issues:manifest.issues, contributors:[...contributors.values()], entries:[...groups.values()].sort((a,b)=>a.title.localeCompare(b.title,'ja')) };
}

if (process.argv[1]?.endsWith('catalog.mjs')) {
  const manifest = JSON.parse(readFileSync('data/manifest.json','utf8'));
  const catalog = createCatalog(manifest, p=>JSON.parse(readFileSync(p,'utf8')));
  mkdirSync('public',{recursive:true});
  writeFileSync('public/catalog.json',JSON.stringify(catalog,null,2)+'\n');
  console.log(`Catalog: ${catalog.summary.entries} entries, ${catalog.summary.observations} observations, ${catalog.summary.contributors} contributors.`);
}
