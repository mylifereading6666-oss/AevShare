/* AevStudio single shared Supabase authentication client.
   Every page loads this file before app.js and uses the same persisted session. */
(function(){
 'use strict';
 if(window.AEVSTUDIO_AUTH?.client)return;
 const config=window.AEVSTUDIO_CONFIG||{};
 const ready=!!(window.supabase&&config.supabaseUrl&&config.supabaseAnonKey);
 const client=ready?window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 }):null;
 let currentSession=null;
 const api={
  client,
  isLoggedIn:()=>!!currentSession?.user,
  getSession:()=>client?client.auth.getSession():Promise.resolve({data:{session:null},error:new Error('Supabase auth client is unavailable')}),
  onAuthStateChange:callback=>client?client.auth.onAuthStateChange(callback):null,
  signInWithPassword:args=>client?client.auth.signInWithPassword(args):Promise.resolve({error:new Error('Supabase auth client is unavailable')}),
  signUp:args=>client?client.auth.signUp(args):Promise.resolve({error:new Error('Supabase auth client is unavailable')}),
  signOut:()=>client?client.auth.signOut():Promise.resolve({error:new Error('Supabase auth client is unavailable')})
 };
 window.AEVSTUDIO_AUTH=api;
 function render(session){
  currentSession=session||null;
  const logged=!!currentSession?.user;
  const button=document.getElementById('auth-open');
  const badge=document.getElementById('auth-status');
  const label=document.getElementById('account-label');
  if(button){button.classList.toggle('hidden',logged);button.hidden=logged;button.setAttribute('aria-hidden',String(logged));button.style.setProperty('display',logged?'none':'inline-flex','important');button.textContent='ログイン / 登録';}
  if(badge)badge.classList.toggle('hidden',!logged);
  if(label)label.textContent=logged?(currentSession.user.email||'ログイン中'):'ゲストモード';
  document.documentElement.dataset.aevAuth=logged?'online':'offline';
 }
 if(client){
  client.auth.onAuthStateChange((_event,session)=>render(session));
  client.auth.getSession().then(({data,error})=>{
   if(error)throw error;
   render(data.session);
  }).catch(error=>console.error('AevStudio shared auth initialization failed',error));
 }else{
  document.documentElement.dataset.aevAuth='unavailable';
  console.error('AevStudio: Supabase config or SDK is unavailable.');
 }

 /* Centralize login UI handling here. Capture phase prevents page scripts from
    replacing or bypassing the shared login action. */
 let signupMode=false;
 document.addEventListener('click',async function(event){
  const target=event.target;
  if(!(target instanceof Element))return;
  const submit=target.closest('#auth-submit');
  const toggle=target.closest('#auth-toggle');
  const open=target.closest('#auth-open');
  const message=document.getElementById('auth-message');
  const dialog=document.getElementById('auth-dialog');
  const say=(value,isError=false)=>{
   if(message){message.textContent=value;message.style.color=isError?'#ff9baf':'#9eadd0';}
  };
  if(open){
   event.preventDefault();event.stopImmediatePropagation();
   if(!dialog)return;
   const {data,error}=client?await client.auth.getSession():{data:{session:null},error:new Error('Supabaseに接続できません。')};
   if(error){say(error.message,true);return;}
   if(data.session){
    const result=await client.auth.signOut();
    if(result.error)say(result.error.message,true);
   }else if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();
   else dialog.setAttribute('open','');
   return;
  }
  if(toggle){
   event.preventDefault();event.stopImmediatePropagation();
   signupMode=!signupMode;
   const title=document.getElementById('auth-title');
   const button=document.getElementById('auth-submit');
   if(title)title.textContent=signupMode?'アカウントを新規登録':'AevStudioにログイン';
   if(button)button.textContent=signupMode?'登録する':'ログイン';
   toggle.textContent=signupMode?'ログインに戻る':'アカウントを新規登録';
   say('');
   return;
  }
  if(submit){
   event.preventDefault();event.stopImmediatePropagation();
   if(!client){say('Supabaseに接続できません。ページを再読み込みしてください。',true);return;}
   const email=document.getElementById('auth-email')?.value.trim()||'';
   const password=document.getElementById('auth-password')?.value||'';
   if(!email||!password){say('メールアドレスとパスワードを入力してください。',true);return;}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){say('メールアドレスの形式を確認してください。',true);return;}
   submit.disabled=true;submit.textContent=signupMode?'登録中...':'ログイン中...';say('');
   try{
    const result=signupMode
     ?await client.auth.signUp({email,password})
     :await client.auth.signInWithPassword({email,password});
    if(result.error)throw result.error;
    if(signupMode){
     say(result.data.session?'アカウントを作成しました。':'確認メールを送信しました。メールを確認してください。');
    }else{
     render(result.data.session);
     if(dialog?.open)dialog.close();
     say('ログインしました。');
    }
   }catch(error){
    say(error?.message||'ログインに失敗しました。',true);
   }finally{
    submit.disabled=false;submit.textContent=signupMode?'登録する':'ログイン';
   }
  }
 },true);
})();