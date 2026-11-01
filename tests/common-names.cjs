// Node DOM simulation: checks behavior and focus, not browser layout or persistent-device storage.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'teacher-common-names.js'),'utf8');
let count=0;function check(title,run){run();count++;console.log('PASS '+title);}
function setup(data=new Map()){
 let failRead=false,failWrite=false;const storage={getItem:k=>{if(failRead)throw Error('blocked');return data.get(k)??null},setItem:(k,v)=>{if(failWrite)throw Error('quota');data.set(k,v)}};
 const doc={activeElement:null,createElement:tag=>new Node(tag)};
 class Node{constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.dataset={};this.attrs={};this.value='';this.hidden=false;this.textContent='';this.ownerDocument=doc;this.classList={add:cls=>this.className+=' '+cls};}
 append(...children){this.children.push(...children)}replaceChildren(...children){this.children=children}after(n){this.afterNode=n}setAttribute(k,v){this.attrs[k]=v}addEventListener(k,f){(this.listeners[k]??=[]).push(f)}dispatchEvent(e){for(const f of this.listeners[e.type]||[])f(e)}click(){this.dispatchEvent({type:'click'})}focus(){doc.activeElement=this}}
 class Event{constructor(type,options){this.type=type;Object.assign(this,options)}}
 const b={localStorage:storage,Event,addEventListener(){}};b.window=b;vm.createContext(b);vm.runInContext(code,b);
 const input=new Node('input');input.value='current course';let inputEvents=0,changeEvents=0;input.addEventListener('input',()=>inputEvents++);input.addEventListener('change',()=>changeEvents++);
 const {root:ui}=b.IMICommonNames.mount(input),[actions,panel,status]=ui.children,[toggle,add]=actions.children,[tools,list]=panel.children,[search,manage]=tools.children;
 return {api:b.IMICommonNames,input,ui,panel,status,toggle,add,search,manage,list,doc,data,store:b.IMICommonNames.createStore(),events:()=>[inputEvents,changeEvents],failRead:v=>failRead=v,failWrite:v=>failWrite=v};
}
const a=setup(),key=a.api.storageKey;
check('mount remains collapsed and never auto-fills or saves current name',()=>{assert(a.panel.hidden);assert.equal(a.input.value,'current course');assert.equal(a.data.size,0);assert.deepEqual(a.events(),[0,0])});
check('blank names are rejected without a write',()=>{a.input.value='  ';a.add.click();assert.match(a.status.textContent,/先輸入/);assert.equal(a.data.size,0)});
check('explicit add trims names and only writes the independent key',()=>{a.input.value='  測試班A  ';a.add.click();assert.equal(a.status.textContent,'已加入');assert.deepEqual(Array.from(a.store.read()),['測試班A']);assert.deepEqual([...a.data.keys()],[key])});
check('duplicates do not create extra entries',()=>{a.add.click();assert.equal(a.status.textContent,'已在常用名單');assert.equal(a.store.read().length,1)});
check('typing does not auto-save',()=>{a.input.value='not saved';a.input.dispatchEvent({type:'input'});assert.equal(a.store.read().length,1)});
check('Unicode and markup-like text remain plain button text',()=>{for(const name of ['Tiếng Việt Čeština','<img onerror=alert(1)>', '長'.repeat(300)])a.store.add(name);a.toggle.click();assert.equal(a.list.children[1].children[0].textContent,'<img onerror=alert(1)>');assert.equal(a.list.children[1].children[0].children.length,0)});
check('search filters names and reports no matches',()=>{a.search.value='VIỆT';a.search.dispatchEvent({type:'input'});assert.equal(a.list.children.length,1);assert.equal(a.list.children[0].children[0].textContent,'Tiếng Việt Čeština');a.search.value='missing';a.search.dispatchEvent({type:'input'});assert.match(a.list.children[0].textContent,/找不到/)});
check('deletes appear only in management mode',()=>{a.search.value='';a.search.dispatchEvent({type:'input'});assert(a.list.children.every(n=>n.children.length===1));a.manage.click();assert(a.list.children.every(n=>n.children.length===2))});
check('deleting does not clear current course and restores focus before rerender',()=>{const current=a.input.value;a.list.children[0].children[1].click();assert.equal(a.input.value,current);assert.equal(a.doc.activeElement,a.manage);assert.equal(a.store.read().length,3)});
check('select fills original field, emits both existing events and closes accessibly',()=>{a.manage.click();a.search.value='測試班';a.search.dispatchEvent({type:'input'});const before=a.events();a.list.children[0].children[0].click();assert.equal(a.input.value,'測試班A');assert.deepEqual(a.events(),before.map(x=>x+1));assert(a.panel.hidden);assert.equal(a.toggle.attrs['aria-expanded'],'false');assert.equal(a.doc.activeElement,a.toggle);assert.equal(a.store.read()[0],'測試班A')});
check('reload reads saved names without auto-filling original field',()=>{const b=setup(a.data);assert.equal(b.input.value,'current course');assert.equal(b.store.read()[0],'測試班A');assert(b.panel.hidden)});
check('Escape closes with focus outside hidden controls',()=>{a.toggle.click();assert.equal(a.doc.activeElement,a.search);let prevented=false;a.panel.dispatchEvent({type:'keydown',key:'Escape',preventDefault(){prevented=true}});assert(prevented);assert(a.panel.hidden);assert.equal(a.doc.activeElement,a.toggle)});
check('quota failures do not report success or mutate saved list',()=>{a.input.value='new';const before=a.data.get(key);a.failWrite(true);a.add.click();assert.match(a.status.textContent,/無法保存/);assert.equal(a.data.get(key),before);assert.equal(a.input.value,'new');a.failWrite(false)});
check('selection still works if recent-use persistence fails',()=>{a.toggle.click();a.failWrite(true);a.list.children[0].children[0].click();assert.equal(a.input.value,'測試班A');assert.match(a.status.textContent,/已填入.*無法保存/);assert(a.panel.hidden);a.failWrite(false)});
check('corrupt stored data is reported and never overwritten',()=>{a.data.set(key,'broken');a.input.value='safe';a.add.click();assert.match(a.status.textContent,/無法保存/);assert.equal(a.data.get(key),'broken');a.toggle.click();assert.match(a.list.children[0].textContent,/無法讀取/)});
check('blocked storage does not block mount or manual entry',()=>{a.failRead(true);a.input.value='manual';a.add.click();assert.match(a.status.textContent,/無法保存/);assert.equal(a.input.value,'manual')});
check('new module loads before teacher mount and hooks only teacher settings',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),teacher=fs.readFileSync(path.join(root,'teacher.js'),'utf8');assert(html.indexOf('src="teacher-common-names.js')<html.indexOf('src="teacher.js'));assert(teacher.includes("window.IMICommonNames.mount($('inputClassName'))"));assert(!/fetch\(|XMLHttpRequest|innerHTML/.test(code))});
console.log(count+' checks passed (simulated DOM).');
