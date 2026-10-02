import { useState } from 'react';
import previews from './previews.json';
export default function Preview({ entry, eager=false }) {
  const [failed,setFailed]=useState(false);
  const image=previews[entry.id]?.image;
  const hue=[...entry.id].reduce((n,c)=>n+c.charCodeAt(0),0)%360;
  return <div className={`visual-preview ${image&&!failed?'has-image':'no-image'}`} style={{'--hue':hue}}>
    {image&&!failed ? <img src={image} alt={`${entry.title}のサイト共有画像`} loading={eager?'eager':'lazy'} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/> : <div className="preview-placeholder"><span className="orb orb-one"/><span className="orb orb-two"/><span className="preview-word">{entry.kind==='site'?'WEB':'TOOL'}</span><span className="preview-unavailable">{entry.kind==='site'?'サイト画像未取得':'TECHNOLOGY COLLECTION'}</span></div>}
    <span className="preview-label">{image&&!failed?'SITE PREVIEW':'RESEARCH'}</span>
  </div>;
}
