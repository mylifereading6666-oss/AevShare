(()=>{'use strict';
const api=window.AEVSTUDIO_AUTH,client=api&&api.client,KEY='aevstudio.projects';
const menu=document.getElementById('site-menu');
if(!menu)return;
const sections=[...menu.querySelectorAll('details')];
const production=sections.find(d=>d.querySelector('summary')?.textContent.trim()==='制作');
if(!production)return;
let panel=document.getElementById('menu-project-section');
if(!panel){
 panel=document.createElement('div');panel.id='menu-project-section';panel.className='menu-project-section';
 panel.innerHTML='<div class="menu-project-heading">マイプロジェクト</div><a class="menu-new-project" href="project-start.html">＋ 新しく作る</a><div class="menu-project-items" id="menu-project-items"><span class="menu-project-empty">読み込み中...</span></div>';
 production.appendChild(panel);
}
function localProjects(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return []}}
function render(items){
 itemsCache=items;
 const root=document.getElementById('menu-project-items');if(!root)return;
 root.innerHTML=items.length?items.slice(0,30).map(p=>'<div class="menu-project-row"><a class="menu-project-item" href="editor.html?project='+encodeURIComponent(p.id)+'"><b></b><small></small></a><button type="button" class="menu-project-delete" data-delete-project="'+String(p.id).replace(/"/g,'&quot;')+'" aria-label="プロジェクトを完全削除" title="完全削除">削除</button></div>').join(''):'<span class="menu-project-empty">プロジェクトはまだありません。</span>';
 [...root.querySelectorAll('.menu-project-row')].forEach((el,i)=>{const p=items[i];el.querySelector('b').textContent=p.name||p.title||'Untitled Project';el.querySelector('small').textContent=p.updated_at?new Date(p.updated_at).toLocaleDateString('ja-JP'):''});
}
async function deleteProject(id,button){
 const target=itemsCache.find(p=>String(p.id)===String(id));if(!target)return;
 if(!confirm('「'+(target.name||target.title||'Untitled Project')+'」を完全に削除します。\\n\\n端末の保存データと、ログイン中の場合はクラウド上のデータも削除します。この操作は取り消せません。'))return;
 if(button){button.disabled=true;button.textContent='削除中...'}
 try{
  if(client){
   const {data:sessionData,error:sessionError}=await client.auth.getSession();if(sessionError)throw sessionError;
   const user=sessionData.session?.user;
   if(user){const {error}=await client.from('studio_projects').delete().eq('id',id).eq('user_id',user.id);if(error)throw error}
  }
  const local=localProjects().filter(p=>String(p.id)!==String(id));localStorage.setItem(KEY,JSON.stringify(local));
  itemsCache=itemsCache.filter(p=>String(p.id)!==String(id));
  render(itemsCache);window.dispatchEvent(new StorageEvent('storage',{key:KEY,newValue:JSON.stringify(local)}));
 }catch(error){alert('削除できませんでした。\\n'+(error?.message||String(error)));if(button){button.disabled=false;button.textContent='削除'}}
}
let itemsCache=[];
document.addEventListener('click',event=>{const button=event.target.closest('[data-delete-project]');if(!button)return;event.preventDefault();event.stopPropagation();deleteProject(button.dataset.deleteProject,button)},true);
async function refresh(){
 let items=localProjects();
 if(client){
  try{
   const {data:sessionData,error:sessionError}=await client.auth.getSession();
   if(sessionError)throw sessionError;
   const user=sessionData.session?.user;
   if(user){
    const {data,error}=await client.from('studio_projects').select('id,name,title,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false});
    if(error)throw error;
    const byId=new Map();items.forEach(p=>{if(p&&p.id)byId.set(String(p.id),p)});
    (data||[]).forEach(p=>{const old=byId.get(String(p.id));if(!old||new Date(p.updated_at||0)>=new Date(old.updated_at||0))byId.set(String(p.id),p)});
    items=[...byId.values()].sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));
   }
  }catch(error){console.warn('AevStudio menu project load failed:',error)}
 }
 render(items);
}
refresh();
window.addEventListener('storage',e=>{if(e.key===KEY)refresh()});
if(client)client.auth.onAuthStateChange(()=>setTimeout(refresh,0));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
})();