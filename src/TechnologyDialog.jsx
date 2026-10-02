import { guides } from './technology-guides.js';
import { useEffect, useRef } from 'react';
import { technologyTags, technologyLabels, safeUrl, host } from './utils.js';
export default function TechnologyDialog({ name, entries, onClose, onFilter, onOpen }) {
  const ref=useRef(null);
  useEffect(()=>{if(name&&!ref.current.open)ref.current.showModal();if(!name&&ref.current.open)ref.current.close();},[name]);
  const guide=guides[name];
  const related=name?entries.filter(e=>technologyTags(e).includes(name)):[];
  const notes=related.flatMap(entry=>entry.contributions.flatMap(c=>(c.technologies||[]).filter(t=>t.name&&technologyTags({technologies:[t.name]}).includes(name)).map(tech=>({tech,entry,contributor:c.contributor}))));
  const roles=[...new Set(notes.map(n=>n.tech.role).filter(Boolean))];
  const evidence=[...new Set([...(guide?[guide.source]:[]),...notes.flatMap(n=>n.tech.evidence_urls||[])].filter(safeUrl))];
  return <dialog ref={ref} className="detail-dialog technology-dialog" onCancel={onClose} onClose={onClose} aria-labelledby="technology-title" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>{name?<div className="detail-content">
    <div className="detail-top"><span className="eyebrow">TECHNOLOGY WIKI</span><button className="close-button" onClick={onClose} aria-label="技術解説を閉じる">×</button></div>
    <h2 id="technology-title">{name}</h2><p className="wiki-intro">みんなのリサーチから、この技術の役割と表現のヒントを集めた解説ノート。</p>
    {guide?<section className="wiki-overview"><h3>概要</h3><p>{guide.description}</p><a href={guide.source} target="_blank" rel="noopener noreferrer">解説の参照元 ↗</a></section>:null}
    <nav className="wiki-toc" aria-label="解説の目次"><a href="#wiki-role">何ができる？</a><a href="#wiki-examples">表現の事例</a><a href="#wiki-sources">参考資料</a></nav>
    <section id="wiki-role" className="wiki-section"><h3>何ができる？</h3>{roles.length?roles.map(role=><p key={role}>{role}</p>):<p>用途の説明はまだ集まっていません。下の事例と調査メモから、表現とのつながりを探せます。</p>}<p className="wiki-note">投稿内に記載された役割を掲載しています。採用の根拠と確度は事例ごとに異なります。</p></section>
    <section id="wiki-examples" className="wiki-section"><h3>表現の事例 <span>{related.length}</span></h3>{related.map(entry=><article className="wiki-example" key={entry.id}><button onClick={()=>{onClose();onOpen(entry);}}>{entry.title} <span>↗</span></button>{notes.filter(n=>n.entry.id===entry.id).map((n,i)=><div className="wiki-research-note" key={i}><span className={`status status-${n.tech.status}`}>{technologyLabels[n.tech.status]||'未確認'}</span><span className="wiki-author">{n.contributor.nickname}の調査</span><p>{n.tech.reason||'根拠の説明はまだありません。'}</p></div>)}</article>)}<button className="wiki-filter" onClick={()=>{onClose();onFilter(name);}}>この技術の事例を一覧で見る →</button></section>
    <section id="wiki-sources" className="wiki-section"><h3>参考資料</h3>{evidence.length?<ul className="wiki-links">{evidence.map(url=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{host(url)} ↗<small>{url}</small></a></li>)}</ul>:<p>この技術の根拠となるリンクは、まだ登録されていません。</p>}</section>
  </div>:null}</dialog>;
}
