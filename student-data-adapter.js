/* Data-only compatibility layer. Original student DOM, game rules and speech function remain unchanged. */
(()=>{'use strict';const legacyParse=parseAndStart;
parseAndStart=function(raw){let words;try{words=IMIVocabData.parse(raw);}catch(_){return legacyParse(raw);}originalVocabString=raw;tileQueue=[];let hasPy=false,hasZy=false;
validWords=words.map(w=>{const tiles=w.atoms.map(a=>{hasPy||=!!a.pinyin;hasZy||=!!a.zhuyin;const t={wordId:w.id,toneCode:String(a.tone),zh:a.char,py:a.pinyin,zy:Array.from(a.zhuyin),tone:a.mark,native:w.meaning};tileQueue.push(t);return t;});return{str:w.word,ttsStr:w.tts,native:w.meaning,tiles};});
document.getElementById('btnPy').style.display=hasPy?'flex':'none';document.getElementById('btnZy').style.display=hasZy?'flex':'none';initGame();};
})();
