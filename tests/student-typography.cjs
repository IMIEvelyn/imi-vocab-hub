'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function setup(loader=async()=>[{}]){
 const nodes=new Map(),classes=new Set(),calls=[];let starts=0,scans=0;
 const element=()=>({children:[],hidden:false,setAttribute(){},append(...values){this.children.push(...values)},replaceChildren(...values){this.children=values}});
 const c={Intl,URLSearchParams,location:{search:''},setTimeout,clearTimeout,queueMicrotask,console:{error(){}},validWords:[{str:'課本'}],initGame(){starts++},updateMarquee(){scans++},adjustScale(){},MutationObserver:class{observe(){}},NodeFilter:{SHOW_TEXT:4,FILTER_REJECT:2,FILTER_ACCEPT:1}};
 c.document={documentElement:{style:{setProperty(k,v){calls.push([k,v])}},dataset:{},classList:{add(k){classes.add(k)},remove(k){classes.delete(k)}}},body:{append(node){nodes.set(node.id,node)}},querySelectorAll:()=>[],createElement:element,createTextNode:text=>({textContent:text}),getElementById:id=>nodes.get(id),fonts:{load(...args){calls.push(args);return loader(...args)}}};c.window=c;vm.createContext(c);
 for(const f of ['pdf-font-coverage.js','teacher-pdf.js','student-typography.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
 return {c,calls,classes,nodes,get starts(){return starts},get scans(){return scans}};
}
(async()=>{
 const normal=setup();assert.equal(normal.calls[0][1],1.05);await normal.c.initGame();assert.equal(normal.starts,1);assert.equal(normal.c.document.documentElement.dataset.imiScript,'traditional');assert.equal(normal.classes.size,0);await normal.c.initGame();assert.equal(normal.calls.filter(x=>String(x[0]).includes('IMIPDFTraditional')).length,1);
 normal.c.validWords=[{str:'课本学习'}];await normal.c.initGame();assert.equal(normal.c.document.documentElement.dataset.imiScript,'simplified');assert.equal(normal.calls.filter(x=>String(x[0]).includes('IMIPDFSimplified')).length,1);
 normal.c.updateMarquee();assert.equal(normal.scans,1);
 const fail=setup(async()=>{throw Error('network')});await fail.c.initGame();assert.equal(fail.starts,0);assert.ok(fail.classes.has('imi-font-waiting'));assert.equal(fail.nodes.get('imiFontStatus').hidden,false);assert.ok(fail.nodes.get('imiFontStatus').children.some(n=>n.textContent==='重試 Retry'));
 fail.c.document.fonts.load=async()=>[{}];await fail.c.initGame();assert.equal(fail.starts,1);assert.equal(fail.nodes.get('imiFontStatus').hidden,true);
 let resolve;const race=setup(()=>new Promise(r=>resolve=r));const first=race.c.initGame(),second=race.c.initGame();resolve([{}]);await Promise.all([first,second]);assert.equal(race.starts,1);
 const unregistered=setup(async()=>[]);await unregistered.c.initGame();assert.equal(unregistered.starts,0);
 console.log('PASS traditional/simplified selection, single-font loading and cache, original marquee call, failed-font blocking/retry, stale-start guard, and unregistered-font blocking.');
})().catch(e=>{console.error(e);process.exitCode=1});
