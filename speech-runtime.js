/* Same browser speech service; optional ordered segments isolate corrected positions. */
(()=>{'use strict';let serial=0,active=null,timer=null,voices=[],last=null,pending=null;const synth=window.speechSynthesis;
const norm=s=>String(s).replace(/_/g,'-').toLowerCase(),preferred=['Ting-Ting','Xiaoxiao','曉曉','Huihui','Mei-Jia','美佳','Hanhan','Google'];
function refresh(){try{voices=synth?.getVoices()||[]}catch(_){voices=[]}return voices;}
function stop(){serial++;if(timer!==null){clearTimeout(timer);timer=null;}active=null;pending=null;synth?.cancel();}
const messages={'synthesis-failed':'語音合成失敗，請再試一次。','synthesis-unavailable':'目前沒有可用的語音合成服務。','language-unavailable':'目前沒有此口音的可用聲音。','voice-unavailable':'選取的聲音目前無法使用。','not-allowed':'請再次點擊喇叭啟動朗讀。','network':'語音連線失敗，請稍後再試。','audio-busy':'音訊輸出忙碌，請稍後再試。','audio-hardware':'目前無法使用音訊輸出。'};
function play(input,callbacks={}){const texts=(Array.isArray(input)?input:[input]).map(x=>String(x??'')).filter(x=>x.trim());if(!texts.length)return;stop();const token=serial;if(!synth||typeof SpeechSynthesisUtterance==='undefined'){last={texts,error:'unsupported'};callbacks.error?.({error:'unsupported'});return;}
 const student=typeof URL_DATA!=='undefined'&&!!URL_DATA,target=student?(window.currentAccent||'zh-TW'):(document.getElementById('inputAccent')?.value||'zh-TW');
 const messagesToSpeak=texts.map(text=>{const msg=new SpeechSynthesisUtterance(text);msg.lang=target;msg.rate=target==='zh-CN'?1:.8;return msg;});let started=false,position=0;
 active=messagesToSpeak[0];const live=()=>serial===token;
 function next(){if(!live())return;const msg=messagesToSpeak[position];active=msg;last={...last,segment:position+1};
 msg.onstart=e=>{if(live()&&active===msg&&!started){started=true;callbacks.start?.(e)}};
 msg.onend=e=>{if(!live()||active!==msg)return;if(++position<messagesToSpeak.length)next();else{active=null;callbacks.end?.(e)}};
 msg.onerror=e=>{if(!live()||active!==msg)return;active=null;serial++;last={...last,error:e.error||'unknown'};if(!['canceled','interrupted'].includes(e.error))callbacks.error?.(e)};
 try{synth.speak(msg)}catch(e){msg.onerror({error:'synthesis-failed',message:e.message})}}
 function speak(){timer=null;pending=null;if(!live())return;const matching=refresh().filter(v=>(norm(v.lang)===norm(target)||norm(v.lang).startsWith(norm(target)+'-')));const chosen=matching.find(v=>preferred.some(name=>v.name.includes(name)))||matching[0];for(const msg of messagesToSpeak)if(chosen)msg.voice=chosen;
 last={texts:[...texts],lang:target,rate:messagesToSpeak[0].rate,voice:chosen?.name||null,voiceLanguage:chosen?.lang||null,voiceCount:voices.length,error:null,defaultUnverified:!chosen,segment:1};callbacks.info?.({...last,texts:[...texts]});if(live())next();}
 if(!student&&!refresh().length){callbacks.waiting?.();pending=speak;timer=setTimeout(speak,1200);}else speak();return messagesToSpeak[0];
}
refresh();synth?.addEventListener?.('voiceschanged',()=>{refresh();if(timer!==null&&voices.length){clearTimeout(timer);timer=null;const run=pending;pending=null;run?.();}});
window.IMISpeech={stop,diagnostics:()=>last?{...last,texts:last.texts?[...last.texts]:[]}:null,errorMessage:code=>messages[code]||'目前無法播放語音，請再試一次。'};
playAudio=play;
})();
