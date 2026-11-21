/* AevStudio single shared Supabase authentication client.
   Every page loads this file before app.js and uses the same persisted session. */
(function(){
 'use strict';
 if(window.AEVSTUDIO_AUTH?.client)return;
 const config=window.AEVSTUDIO_CONFIG||{};
 const ready=!!(window.supabase&&config.supabaseUrl&&config.supabaseAnonKey);
 const client=ready?window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'aevstudio-shared-auth'}
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
  if(button){button.classList.toggle('hidden',logged);button.textContent='ログイン / 登録';}
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
})();