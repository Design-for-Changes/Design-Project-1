import { useEffect, useRef } from 'react';
import { technologyLabels, observationLabels, safeUrl, host } from './utils.js';

function External({ url, children, className }) {
  const href = safeUrl(url);
  return href ? <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>;
}

export default function DetailDialog({ entry, onClose }) {
  const ref = useRef(null);
  useEffect(()=>{
    const dialog = ref.current;
    if (entry && dialog && !dialog.open) dialog.showModal();
    if (!entry && dialog?.open) dialog.close();
  },[entry]);
  return <dialog ref={ref} className="detail-dialog" onCancel={onClose} onClose={onClose} aria-labelledby="detail-title" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    {entry ? <div className="detail-content">
      <div className="detail-top"><span className="eyebrow">{entry.kind==='site'?'WEBSITE':'TECHNOLOGY'} / RESEARCH NOTE</span><button className="close-button" onClick={onClose} aria-label="詳細を閉じる">×</button></div>
      <h2 id="detail-title">{entry.title}</h2>
      <div className="detail-link"><External url={entry.url} className="primary-link">{entry.kind==='site'?'サイトを開く':'参考ページを開く'} <span aria-hidden="true">↗</span></External><span>{host(entry.url)}</span></div>
      <div className="detail-tags">{entry.tags.map(t=><span className="tag" key={t}>{t}</span>)}</div>
      <p className="editor-note">以下は学生の投稿内容です。技術の「確認済み」は投稿内の区分であり、運営側が再検証したことを意味しません。</p>
      {entry.contributions.map((c,index)=><article className="contribution" key={`${c.submission_id}:${c.id}:${index}`}>
        <header className="contributor-line"><span className="avatar">{c.contributor.nickname.slice(0,1).toUpperCase()}</span><strong>{c.contributor.nickname}</strong><span className="subtle">のリサーチ</span><span className="source-state">{c.source_state==='main'?'mainから収集':'投稿ブランチから収集'}</span></header>
        <p className="description-full">{c.description}</p>
        <section className="comment-section"><h3>気になったところ</h3>{c.student_comments?.length ? c.student_comments.map((comment,i)=><blockquote key={i}>{comment.text}</blockquote>) : <p className="subtle">本人のコメントはまだありません。</p>}</section>
        {c.highlights?.length ? <section><h3>表現とインタラクション</h3><ul className="observations">{c.highlights.map((h,i)=><li key={i}><span className="mini-label">{observationLabels[h.basis] || '区分未記載'}</span><p>{h.detail}</p>{safeUrl(h.source_url) ? <External url={h.source_url}>参考情報</External>:null}</li>)}</ul></section>:null}
        <section><h3>裏側のテクノロジー</h3>{c.technologies?.length ? <div className="technology-list">{c.technologies.map((tech,i)=><div className="technology-row" key={i}>
          <div className="tech-heading"><strong>{tech.name || '採用技術は未確認'}</strong><span className={`status status-${tech.status || 'unknown'}`}>{technologyLabels[tech.status] || '未確認'}</span></div>
          {tech.role ? <p className="tech-role">{tech.role}</p>:null}<p>{tech.reason || '根拠の記載はありません。'}</p>
          {tech.evidence_urls?.length ? <div className="evidence-links">{tech.evidence_urls.filter(safeUrl).map((url,j)=><External url={url} key={j}>根拠 {j+1} · {host(url)}</External>)}</div>:null}
        </div>)}</div> : <p className="subtle">技術情報はまだありません。</p>}</section>
        {c.applications?.length ? <section><h3>データ表現への応用</h3>{c.applications.map((a,i)=><div className="application" key={i}><span className="mini-label">{a.author==='student'?'学生のアイデア':'AIのアイデア'}</span><p>{a.idea}</p></div>)}</section>:null}
        {c.ai_notes?.length ? <section className="ai-notes"><h3>AIからの補足</h3>{c.ai_notes.map((note,i)=><p key={i}>{note}</p>)}</section>:null}
        {c.limitations?.length ? <section className="limitations"><h3>まだ確認できていないこと</h3><ul>{c.limitations.map((note,i)=><li key={i}>{note}</li>)}</ul></section>:null}
        {c.sources?.length ? <details className="sources"><summary>出典を読む <span>{c.sources.length}</span></summary>{c.sources.map((source,i)=><div className="source-row" key={i}><External url={source.url}>{source.title || source.url || '出典URL未登録'}</External><p>{source.supports}</p><span className="subtle">{source.access==='read'?'投稿AIが閲覧':'投稿AIは未閲覧'}</span></div>)}</details>:null}
      </article>)}
    </div>:null}
  </dialog>;
}
