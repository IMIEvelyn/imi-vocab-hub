'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
function extract(name){const start=html.indexOf('  function '+name+'('),body=html.indexOf('{',start);let depth=1,end=body+1;for(;depth;end++){if(html[end]==='{')depth++;if(html[end]==='}')depth--;}return html.slice(start,end);}
const classes=new Set(),els={};const cl={add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,on){on?classes.add(k):classes.delete(k)}};
const ctx={window:null,document:{body:{classList:cl},getElementById(id){return els[id]??=( {style:{},classList:{add(){},remove(){}},innerText:''});}},initGame(){}};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext('let pinyinVisible=true,zhuyinVisible=true,annotationAvailable={py:true,zy:true},tileQueue=[],validWords=[],originalVocabString="";'+['syncAnnotationVisibility','togglePinyin','toggleZhuyin','parseAndStart'].map(extract).join('\n'),ctx);
function run(s){return vm.runInContext(s,ctx)}
for(const [py,zy] of [['','ㄎㄜ'],['kè',''],['',''],['kè','ㄎㄜ']]){
 run('pinyinVisible=true;zhuyinVisible=true');ctx.raw=`W1,4,課,${py},${zy},ˋ,lesson`;run('parseAndStart(raw)');
 assert.equal(classes.has('hide-pinyin'),!py);assert.equal(classes.has('hide-zhuyin'),!zy);
 const toggle=zy?'toggleZhuyin()':'togglePinyin()';run(toggle);
 if(!py||!zy)assert.ok(classes.has('hide-pinyin')&&classes.has('hide-zhuyin'));
 run(toggle);assert.equal(classes.has('hide-pinyin'),!py);assert.equal(classes.has('hide-zhuyin'),!zy);
}
run('togglePinyin()');assert.equal(classes.has('hide-zhuyin'),false);run('toggleZhuyin()');assert.ok(classes.has('hide-pinyin')&&classes.has('hide-zhuyin'));
// A new dataset and a restart recompute availability without losing the user's toggles.
ctx.raw='W1,4,課,,ㄎㄜ,ˋ,lesson';run('parseAndStart(raw)');assert.ok(classes.has('hide-pinyin')&&classes.has('hide-zhuyin'));run('toggleZhuyin()');assert.equal(classes.has('hide-zhuyin'),false);
vm.runInContext(fs.readFileSync('vocab-data.js','utf8'),ctx);vm.runInContext(fs.readFileSync('student-data-adapter.js','utf8'),ctx);
for(const [py,zy] of [['','ㄎㄜ'],['kè',''],['',''],['kè','ㄎㄜ']]){run('pinyinVisible=true;zhuyinVisible=true');ctx.raw=`W1,4,課,${py},${zy},ˋ,lesson`;run('parseAndStart(raw)');assert.equal(classes.has('hide-pinyin'),!py);assert.equal(classes.has('hide-zhuyin'),!zy);if(zy)run('toggleZhuyin()');if(py)run('togglePinyin()');assert.ok(classes.has('hide-pinyin')&&classes.has('hide-zhuyin'));}
const review=html.slice(html.indexOf('const StudentReview ='));assert.ok(review.includes('card.classList.toggle(klass,!on || !has[kind])'));
console.log('PASS missing pinyin / missing zhuyin / neither / both, on-off restoration and dataset/restart availability.');
