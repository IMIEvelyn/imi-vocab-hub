/* Student Chinese typography only. Source text, annotation metrics and game data are retained. */
(()=>{'use strict';
const root=document.documentElement,selectors='.greet-hz,.review-hz,#displayMaterialName,#displayInfoTags .info-tag,.marquee-item,#reviewTitle';
const ignored='.imi-han-cell,.marquee-translation,.greet-py,.greet-zhuyin-box,.review-annotation,#reviewPinyin,#reviewForeign';
let enabled=false,pending=false,epoch=0;
const cache=new Map();
// A visual scale never changes the original character's advance width or line height.
const scale=new URLSearchParams(location.search).get('fontSample')==='100'?1:1.05;
root.style.setProperty('--imi-han-scale',scale);
function decorate(){
 if(!enabled)return;
 document.querySelectorAll(selectors).forEach(host=>{
  const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT,{acceptNode(n){return n.parentElement.closest(ignored)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}}),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){if(!/[\p{Script=Han}，。？！、；：「」『』（）《》〈〉]/u.test(node.data))continue;
   const fragment=document.createDocumentFragment();
   for(const char of node.data){if(!/[\p{Script=Han}，。？！、；：「」『』（）《》〈〉]/u.test(char)){fragment.append(document.createTextNode(char));continue;}
    const cell=document.createElement('span');cell.className='imi-han-cell';
    const metric=document.createElement('span');metric.className='imi-han-metric';metric.textContent=char;metric.setAttribute('aria-hidden','true');
    const ink=document.createElement('span');ink.className='imi-han-ink';ink.textContent=char;
    cell.append(metric,ink);fragment.append(cell);
   }node.replaceWith(fragment);
  }
 });
}
function schedule(){if(pending||!enabled)return;pending=true;queueMicrotask(()=>{pending=false;decorate();});}
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});
function status(message,retry){let box=document.getElementById('imiFontStatus');if(!box){box=document.createElement('div');box.id='imiFontStatus';box.setAttribute('role','status');document.body.append(box);}box.replaceChildren(document.createTextNode(message));box.hidden=!message;if(retry){const button=document.createElement('button');button.textContent='重試 Retry';button.onclick=retry;box.append(button);}}
async function load(script){
 const name=script==='simplified'?'IMIPDFSimplified':'IMIPDFTraditional';
 if(!cache.has(name)){const task=(async()=>{let timer;try{await Promise.race([document.fonts.load('400 64px '+name,'晚安準備好了嗎課老師学'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),20000);})]).then(faces=>{if(!faces.length)throw Error('unregistered');});}finally{clearTimeout(timer);}})();cache.set(name,task);task.catch(()=>cache.delete(name));}
 return cache.get(name);
}
const originalInit=initGame;
initGame=async function(){
 const token=++epoch;enabled=false;root.classList.add('imi-font-waiting');status('準備中… Preparing…');
 try{
  const script=IMIVocabExport.detectChineseFont(validWords.map(w=>({word:w.str})));
  await load(script);if(token!==epoch)return;
  root.dataset.imiScript=script;enabled=true;decorate();originalInit();decorate();adjustScale();status('');root.classList.remove('imi-font-waiting');
 }catch(error){if(token!==epoch)return;status('中文字體未能載入，請檢查網路後重試。Font unavailable.',()=>initGame());console.error('Student Chinese font unavailable',error);}
};
const originalMarquee=updateMarquee;
updateMarquee=function(){originalMarquee();decorate();};
window.IMIStudentTypography=Object.freeze({decorate,scale});
})();
