(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const config=window.AEVSTUDIO_CONFIG||{}, configured=config.supabaseUrl&&config.supabaseAnonKey&&!config.supabaseAnonKey.startsWith('PASTE_');
let client=null,user=null,projects=[],current=null,mode='visual',signup=false,selectedTemplate='blank',realtimeChannel=null,autosaveTimer=null;
if(configured&&window.supabase)client=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey);
window.AEVSTUDIO_AUTH={isLoggedIn:()=>!!user,getSession:async()=>client?client.auth.getSession():({data:{session:null},error:new Error('Supabase client unavailable')}),onAuthStateChange:callback=>client?client.auth.onAuthStateChange(callback):null,signInWithPassword:args=>client?client.auth.signInWithPassword(args):Promise.resolve({error:new Error('Supabase client unavailable')}),signUp:args=>client?client.auth.signUp(args):Promise.resolve({error:new Error('Supabase client unavailable')}),signOut:async()=>client?client.auth.signOut():({error:new Error('Supabase client unavailable')})};

const builtinSnippets=[
{id:'modal-dialog',category:'HTML',title:'モーダルダイアログ',description:'ボタンから説明や確認画面を表示する基本構成。',tags:['ポップアップ','ダイアログ','画面','表示'],code:'<dialog id="myDialog">\\n  <p>メッセージ</p>\\n  <button onclick="this.closest(\\'dialog\\').close()">閉じる</button>\\n</dialog>\\n<button onclick="document.querySelector(\\'#myDialog\\').showModal()">開く</button>',difficulty:'初級'},
{id:'responsive-grid',category:'CSS',title:'レスポンシブカードグリッド',description:'画面幅に合わせてカードの列数を自動調整。',tags:['スマホ','タブレット','pc','カード','レイアウト'],code:'.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }',difficulty:'初級'},
{id:'dark-glass',category:'CSS',title:'ダーク・ガラス風パネル',description:'半透明背景とぼかしを使ったパネルデザイン。',tags:['ダーク','ガラス','ぼかし','gaming','パネル'],code:'.glass { background:rgba(18,24,42,.72); border:1px solid rgba(255,255,255,.12); border-radius:16px; backdrop-filter:blur(14px); box-shadow:0 16px 50px #0005; }',difficulty:'中級'},
{id:'copy-clipboard',category:'JavaScript',title:'テキストをコピー',description:'ボタン操作で指定したテキストをクリップボードへコピー。',tags:['コピー','クリップボード','ボタン'],code:'async function copyText(text) {\\n  await navigator.clipboard.writeText(text);\\n  alert("コピーしました");\\n}',difficulty:'初級'},
{id:'image-lightbox',category:'JavaScript',title:'画像の拡大表示',description:'画像を選択すると大きく表示する簡易ライトボックス。',tags:['画像','拡大','写真','クリック','ギャラリー'],code:'document.querySelectorAll("[data-lightbox]").forEach(img => {\\n  img.addEventListener("click", () => {\\n    const view = document.querySelector("#lightbox");\\n    view.querySelector("img").src = img.src;\\n    view.showModal();\\n  });\\n});',difficulty:'中級'},
{id:'theme-toggle',category:'JavaScript',title:'ダーク・ライト切り替え',description:'ボタンでページのテーマを切り替え、選択を保存。',tags:['テーマ','ダークモード','ライトモード','設定'],code:'const button = document.querySelector("#themeToggle");\\nbutton.addEventListener("click", () => {\\n  document.documentElement.classList.toggle("light");\\n  localStorage.setItem("theme", document.documentElement.classList.contains("light") ? "light" : "dark");\\n});',difficulty:'中級'},
{id:'sticky-header',category:'CSS',title:'スクロール追従ヘッダー',description:'ページをスクロールしても上部に固定されるヘッダー。',tags:['ヘッダー','固定','スクロール','ナビゲーション'],code:'.header { position:sticky; top:0; z-index:100; background:rgba(10,14,25,.88); backdrop-filter:blur(12px); }',difficulty:'初級'},
{id:'form-validation',category:'JavaScript',title:'入力フォームの簡易チェック',description:'必須項目が入力されているかを確認する。',tags:['フォーム','入力','バリデーション','確認'],code:'const form = document.querySelector("#myForm");\\nform.addEventListener("submit", event => {\\n  if (!form.reportValidity()) event.preventDefault();\\n});',difficulty:'初級'},
{id:'animated-gradient',category:'CSS',title:'アニメーションするグラデーション',description:'背景色がゆっくり変化する演出。',tags:['アニメーション','背景','グラデーション','動き'],code:'.gradient { background:linear-gradient(120deg,#5947a8,#147d91,#5947a8); background-size:200% 200%; animation:flow 8s ease infinite; }\\n@keyframes flow { 50% { background-position:100% 50%; } }',difficulty:'中級'}
];
let codeSnippets=[...builtinSnippets],activeCodeCategory='all';
function renderCodeSnippets(list=codeSnippets,ignoreQuery=false){
 const root=$('#code-snippet-list'); if(!root)return;
 const q=$('#code-search-input').value.trim().toLowerCase();
 const shown=list.filter(x=>(activeCodeCategory==='all'||x.category===activeCodeCategory)&&(ignoreQuery||!q||[x.title,x.description,x.category,...(x.tags||[])].join(' ').toLowerCase().includes(q)));
 root.innerHTML=shown.length?shown.map(x=>'<article class="code-snippet"><div class="code-snippet-top"><span class="code-tag">'+escapeHtml(x.category)+' · '+escapeHtml(x.difficulty||'')+'</span><span class="code-tag">'+escapeHtml(x.id)+'</span></div><h3>'+escapeHtml(x.title)+'</h3><p>'+escapeHtml(x.description)+'</p><pre>'+escapeHtml(x.code)+'</pre><div class="code-snippet-actions"><button data-copy-code="'+escapeHtml(x.id)+'">コードをコピー</button><button data-show-code="'+escapeHtml(x.id)+'">詳細</button></div></article>').join(''):'<div class="empty">該当するコードがありません。検索語を変えてください。</div>';
 $('#code-search-status').textContent=shown.length+' 件のコードを表示中';
 $$('[data-copy-code]').forEach(b=>b.onclick=async()=>{const x=codeSnippets.find(s=>s.id===b.dataset.copyCode);if(x){try{await navigator.clipboard.writeText(x.code);b.textContent='コピーしました'}catch(e){b.textContent='コピーできませんでした'}}});
 $$('[data-show-code]').forEach(b=>b.onclick=()=>{const x=codeSnippets.find(s=>s.id===b.dataset.showCode);if(x)$('#ai-code-answer').innerHTML='<h3>'+escapeHtml(x.title)+'</h3><p>'+escapeHtml(x.description)+'<br>難易度：'+escapeHtml(x.difficulty||'')+'<br>用途：'+escapeHtml((x.tags||[]).join('、'))+'</p><pre>'+escapeHtml(x.code)+'</pre>'});
}
async function loadCodeSnippets(){
 if(client){const {data,error}=await client.from('studio_code_snippets').select('*').order('title');if(!error&&data&&data.length)codeSnippets=data.map(x=>({...x,tags:x.tags||[]}));}
 $('#code-search-status').textContent='コード一覧を準備しました';renderCodeSnippets();
}
function setupRealtime(){
 if(!client)return;
 if(realtimeChannel){client.removeChannel(realtimeChannel);realtimeChannel=null;}
 let channel=client.channel('aevstudio-live'+(user?'-'+user.id:'-public'));
 if(user)channel=channel.on('postgres_changes',{event:'*',schema:'public',table:'studio_projects',filter:'user_id=eq.'+user.id},()=>loadProjects(true));
 channel=channel.on('postgres_changes',{event:'*',schema:'public',table:'studio_code_snippets'},()=>loadCodeSnippets());
 realtimeChannel=channel.subscribe();
}
function filterCode(){renderCodeSnippets()}
const localSynonyms={
 '画像':['写真','picture','photo','image','gallery','ギャラリー','拡大','lightbox'],
 '拡大':['大きく','ズーム','zoom','enlarge','lightbox'],
 'スマホ':['モバイル','mobile','phone','responsive','レスポンシブ'],
 'レイアウト':['配置','grid','layout','カード','card','columns'],
 'コピー':['複製','clipboard','copy','クリップボード'],
 'テーマ':['色','外観','dark','light','theme','ダーク','ライト'],
 'フォーム':['入力','form','validation','バリデーション','チェック'],
 'アニメーション':['動き','animation','animated','gradient','グラデーション'],
 '固定':['追従','sticky','fixed','header','ヘッダー'],
 'ポップアップ':['モーダル','dialog','modal','popup','ダイアログ'],
 'ボタン':['クリック','click','button','操作'],
 '背景':['background','gradient','グラデーション'],
 'ページ':['web page','website','サイト','ウェブサイト']
};
function localSearchTokens(value){
 const s=String(value||'').toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0));
 const words=s.match(/[a-z0-9_+#.-]+|[ぁ-んァ-ヶ一-龠々ー]+/g)||[];
 const tokens=[];
 for(const word of words){
  if(word.length>1)tokens.push(word);
  if(/[ぁ-んァ-ヶ一-龠]/.test(word)&&word.length>2){
   for(let i=0;i<word.length-1;i++)tokens.push(word.slice(i,i+2));
  }
 }
 return [...new Set(tokens)];
}
function scoreLocalSnippet(item,query){
 const fields=[item.title||'',item.description||'',item.category||'',...(item.tags||[])].join(' ').toLowerCase();
 const code=String(item.code||'').toLowerCase();
 const q=query.toLowerCase();
 let score=0;
 if(fields.includes(q))score+=14;
 if(String(item.title||'').toLowerCase().includes(q))score+=12;
 const expanded=new Set(localSearchTokens(q));
 for(const [key,values] of Object.entries(localSynonyms)){
  if(q.includes(key)||values.some(v=>q.includes(v.toLowerCase()))){expanded.add(key);values.forEach(v=>localSearchTokens(v).forEach(t=>expanded.add(t)));}
 }
 const fieldTokens=localSearchTokens(fields),codeTokens=localSearchTokens(code);
 for(const token of expanded){
  if(token.length<2)continue;
  if(fields.includes(token))score+=token.length>3?4:2;
  if(code.includes(token))score+=1;
  if(fieldTokens.includes(token))score+=2;
  if(codeTokens.includes(token))score+=0.5;
 }
 return score;
}
function aiText(key,language,count){
 const ja={empty:'目的に近いコードは見つかりませんでした。別の言葉でも検索してみてください。',found:'入力内容と関連語を照合し、関連度の高いコードを選びました。',none:'検索語を入力してください。',ready:'ローカル検索を準備しました。',failed:'検索を実行できませんでした。'};
 const en={empty:'No closely related snippets were found. Try different wording.',found:'Relevant snippets were selected by matching your request and related terms.',none:'Enter what you want to build.',ready:'Local search is ready.',failed:'The search could not be completed.'};
 return (language==='en'?en:ja)[key];
}
async function runAICodeSearch(){
 const query=$('#code-search-input').value.trim(),box=$('#ai-code-answer'),btn=$('#ai-code-search-button'),language=$('#ai-response-language')?.value||'ja';
 box.classList.remove('hidden');
 if(!query){box.textContent=aiText('none',language);return}
 btn.disabled=true;btn.textContent=language==='en'?'Searching...':'検索中...';
 box.textContent=language==='en'?'Searching locally on this device...':'この端末内で検索しています...';
 try{
  const ranked=codeSnippets.map(item=>({item,score:scoreLocalSnippet(item,query)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  const matches=ranked.map(x=>x.item);
  box.innerHTML='<h3>✦ '+(language==='en'?'Local AI search results':'ローカルAI検索結果')+'</h3><p>'+aiText(matches.length?'found':'empty',language)+'</p>';
  if(matches.length){
   box.innerHTML+='<p>'+(language==='en'?'Recommended snippets: ':'おすすめコード：')+matches.map(x=>escapeHtml(x.title)).join(', ')+'</p>';
   activeCodeCategory='all';$$('[data-code-category]').forEach(x=>x.classList.toggle('active',x.dataset.codeCategory==='all'));renderCodeSnippets(matches,true);
  }else renderCodeSnippets([]);
 }catch(e){box.textContent=aiText('failed',language)}
 finally{btn.disabled=false;btn.textContent=language==='en'?'✦ Local AI search':'✦ ローカルAI検索'}
}
function initMenu(){
 const toggle=$('#menu-toggle'),menu=$('#site-menu'),backdrop=$('#menu-backdrop');
 const close=()=>{menu.classList.add('hidden');backdrop.classList.add('hidden');toggle.setAttribute('aria-expanded','false')};
 toggle.onclick=()=>{const open=menu.classList.contains('hidden');menu.classList.toggle('hidden',!open);backdrop.classList.toggle('hidden',!open);toggle.setAttribute('aria-expanded',String(open))};
 $('#menu-close').onclick=close;backdrop.onclick=close;
 menu.querySelectorAll('a[href]').forEach(link=>{
  link.addEventListener('click',()=>close());
 });
}

const starter={blank:{title:'Hello, AevStudio!',description:'ここからあなたのWebサイトを作りましょう。',color:'#8b6cff'},portfolio:{title:'My Portfolio',description:'こんにちは。私の作品とプロフィールを紹介します。',color:'#8b6cff'},landing:{title:'アイデアを、カタチに。',description:'私たちのサービスをご紹介します。',color:'#38b9c8'},blog:{title:'My Journal',description:'日々の気づきや好きなことを綴るブログです。',color:'#d69a70'}};
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fromVisual(){return {title:$('#visual-title').value,description:$('#visual-description').value,color:$('#visual-color').value,html:'',css:''}}
function applyProject(p){current=p;$('#project-name').value=p.name;$('#visual-title').value=p.title;$('#visual-description').value=p.description;$('#visual-color').value=p.color;$('#html-code').value=p.html||'';$('#css-code').value=p.css||'';renderProjects();refresh()}
function renderProjects(){
 $('#project-count').textContent=projects.length;
 const markup=projects.length?projects.map(p=>'<button class="project-item '+(current&&p.id===current.id?'active':'')+'" data-id="'+p.id+'">'+escapeHtml(p.name||'Untitled Project')+'<small>'+new Date(p.updated_at||Date.now()).toLocaleDateString('ja-JP')+'</small></button>').join(''):'<div class="empty">プロジェクトはまだありません。<br>「新しいプロジェクト」から作成できます。</div>';
 $('#project-list').innerHTML=markup;
 $('#hub-project-count').textContent=projects.length;
 $('#hub-project-list').innerHTML=projects.length?projects.map(p=>'<button class="hub-project-card" data-hub-id="'+p.id+'"><strong>'+escapeHtml(p.name||'Untitled Project')+'</strong><span>最終更新：'+new Date(p.updated_at||Date.now()).toLocaleString('ja-JP')+'</span><b>続きから開く →</b></button>').join(''):'<div class="empty">プロジェクトはまだありません。</div>';
 $$('.project-item').forEach(b=>b.onclick=()=>{applyProject(projects.find(p=>p.id===b.dataset.id));openWorkspace()});
 $$('[data-hub-id]').forEach(b=>b.onclick=()=>{const p=projects.find(x=>x.id===b.dataset.hubId);if(p){applyProject(p);openWorkspace()}});
 $('#continue-project').disabled=!projects.length;
}
function buildHTML(){let p=fromVisual();let title=escapeHtml(p.title),desc=escapeHtml(p.description);return '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:8vw;font:16px/1.7 system-ui;color:#202238;background:#f6f7fb}main{max-width:800px;margin:8vh auto;padding:50px;border-radius:24px;background:white;box-shadow:0 20px 70px #20204018}h1{font-size:clamp(32px,7vw,60px);line-height:1.15;color:'+p.color+'}p{color:#687087}button{border:0;border-radius:9px;padding:12px 20px;background:'+p.color+';color:white;font-weight:bold}'+(p.css||'')+'</style><main>'+(p.html||'<h1>'+title+'</h1><p>'+desc+'</p><button>はじめる</button>')+'</main><script>'+'</scr'+'ipt></html>'}
function refresh(){let html=mode==='code'?$('#html-code').value:buildHTML();if(mode==='code'){let css=$('#css-code').value;html=html.replace('</head>','<style>'+css+'</style></head>')}$('#preview-frame').srcdoc=html;$('#save-status').textContent='プレビューを更新しました'}
function showHub(){ $('#template-picker').classList.add('hidden');$('#workspace').classList.add('hidden');$('#project-hub').classList.remove('hidden');$('#project-hub').scrollIntoView({behavior:'smooth'}); }
function showTemplatePicker(){ $('#project-hub').classList.add('hidden');$('#workspace').classList.add('hidden');$('#template-picker').classList.remove('hidden');$('#template-picker').scrollIntoView({behavior:'smooth'}); }
function openWorkspace(){ $('#project-hub').classList.add('hidden');$('#template-picker').classList.add('hidden');$('#workspace').classList.remove('hidden');$('#workspace').scrollIntoView({behavior:'smooth'}); }
function newProject(template='blank'){let s=starter[template]||starter.blank;let projectId=(window.crypto&&typeof crypto.randomUUID==='function')?crypto.randomUUID():'aev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);let p={id:projectId,name:template==='blank'?'Untitled Project':({portfolio:'Portfolio',landing:'Landing Page',blog:'Blog'}[template]),...s,html:'',css:'',updated_at:new Date().toISOString()};projects.unshift(p);applyProject(p);$('#starter-template').value=template;renderProjects();openWorkspace();saveLocal();if(client&&user)saveProject()}
function saveLocal(){localStorage.setItem('aevstudio.projects',JSON.stringify(projects));$('#save-status').textContent='この端末に保存しました'}
async function loadProjects(quiet=false){const previousId=current?.id;if(client&&user){const {data,error}=await client.from('studio_projects').select('*').order('updated_at',{ascending:false});if(!error&&data)projects=data.map(x=>({...x,id:x.id,name:x.name,title:x.title||'New page',description:x.description||'',color:x.color||'#8b6cff',html:x.html||'',css:x.css||''}));else projects=JSON.parse(localStorage.getItem('aevstudio.projects')||'[]')}else projects=JSON.parse(localStorage.getItem('aevstudio.projects')||'[]');renderProjects();current=projects.find(p=>p.id===previousId)||projects[0]||null;if(!quiet)showHub()}
async function saveProject(){if(!current)return;let p={...current,name:$('#project-name').value,...(mode==='visual'?fromVisual():{html:$('#html-code').value,css:$('#css-code').value}),updated_at:new Date().toISOString()};Object.assign(current,p);projects=projects.map(x=>x.id===p.id?p:x);saveLocal();renderProjects();if(client&&user){const payload={id:p.id,user_id:user.id,name:p.name,title:p.title,description:p.description,color:p.color,html:p.html,css:p.css,updated_at:p.updated_at};const {error}=await client.from('studio_projects').upsert(payload);if(error)$('#save-status').textContent='端末保存済み（クラウド保存エラー）';else $('#save-status').textContent='クラウドに保存しました'} }
function setMode(m){mode=m;$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));$('#visual-editor').classList.toggle('hidden',m!=='visual');$('#code-editor').classList.toggle('hidden',m!=='code');refresh()}

// Independent project-start handler: works even if another initializer fails.
document.addEventListener('click',function(event){
 const target=event.target.closest('#start-new-project,#create-selected-project,#back-to-hub');
 if(!target)return;
 event.preventDefault();event.stopImmediatePropagation();
 try{
  if(target.id==='start-new-project')showTemplatePicker();
  else if(target.id==='create-selected-project')newProject(selectedTemplate);
  else showHub();
 }catch(error){console.error('AevStudio project start error:',error);const status=$('#save-status');if(status)status.textContent='制作を開始できませんでした。ページを再読み込みしてください。';}
},true);
// Responsive live preview control.
const previewPane=$('.preview-pane'),previewHead=$('.preview-head');
if(previewPane&&previewHead&&!$('#preview-toggle')){
 const previewToggle=document.createElement('button');
 previewToggle.type='button';previewToggle.id='preview-toggle';previewToggle.textContent='実際の表示を確認';
 previewToggle.setAttribute('aria-expanded','false');
 previewHead.appendChild(previewToggle);
 previewToggle.addEventListener('click',()=>{
  const opened=previewPane.classList.toggle('preview-open');
  previewToggle.setAttribute('aria-expanded',String(opened));
  previewToggle.textContent=opened?'プレビューを閉じる':'実際の表示を確認';
  if(opened)refresh();
 });
}


function renderAccountPage(){
 const state=$('#account-state'),email=$('#account-email'),uid=$('#account-user-id'),created=$('#account-created'),action=$('#account-login-action'),passwordBtn=$('#account-password-update');
 if(!state)return;
 if(user){state.textContent='ログイン中';email.textContent=user.email||'未設定';uid.textContent=user.id||'—';created.textContent=user.created_at?new Date(user.created_at).toLocaleString():'—';if(action){action.textContent='ログアウト';action.onclick=async()=>{if(client)await client.auth.signOut();user=null;renderAccountPage();$('#account-label').textContent='ゲストモード';$('#auth-open').textContent='ログイン';};}if(passwordBtn)passwordBtn.disabled=false;}
 else{state.textContent='ログインしていません';email.textContent='—';uid.textContent='—';created.textContent='—';if(action){action.textContent='ログイン';action.onclick=()=>$('#auth-dialog').showModal();}if(passwordBtn)passwordBtn.disabled=true;}
}
$('#account-password-update')?.addEventListener('click',async()=>{
 const feedback=$('#account-feedback'),next=$('#account-new-password').value,confirm=$('#account-confirm-password').value;
 if(!user||!client){feedback.textContent='パスワードを変更するにはログインしてください。';return}
 if(next.length<6){feedback.textContent='パスワードは6文字以上で入力してください。';return}
 if(next!==confirm){feedback.textContent='確認用パスワードが一致しません。';return}
 const btn=$('#account-password-update');btn.disabled=true;feedback.textContent='変更しています...';
 try{const {error}=await client.auth.updateUser({password:next});if(error)throw error;feedback.textContent='パスワードを変更しました。';$('#account-new-password').value='';$('#account-confirm-password').value='';}
 catch(error){feedback.textContent='変更できませんでした：'+(error.message||'時間をおいて再度お試しください。');}
 finally{btn.disabled=false;}
});
renderAccountPage();

initMenu();loadCodeSnippets();$('#code-search-button').onclick=filterCode;$('#code-search-input').addEventListener('input',filterCode);$('#ai-code-search-button').onclick=runAICodeSearch;$('#ai-response-language')?.addEventListener('change',()=>{const b=$('#ai-code-search-button');b.textContent=$('#ai-response-language').value==='en'?'✦ Local AI search':'✦ ローカルAI検索'});$$('[data-code-category]').forEach(b=>b.onclick=()=>{activeCodeCategory=b.dataset.codeCategory;$$('[data-code-category]').forEach(x=>x.classList.toggle('active',x===b));renderCodeSnippets()});
$('#start-new-project').onclick=showTemplatePicker;$('#back-to-hub').onclick=showHub;$('#back-project-hub').onclick=showHub;$('#continue-project').onclick=()=>$('#hub-project-list').scrollIntoView({behavior:'smooth'});$('#create-selected-project').onclick=()=>newProject(selectedTemplate);$$('[data-new-template]').forEach(b=>b.onclick=()=>{selectedTemplate=b.dataset.newTemplate;$$('[data-new-template]').forEach(x=>x.classList.toggle('selected',x===b))});$('#save-project').onclick=saveProject;$('#preview-project').onclick=()=>{refresh();$('#preview-frame').scrollIntoView({behavior:'smooth',block:'center'})};$('#refresh-preview').onclick=refresh;$$('.tab').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
['project-name','visual-title','visual-description','visual-color','html-code','css-code'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{ $('#save-status').textContent='変更を自動保存します...';clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>saveProject(),700)}));
$('#starter-template').onchange=e=>{let s=starter[e.target.value];if(s){$('#visual-title').value=s.title;$('#visual-description').value=s.description;$('#visual-color').value=s.color;refresh()}};
$$('[data-template]').forEach(b=>b.onclick=()=>{selectedTemplate=b.dataset.template;showTemplatePicker();$$('[data-new-template]').forEach(x=>x.classList.toggle('selected',x.dataset.newTemplate===selectedTemplate))});
$('#add-section').onclick=()=>{let p=fromVisual();$('#visual-description').value=p.description+'\n\n新しいセクションを追加しました。';refresh()};
$('#auth-open').onclick=async()=>{if(user&&client){$('#auth-open').disabled=true;try{await client.auth.signOut()}finally{$('#auth-open').disabled=false}return}if(!user){if(!client){$('#auth-message').textContent='config.jsにSupabaseの公開キーを設定してください。'}$('#auth-dialog').showModal()}};
$('#auth-toggle').onclick=()=>{signup=!signup;$('#auth-title').textContent=signup?'アカウントを新規登録':'AevStudioにログイン';$('#auth-submit').textContent=signup?'登録する':'ログイン';$('#auth-toggle').textContent=signup?'ログインに戻る':'アカウントを新規登録'};
$('#auth-submit').onclick=async()=>{if(!client){$('#auth-message').textContent='Supabase公開キーが未設定です。';return}let email=$('#auth-email').value,password=$('#auth-password').value;let r=signup?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password});$('#auth-message').textContent=r.error?r.error.message:(signup?'確認メールを確認してください。':'ログインしました。');if(!r.error&&!signup){$('#auth-dialog').close();user=r.data.user;$('#account-label').textContent=user.email;$('#auth-open').textContent='ログアウト';await loadProjects()}};

function syncAuthControls(){const button=$('#auth-open'),status=$('#auth-status'),label=$('#account-label');if(button){button.classList.toggle('hidden',!!user);button.textContent='ログイン / 登録';button.setAttribute('aria-label','ログイン');}if(status)status.classList.toggle('hidden',!user);if(label)label.textContent=user?(user.email||'ログイン中'):'ゲストモード';renderAccountPage()}
if(client){client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;syncAuthControls();setTimeout(async()=>{await loadProjects();setupRealtime()},0)});client.auth.getSession().then(async({data})=>{user=data.session?.user||null;syncAuthControls();await loadProjects();setupRealtime()})}else loadProjects();
})();