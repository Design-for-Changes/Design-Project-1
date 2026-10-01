import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSubmission, cleanUrl } from '../scripts/privacy.mjs';
import { canonicalUrl, createCatalog } from '../scripts/catalog.mjs';
import { parseTree } from '../scripts/git-tree.mjs';

test('read Unicode and whitespace filenames from Git without quoting loss',()=>{
 const paths=['見える化進捗.json','folder/a b.json','folder/tab\tname.json'];
 const rows=paths.map(p=>`100644 blob abc123 12\t${p}\0`).join('');
 assert.deepEqual(parseTree(rows).map(r=>r.path),paths);
});

test('remove identifying fields, paths, names and student numbers',()=>{
 const {cleaned}=sanitizeSubmission({submission_id:'s1',contributor:{id:'c1',nickname:'Example Student',email:'person@example.invalid'},source_materials:[{id:'m1',label:'/Users/example/private',format:'markdown'}],items:[{student_id:'cy99999',description:'Example Student cy99999 person@example.invalid /Users/example/private',url:'javascript:alert(1)'}]});
 const json=JSON.stringify(cleaned);
 for(const value of ['Example Student','cy99999','person@example.invalid','/Users/example','javascript:']) assert.ok(!json.includes(value));
 assert.match(cleaned.contributor.nickname,/^投稿者-/);
});
test('safe URLs preserve meaningful distinctions',()=>{
 assert.equal(cleanUrl('javascript:alert(1)'),null);
 assert.equal(cleanUrl('https://name:secret@example.org'),null);
 assert.equal(canonicalUrl('https://example.org/?utm_source=a&mode=two#view'),'https://example.org/?mode=two#view');
 assert.notEqual(canonicalUrl('https://example.org/?mode=two'),canonicalUrl('https://example.org/?mode=one'));
});
test('privacy cleanup preserves HTTP URLs and removes actual local paths',()=>{
 const url='https://example.org/research?mode=one#view';
 const {cleaned}=sanitizeSubmission({submission_id:'s1',contributor:{id:'c1',nickname:'mio'},items:[{url,description:`See ${url}; local C:\\Users\\student\\notes.md or D:/notes/private.md`,sources:[{url:'http://example.org/evidence'}],technologies:[{evidence_urls:[url,'http://example.org/test']}]}]});
 assert.equal(cleaned.items[0].url,url);
 assert.equal(cleaned.items[0].sources[0].url,'http://example.org/evidence');
 assert.deepEqual(cleaned.items[0].technologies[0].evidence_urls,[url,'http://example.org/test']);
 assert.ok(cleaned.items[0].description.includes(url));
 assert.ok(!cleaned.items[0].description.includes('C:'));
 assert.ok(!cleaned.items[0].description.includes('D:'));
});
test('combine a shared URL without losing individual comments or uncertain technologies',()=>{
 const docs=[1,2].map(n=>({submission_id:`s${n}`,contributor:{id:`p${n}`,nickname:`nick${n}`},items:[{id:'i1',kind:'site',title:'Example',url:'https://example.org/',student_comments:[{text:`comment ${n}`}],technologies:[{name:'WebGL',status:n===1?'inferred':'confirmed'}]}]}));
 const manifest={records:docs.map((d,i)=>({archive:String(i),source_updated_at:i,locations:['branch']})),issues:[],collected_at:'2026-10-01'};
 const result=createCatalog(manifest,p=>docs[Number(p)]);
 assert.equal(result.entries.length,1);assert.equal(result.entries[0].contributions.length,2);assert.equal(result.summary.observations,2);
 assert.deepEqual(result.entries[0].contributions.map(c=>c.technologies[0].status),['inferred','confirmed']);
});
test('a correction only supersedes the same contributor and latest revision wins',()=>{
 const docs=[{submission_id:'s1',contributor:{id:'p1'},items:[]},{submission_id:'s2',contributor:{id:'p1'},supersedes:['s1'],items:[]},{submission_id:'s1',contributor:{id:'p2'},items:[]}];
 const result=createCatalog({records:docs.map((d,i)=>({archive:String(i),locations:['main']})),issues:[]},p=>docs[Number(p)]);
 assert.equal(result.summary.submissions,2);
});
