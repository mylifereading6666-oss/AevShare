(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const KEY='aevstudio.projects',api=window.AEVSTUDIO_AUTH,client=api&&api.client;
let mode='',template='blank',selectedProject=null,available=[];
const steps={choice:$('#step-choice'),new:$('#step-new'),continue:$('#step-continue')};
function showStep(name){Object.entries(steps).forEach(([key,node])=>node.classList.toggle('hidden-step',key!==name));window.scrollTo({top:0,behavior:'smooth'});}
function localProjects(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return []}}
function setStatus(node,message,error=false){node.textContent=message;node.classList.toggle('error',error)}
function timeout(p,label){return Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+'がタイムアウトしました')),10000))])}
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$$('[data-mode]').forEach(button=>button.addEventListener('click',async()=>{
 mode=button.dataset.mode;
 if(mode==='new'){showStep('new');return}
 showStep('continue');await loadProjects();
}));
$$('[data-template-choice]').forEach(button=>button.addEventListener('click',()=>{
 template=button.dataset.templateChoice;
 $$('[data-template-choice]').forEach(item=>item.classList.toggle('selected',item===button));
}));
$('#new-back').addEventListener('click',()=>showStep('choice'));
$('#continue-back').addEventListener('click',()=>{selectedProject=null;$('#open-project-button').disabled=true;showStep('choice')});
$('#create-project-button').addEventListener('click',()=>{
 const name=$('#new-project-name').value.trim()||({blank:'新しいWebサイト',portfolio:'ポートフォリオ',landing:'サービス紹介サイト',blog:'ブログ',shop:'オンラインショップ',restaurant:'店舗サイト',event:'イベントサイト',photography:'フォトギャラリー',gaming:'ゲーム・コミュニティ',agency:'ビジネスサイト'}[template]||'新しいプロジェクト');
 const pages=Math.max(1,Math.min(10,Number($('#new-project-pages').value)||1));
 const status=$('#new-status'),button=$('#create-project-button');
 button.disabled=true;button.textContent='端末に保存しています...';setStatus(status,'プロジェクトを作成しています。端末への保存後にクラウド同期を行います。');
 const url='editor.html?template='+encodeURIComponent(template)+'&pages='+pages+'&name='+encodeURIComponent(name);
 location.href=url;
});
async function loadProjects(){
 const status=$('#continue-status'),root=$('#continue-project-list'),button=$('#open-project-button');
 root.innerHTML='';button.disabled=true;selectedProject=null;
 let items=localProjects();
 setStatus(status,'端末の保存データを確認しました。クラウドを確認しています...');
 if(client){
  try{
   const auth=await timeout(client.auth.getSession(),'認証確認');
   if(auth.error)throw auth.error;
   const user=auth.data.session?.user;
   if(user){
    const result=await timeout(client.from('studio_projects').select('id,user_id,name,title,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}),'クラウド読み込み');
    if(result.error)throw result.error;
    const map=new Map(items.filter(p=>p&&p.id).map(p=>[String(p.id),p]));
    (result.data||[]).forEach(p=>{const old=map.get(String(p.id));if(!old||new Date(p.updated_at||0)>=new Date(old.updated_at||0))map.set(String(p.id),Object.assign({},old||{},p))});
    items=[...map.values()].sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));
    try{localStorage.setItem(KEY,JSON.stringify(items))}catch(_){}
    setStatus(status,'端末とクラウドのプロジェクトを確認しました。');
   }else{
    setStatus(status,'端末のプロジェクトを表示しています。クラウドのプロジェクトを見るにはログインしてください。');
   }
  }catch(error){
   console.warn('AevStudio project picker cloud load failed:',error);
   setStatus(status,'端末のプロジェクトは表示できます。クラウド同期は未完了です：'+(error.message||String(error)),true);
  }
 }else setStatus(status,'端末のプロジェクトを表示しています。Supabaseに接続できないためクラウドは確認できません。',true);
 available=items;
 if(!items.length){
  root.innerHTML='<div class="project-empty">保存済みプロジェクトはありません。前の画面から「新しいプロジェクト」を選択してください。</div>';
  return;
 }
 root.innerHTML=items.map((p,i)=>'<button class="project-option" type="button" data-project-index="'+i+'"><span>▣</span><span><b>'+escapeHtml(p.name||p.title||'名称未設定')+'</b><small>'+escapeHtml(p.updated_at?new Date(p.updated_at).toLocaleString('ja-JP'):'保存日時不明')+'</small></span></button>').join('');
 root.querySelectorAll('[data-project-index]').forEach(el=>el.addEventListener('click',()=>{
  selectedProject=available[Number(el.dataset.projectIndex)]||null;
  root.querySelectorAll('.project-option').forEach(x=>x.classList.toggle('selected',x===el));
  button.disabled=!selectedProject;
 }));
}
$('#open-project-button').addEventListener('click',()=>{
 if(!selectedProject)return;
 const button=$('#open-project-button');button.disabled=true;button.textContent='プロジェクトを開いています...';
 location.href='editor.html?project='+encodeURIComponent(selectedProject.id);
});
})();