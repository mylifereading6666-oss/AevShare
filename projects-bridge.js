(()=>{'use strict';
document.addEventListener('click',event=>{
 const t=event.target instanceof Element?event.target:null;if(!t)return;
 const create=t.closest('#create-selected-project');
 const card=t.closest('[data-hub-id]');
 const template=t.closest('[data-template]');
 if(create){event.preventDefault();event.stopImmediatePropagation();const selected=document.querySelector('[data-new-template].selected');const key=selected?.dataset.newTemplate||'blank';location.href='editor.html?template='+encodeURIComponent(key);return}
 if(card){event.preventDefault();event.stopImmediatePropagation();location.href='editor.html?project='+encodeURIComponent(card.dataset.hubId);return}
 if(template){event.preventDefault();event.stopImmediatePropagation();location.href='editor.html?template='+encodeURIComponent(template.dataset.template||'blank');}
},true);
})();