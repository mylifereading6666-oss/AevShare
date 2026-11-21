(()=>{'use strict';
document.addEventListener('click',event=>{
 const t=event.target instanceof Element?event.target:null;if(!t)return;
 const create=t.closest('#start-new-project,#continue-project,#create-selected-project,[data-template]');
 const card=t.closest('[data-hub-id]');
 if(create){event.preventDefault();event.stopImmediatePropagation();location.href='project-start.html';return}
 if(card){event.preventDefault();event.stopImmediatePropagation();location.href='editor.html?project='+encodeURIComponent(card.dataset.hubId)}
},true);
})();