import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { technologyGenres, technologyGenre } from './technology-genres.js';
import TechnologyDialog from './TechnologyDialog.jsx';
import Preview from './Preview.jsx';
import DetailDialog from './DetailDialog.jsx';
import { host, searchText, uniqueContributors, technologyTags } from './utils.js';

function ResearchCard({ entry, index, onOpen, technology, onTechnology }) {
  const contributors=uniqueContributors(entry);
  const first=entry.contributions[0];
  const comment=entry.contributions.flatMap(c=>c.student_comments || [])[0]?.text;
  return <article className="research-card">
    <button className="preview-button" onClick={()=>onOpen(entry)} aria-label={`${entry.title}の詳細を見る`}><Preview entry={entry}/><span className="preview-open" aria-hidden="true">↗</span></button><div className="card-body"><div className="card-top"><span className="card-number">{String(index+1).padStart(2,'0')}</span><span className="card-kind">{entry.kind==='site'?'WEBSITE':'TECHNOLOGY'}</span><span className="card-domain">{host(entry.url)}</span></div>
    <button className="card-title" onClick={()=>onOpen(entry)} aria-label={`${entry.title}の詳細を見る`}><h2>{entry.title}</h2><span aria-hidden="true">↗</span></button>
    <p className="card-description">{first.description || '説明はまだありません。'}</p>
    {comment ? <p className="card-comment"><span aria-hidden="true">“</span>{comment}</p>:<p className="card-comment muted">コメントを待っています。</p>}
    <div className="card-tags">{technologyTags(entry).map(t=><button className="technology-tag" key={t} onClick={()=>onTechnology(t)} aria-label={`${t}の解説を読む`}>#{t}</button>)}{!entry.technologies.length ? entry.tags.slice(0,3).map(t=><span key={t}>{t}</span>):null}{!entry.technologies.length&&!entry.tags.length ? <span>技術情報は未確認</span>:null}</div>
    <footer className="card-footer"><div className="card-contributors">{contributors.map(c=><span key={c.id}>{c.nickname}</span>)}</div><button onClick={()=>onOpen(entry)} className="read-button">リサーチを読む <span aria-hidden="true">＋</span></button></footer></div>
  </article>;
}

export default function App() {
  const [catalog,setCatalog]=useState(null);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [kind,setKind]=useState('all');
  const [technology,setTechnology]=useState('');
  const [genre,setGenre]=useState('');
  const [contributor,setContributor]=useState('');
  const [selected,setSelected]=useState(null);
  const [selectedTechnology,setSelectedTechnology]=useState(()=>new URLSearchParams(window.location.search).get('technology'));
  const openTechnology=name=>{setSelectedTechnology(name);const url=new URL(window.location.href);if(name)url.searchParams.set('technology',name);else url.searchParams.delete('technology');window.history.replaceState(null,'',url);};
  const deferredQuery=useDeferredValue(query.trim().toLowerCase());
  useEffect(()=>{
    const controller=new AbortController();
    fetch(`${import.meta.env.BASE_URL}catalog.json`,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw Error(`読み込みに失敗しました (${r.status})`);return r.json();})
      .then(data=>{if(!Array.isArray(data.entries))throw Error('データの形式を確認してください。');setCatalog(data);})
      .catch(e=>{if(e.name!=='AbortError')setError(e.message);});
    return ()=>controller.abort();
  },[]);
  const entries=catalog?.entries || [];
  const technologies=useMemo(()=>[...new Set(entries.flatMap(technologyTags))].sort((a,b)=>a.localeCompare(b,'ja')),[entries]);
  const indexed=useMemo(()=>entries.map(entry=>({entry,text:searchText(entry)})),[entries]);
  const visible=useMemo(()=>indexed.filter(({entry,text})=>(kind==='all'||entry.kind===kind)&&(!genre||technologyTags(entry).some(t=>technologyGenre(t).id===genre))&&(!technology||technologyTags(entry).includes(technology))&&(!contributor||entry.contributions.some(c=>c.contributor.id===contributor))&&(!deferredQuery||deferredQuery.split(/\s+/).every(word=>text.includes(word)))).map(x=>x.entry),[indexed,kind,genre,technology,contributor,deferredQuery]);
  const wikiNames=technologies.filter(t=>(!genre||technologyGenre(t).id===genre)&&(!technology||technology===t)&&(!deferredQuery||t.toLowerCase().includes(deferredQuery)));
  const reset=()=>{setQuery('');setKind('all');setTechnology('');setGenre('');setContributor('');};
  const filtered=!!query||kind!=='all'||!!technology||!!genre||!!contributor;
  const updated=catalog?.generated_at ? new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(catalog.generated_at)):null;
  return <>
    <a href="#archive" className="skip-link">事例一覧へ移動</a>
    <header className="site-header"><a className="brand" href={import.meta.env.BASE_URL}><span className="brand-mark" aria-hidden="true">w.</span><span>DESIGN PROJECT <b>01</b></span></a><nav aria-label="関連ページ"><a href="https://github.com/Design-for-Changes/Design-Project-1/blob/main/FOR_AI.md" target="_blank" rel="noreferrer">投稿マニュアル</a><a href="https://github.com/Design-for-Changes/Design-Project-1" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></nav></header>
    <main>
      <section className="archive-heading" aria-labelledby="page-title"><div><p className="eyebrow">COLLECTIVE RESEARCH / WEB & DATA</p><h1 id="page-title">Find your<br/><span>next spark.</span></h1><p className="heading-description">心が動く表現から、発想の引き出しを増やそう。<br/>見て、触れて、読み解いて。次につくるもののヒントを探す。</p></div><div className="hero-art" aria-hidden="true"><span className="hero-ring"/><span className="hero-ring ring-two"/><span className="hero-dot"/><span className="hero-caption">EXPLORE / COLLECT / REMIX</span></div><div className="stats"><div><strong>{catalog?.summary.entries ?? '—'}</strong><span>表現・技術</span></div><div><strong>{catalog?.summary.contributors ?? '—'}</strong><span>リサーチャー</span></div><div><strong>{catalog?.summary.observations ?? '—'}</strong><span>集まった視点</span></div></div></section>
      <section id="archive" className="archive-section" aria-label="リサーチを探す">
        <div className="filter-bar"><div className="tabs" role="group" aria-label="表示する種類">{[['all','すべて'],['site','Webサイト'],['technology','技術Wiki']].map(([value,label])=><button key={value} aria-pressed={kind===value} onClick={()=>setKind(value)}>{label}</button>)}</div><label className="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="表現・技術・コメントを検索" aria-label="表現・技術・コメントを検索" value={query} onChange={e=>setQuery(e.target.value)} /></label></div>
        <div className="filter-options"><label><span>投稿者</span><select aria-label="投稿者" value={contributor} onChange={e=>setContributor(e.target.value)}><option value="">すべてのニックネーム</option>{catalog?.contributors.map(c=><option key={c.id} value={c.id}>{c.nickname}</option>)}</select></label>{filtered ? <button className="reset" onClick={reset}>絞り込みを解除</button>:null}<p className="result-count" role="status" aria-live="polite">{catalog ? <><strong>{kind==='technology'?wikiNames.length:visible.length}</strong> 件</>:'読み込み中'}</p></div>
        <div className="genre-filter" role="group" aria-label="技術のジャンル"><button aria-pressed={!genre} onClick={()=>{setGenre('');setTechnology('');}}>すべてのジャンル</button>{technologyGenres.filter(g=>technologies.some(t=>technologyGenre(t).id===g.id)).map(g=><button key={g.id} aria-pressed={genre===g.id} onClick={()=>{setGenre(genre===g.id?'':g.id);setTechnology('');}}>{g.label}</button>)}</div>
        {kind!=='technology'?<div className="technology-filter" aria-label="技術タグで探す">{technologyGenres.map(g=>{const names=technologies.filter(t=>technologyGenre(t).id===g.id&&(!genre||genre===g.id));return names.length?<div className="technology-tag-group" key={g.id}><span className="technology-filter-label">{g.label}</span><div>{names.map(t=><button className="technology-tag" key={t} aria-pressed={technology===t} onClick={()=>setTechnology(technology===t?'':t)}>#{t}<span>{entries.filter(e=>technologyTags(e).includes(t)).length}</span></button>)}</div></div>:null;})}</div>:null}

        {error ? <div className="empty-state" role="alert"><h2>データを読み込めませんでした</h2><p>{error}</p><button onClick={()=>window.location.reload()}>再読み込み</button></div> : !catalog ? <div className="loading-state">リサーチを読み込んでいます…</div> : kind==='technology' ? <div className="wiki-genres">{technologyGenres.map(g=>{const names=wikiNames.filter(t=>technologyGenre(t).id===g.id);return names.length?<section className="wiki-genre" key={g.id}><header><h2>{g.label}<span>{names.length}</span></h2><p>{g.description}</p></header><div className="wiki-grid">{names.map(t=><button key={t} className="wiki-card" onClick={()=>openTechnology(t)}><span>TECHNOLOGY WIKI</span><h3>{t}</h3><p>{entries.filter(e=>technologyTags(e).includes(t)).length} 件の表現から読み解く</p><b aria-hidden="true">↗</b></button>)}</div></section>:null;})}{!wikiNames.length?<div className="empty-state">一致する技術はありません。<button onClick={reset}>すべて表示する</button></div>:null}</div> : visible.length ? <div className="card-grid">{visible.map((entry,index)=><ResearchCard entry={entry} index={index} key={entry.id} onOpen={setSelected} technology={technology} onTechnology={openTechnology}/>)}</div> : <div className="empty-state"><span className="empty-symbol" aria-hidden="true">∅</span><h2>{entries.length?'一致するリサーチはありません':'リサーチはまだありません'}</h2><p>{entries.length?'別のキーワードや条件で探してみてください。':'投稿を収集すると、ここに表示されます。'}</p>{filtered?<button onClick={reset}>すべて表示する</button>:null}</div>}
      </section>
      {catalog ? <section className="collection-note"><div><span className="eyebrow">COLLECTION NOTE</span><p>mainを含む {catalog.summary.branches} ブランチから収集。{catalog.summary.submissions} 件の投稿データを掲載しています。</p><p className="subtle">同じURLの事例はまとめ、投稿者ごとのコメントと技術の確度は残しています。表示は収集時点のスナップショットです。</p></div><div className="updated">最終収集<span>{updated} JST</span>{catalog.summary.issues ? <details><summary>取り込み保留 {catalog.summary.issues} 件</summary><ul>{catalog.issues.map(i=><li key={i.id}>{i.reason}</li>)}</ul><p>元の投稿を修正後、再収集してください。</p></details>:null}</div></section>:null}
    </main>
    <footer className="site-footer"><span>DESIGN FOR CHANGES</span><span>PROJECT 01 / RESEARCH ARCHIVE</span></footer>
    <TechnologyDialog name={selectedTechnology} entries={entries} onClose={()=>openTechnology(null)} onFilter={name=>{setKind('all');setGenre('');setTechnology(name);}} onOpen={setSelected}/>
    <DetailDialog entry={selected} onClose={()=>setSelected(null)}/>
  </>;
}
