/* Local teacher shortcuts only. No roster data is included in course exports or links. */
(function(global){'use strict';
const KEY='imi-vocab-hub.teacher.common-names.v1';
const clean=value=>typeof value==='string'?value.trim():'';
function createStore(storage=()=>global.localStorage){
 function read(){
  const raw=storage().getItem(KEY);if(raw===null)return [];
  const data=JSON.parse(raw);
  if(data?.version!==1||!Array.isArray(data.names)||data.names.some(name=>typeof name!=='string'))throw Error('invalid names');
  return [...new Set(data.names.map(clean).filter(Boolean))];
 }
 function write(names){storage().setItem(KEY,JSON.stringify({version:1,names}));}
 return {read,
  add(value){const name=clean(value);if(!name)return 'empty';const names=read();if(names.includes(name))return 'duplicate';write([name,...names]);return 'added';},
  use(value){const names=read();if(names.includes(value))write([value,...names.filter(name=>name!==value)]);},
  remove(value){write(read().filter(name=>name!==value));}
 };
}
function mount(input){
 if(!input||input.dataset.commonNamesMounted)return;input.dataset.commonNamesMounted='true';
 const doc=input.ownerDocument,store=createStore(),root=doc.createElement('div');root.className='tu-common-names';
 function node(tag,text,cls){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 function button(text,action){const b=node('button',text,'tu-button');b.type='button';b.addEventListener('click',action);return b;}
 const actions=node('div',undefined,'tu-row'),panel=node('div',undefined,'tu-common-panel'),status=node('p',undefined,'tu-common-status');
 panel.id='tuCommonNamesPanel';panel.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 let managing=false;
 const toggle=button('常用名單 ▾',()=>{if(panel.hidden){panel.hidden=false;toggle.setAttribute('aria-expanded','true');search.value='';managing=false;syncManage();render();search.focus();}else close();});
 toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',panel.id);
 const add=button('＋加入常用',()=>{
  try{const result=store.add(input.value);say({empty:'請先輸入學生或班級名稱。',duplicate:'已在常用名單',added:'已加入'}[result]);if(!panel.hidden)render();}
  catch(_){say('無法保存常用名單，請檢查瀏覽器儲存設定；仍可手動輸入。');}
 });
 const tools=node('div',undefined,'tu-common-tools'),search=node('input');search.type='search';search.placeholder='搜尋學生／班級';search.setAttribute('aria-label','搜尋常用學生或班級');
 const manage=button('管理',()=>{managing=!managing;syncManage();render();});manage.setAttribute('aria-pressed','false');
 const list=node('div',undefined,'tu-common-list');list.setAttribute('role','group');list.setAttribute('aria-label','常用學生與班級');
 function say(text){status.textContent=text;}
 function syncManage(){manage.textContent=managing?'完成管理':'管理';manage.setAttribute('aria-pressed',String(managing));}
 function close(){toggle.focus();panel.hidden=true;toggle.setAttribute('aria-expanded','false');managing=false;syncManage();}
 function render(){
  list.replaceChildren();let names;
  try{names=store.read();}catch(_){list.append(node('p','無法讀取常用名單；仍可手動輸入。','tu-common-empty'));return;}
  const query=search.value.trim().toLocaleLowerCase();const matches=names.filter(name=>name.toLocaleLowerCase().includes(query));
  if(!matches.length){list.append(node('p',names.length?'找不到符合的名稱。':'輸入學生或班級名稱後，按「＋加入常用」。','tu-common-empty'));return;}
  for(const name of matches){
   const row=node('div',undefined,'tu-common-item');
   const choose=button(name,()=>{
    input.value=name;input.dispatchEvent(new global.Event('input',{bubbles:true}));input.dispatchEvent(new global.Event('change',{bubbles:true}));
    try{store.use(name);say('已選取「'+name+'」');}catch(_){say('已填入名稱，但無法保存最近使用順序。');}
    close();
   });row.append(choose);
   if(managing){const remove=button('刪除',()=>{try{store.remove(name);say('已移除常用名稱；當次教材保持不變。');manage.focus();render();}catch(_){say('無法刪除常用名稱，請檢查瀏覽器儲存設定。');}});remove.classList.add('tu-common-remove');remove.setAttribute('aria-label','刪除常用名稱：'+name);row.append(remove);}
   list.append(row);
  }
 }
 search.addEventListener('input',render);panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
 actions.append(toggle,add);tools.append(search,manage);panel.append(tools,list);root.append(actions,panel,status);input.after(root);
 global.addEventListener('storage',event=>{if((event.key===KEY||event.key===null)&&!panel.hidden)render();});
 return {root};
}
global.IMICommonNames={mount,createStore,storageKey:KEY};
})(window);
