/* Same browser speech service and original voice preference. No remote API or recording. */
(()=>{'use strict';let serial=0,active=null,timer=null,voices=[],last=null,pending=null;const synth=window.speechSynthesis;
const norm=s=>String(s).replace(/_/g,'-').toLowerCase(),preferred=['Ting-Ting','Xiaoxiao','曉曉','Huihui','Mei-Jia','美佳','Hanhan','Google'];
function refresh(){try{voices=synth?.getVoices()||[]}catch(_){voices=[]}return voices;}
function stop(){serial++;if(timer!==null){clearTimeout(timer);timer=null;}active=null;pending=null;synth?.cancel();}
const messages={'synthesis-failed':'語音合成失敗，請再試一次。','synthesis-unavailable':'目前沒有可用的語音合成服務。','language-unavailable':'目前沒有此口音的可用聲音。','voice-unavailable':'選取的聲音目前無法使用。','not-allowed':'請再次點擊喇叭啟動朗讀。','network':'語音連線失敗，請稍後再試。','audio-busy':'音訊輸出忙碌，請稍後再試。','audio-hardware':'目前無法使用音訊輸出。'};
function play(text,callbacks={}){if(!String(text||'').trim())return;stop();const token=serial;if(!synth||typeof SpeechSynthesisUtterance==='undefined'){last={error:'unsupported'};callbacks.error?.({error:'unsupported'});return;}
 const student=typeof URL_DATA!=='undefined'&&!!URL_DATA,target=student?(window.currentAccent||'zh-TW'):(document.getElementById('inputAccent')?.value||'zh-TW');
 const msg=new SpeechSynthesisUtterance(String(text));active=msg;msg.lang=target;msg.rate=target==='zh-CN'?1:.8;
 const current=()=>serial===token&&active===msg;
 msg.onstart=e=>{if(current())callbacks.start?.(e)};msg.onend=e=>{if(current()){active=null;callbacks.end?.(e)}};
 msg.onerror=e=>{if(!current())return;active=null;last={...last,error:e.error||'unknown'};if(!['canceled','interrupted'].includes(e.error))callbacks.error?.(e)};
 function speak(){timer=null;pending=null;if(!current())return;const matching=refresh().filter(v=>(norm(v.lang)===norm(target)||norm(v.lang).startsWith(norm(target)+'-')));const chosen=matching.find(v=>preferred.some(name=>v.name.includes(name)))||matching[0];if(chosen)msg.voice=chosen;
 last={lang:target,rate:msg.rate,voice:chosen?.name||null,voiceLanguage:chosen?.lang||null,voiceCount:voices.length,error:null,defaultUnverified:!chosen};callbacks.info?.({...last});
 try{synth.speak(msg)}catch(e){msg.onerror({error:'synthesis-failed',message:e.message})}}
 // Preload/listen globally; only the teacher waits, preserving student event timing and flows.
 if(!student&&!refresh().length){callbacks.waiting?.();pending=speak;timer=setTimeout(speak,1200);}else speak();return msg;
}
refresh();synth?.addEventListener?.('voiceschanged',()=>{refresh();if(timer!==null&&voices.length){clearTimeout(timer);timer=null;const run=pending;pending=null;run?.();}});
window.IMISpeech={stop,diagnostics:()=>last?{...last}:null,errorMessage:code=>messages[code]||'目前無法播放語音，請再試一次。'};
playAudio=play;
})();
