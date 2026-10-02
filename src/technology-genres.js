// Categories describe the kind of technology; site adoption evidence remains separate.
export const technologyGenres=[
 {id:'libraries',label:'JavaScriptライブラリ・プラグイン',description:'プログラムに組み込む部品。3D・可視化・動き・音・AIなどの機能を追加する。',names:['three.js','D3.js','deck.gl','Cytoscape.js','Observable Plot','Plotly.js','GSAP','GSAP（ScrollTrigger）','Scrollama','Barba.js','Tone.js','TensorFlow.js']},
 {id:'web-standards',label:'Web API・標準技術',description:'ブラウザーが提供する描画・音・通信などの仕組み。',names:['WebGL','HTML5 Canvas','SVG','Web Audio API','WebMIDI','WebRTC']},
 {id:'software',label:'3D・設計ソフトウェア',description:'モデルや建築空間を制作するためのアプリケーション。',names:['3ds Max','Revit']},
 {id:'frameworks',label:'フレームワーク・制作環境',description:'アプリや作品を組み立てる基盤。Web制作とクリエイティブコーディングの環境。',names:['Svelte','SvelteKit','Webflow','Processing','openFrameworks']},
 {id:'models',label:'AIモデル',description:'ライブラリを通して利用する、学習済みの認識モデル。',names:['PoseNet']},
 {id:'techniques',label:'表現・実装手法',description:'ソフト名ではなく、描画や計算を行うための方法。',names:['3D/WebGL','2D Canvas texture','GLSLシェーダー（GPUでの粒子計算）']},
 {id:'data',label:'データ形式・素材・予測モデル',description:'表現の入力になる動作データ・画像素材・気象予測モデル。',names:['BVH（モーションキャプチャのデータ形式）','360度パノラマ画像','GFS（米国の気象予報モデル）']},
 {id:'other',label:'未分類',description:'種類を確認してから分類する項目。',names:[]}
];
export function technologyGenre(name){return technologyGenres.find(g=>g.names.includes(name))||technologyGenres.at(-1);}
