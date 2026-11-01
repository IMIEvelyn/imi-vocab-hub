/* IMI local pronunciation-to-text lookup. Dictionary match is not an audible guarantee. */
(function(root){'use strict';let cached,cacheSource;
const D=root.IMIVocabData;
function reading(zy,py){if(!zy||!py||/\s/u.test(zy.trim())||/\s/u.test(py.trim()))return null;const z=zy.trim(),tone=z.includes('˙')?5:z.includes('ˊ')?2:z.includes('ˇ')?3:z.includes('ˋ')?4:1;return{py:D.bare(py),zy:z.replace(/[˙ˊˇˋˉ]/g,''),tone};}
function index(lex){if(cacheSource===lex&&cached)return cached;const entries=[],freq=new Map,words=lex?.words||{};
 for(const word of Object.keys(words))for(const char of word)freq.set(char,(freq.get(char)||0)+1);
 for(const [char,rows]of Object.entries(words)){if(!/^\p{Script=Han}$/u.test(char))continue;const forms=new Map;for(const row of rows)for(const [z,p]of [[row.zhuyin,row.pinyin],[row.variantZhuyin,row.variantPinyin]]){const r=reading(z,p);if(r)forms.set(JSON.stringify(r),r)}for(const r of forms.values())entries.push({...r,char,ambiguity:forms.size,frequency:freq.get(char)||0});}
 cached=entries;cacheSource=lex;return entries;
}
// Teacher listening evidence, 2026-11-01: Chrome 156/macOS, 美佳 zh-TW, rate 0.8.
// These are pronunciation-only substitutions; written vocabulary and annotations never change.
const verifiedFor={voice:'美佳',language:'zh-TW',rate:0.8,evidence:'teacher-trial-20261101'};
function verifiedRule(a){
 const py=D.bare(a.pinyin||''),zy=a.zhuyin||'';if(!py&&!zy)return null;
 if(a.char==='了'&&a.tone===3&&(!py||py==='liao')&&(!zy||zy==='ㄌㄧㄠ'))return {char:'釕',alternatives:['蓼'],py:'liao',zy:'ㄌㄧㄠ',tone:3};
 if(a.char==='不'&&a.tone===2&&(!py||py==='bu')&&(!zy||zy==='ㄅㄨ'))return {char:'醭',alternatives:[],py:'bu',zy:'ㄅㄨ',tone:2};
 return null;
}
function needsAudibleReview(a){const r=verifiedRule(a);return !!r&&!([r.char,...r.alternatives].includes(a.tts)&&a.speech?.key===D.speechKey(a)&&!a.speech?.unresolved);}
function trialCandidates(a){const r=verifiedRule(a);return r?[r.char,...r.alternatives]:[];}
function lookup(a,lex,forceAlternative=true){const py=D.bare(a.pinyin||''),zy=a.zhuyin||'',tone=a.tone;if(/[兒儿]/u.test(a.char)||py.endsWith('r')&&py!=='er')return{ok:false,reason:'erhua'};
 if(![1,2,3,4,5].includes(tone)||!py&&!zy)return{ok:false,reason:'missing-reading'};
 const approved=verifiedRule(a);if(approved)return {ok:true,...approved,isolate:true,verifiedFor:{...verifiedFor}};
 if(a.char==='了'&&py==='le'&&tone===5&&(!zy||zy==='ㄌㄜ'))return {ok:true,char:'了',py:'le',zy:'ㄌㄜ',tone:5,isolate:false};
 const all=index(lex),p=all.filter(r=>r.tone===tone&&(!py||r.py===py)&&(!zy||r.zy===zy));
 if(!p.length)return{ok:false,reason:py&&zy&&all.some(r=>r.tone===tone&&(r.py===py||r.zy===zy))?'conflicting-or-incomplete-reading':'no-match'};
 const preferred=new Set(['航','勒','色','砝','你']); // Existing IMI examples, still required to match the requested reading.
 p.sort((x,y)=>Number(preferred.has(y.char))-Number(preferred.has(x.char))||Number(x.char===a.char)-Number(y.char===a.char)||x.ambiguity-y.ambiguity||y.frequency-x.frequency||x.char.localeCompare(y.char,'zh-Hant'));
 if(!forceAlternative&&!p.some(r=>preferred.has(r.char))){const same=p.find(r=>r.char===a.char&&r.ambiguity===1);if(same)return{ok:true,char:same.char,py:same.py,zy:same.zy,tone,ambiguous:false};}
 const alternatives=p.filter(r=>r.char!==a.char);if(!alternatives.length)return{ok:false,reason:'no-alternative'};
 const chosen=alternatives.find(r=>preferred.has(r.char))||alternatives.find(r=>r.ambiguity===1)||alternatives[0];return{ok:true,char:chosen.char,py:chosen.py,zy:chosen.zy,tone,ambiguous:chosen.ambiguity>1};
}
function manual(w){return !!w.speechWhole?.active||w.atoms.some(D.manualAtom);}
function apply(w,original,lex,all=false,requested=[]){const missing=[],mapped=[];w.atoms.forEach((a,i)=>{if(!all&&!requested.includes(i))return;if(D.manualAtom(a))return;if(!all&&!requested.includes(i)&&a.speech?.mode==='auto'&&a.speech.key===D.speechKey(a))return;if(!all&&original&&D.speechKey(a)===D.speechKey(original.atoms[i]||{})&&!requested.includes(i))return;const r=lookup(a,lex,requested.includes(i)||!all);if(r.ok){a.tts=r.char;a.speech={v:2,mode:'auto',key:D.speechKey(a),value:a.tts,isolate:r.isolate??true};if(r.verifiedFor)a.speech.verifiedFor={...r.verifiedFor};delete a.speechMetaRaw;mapped.push(i);}else{a.tts=a.char;a.speech={v:2,mode:'auto',key:D.speechKey(a),value:a.tts,isolate:false,unresolved:true,reason:r.reason};delete a.speechMetaRaw;missing.push({index:i,char:a.char,reason:r.reason});}});D.refreshSpeech(w);return{mapped,missing,text:w.tts};}
root.IMISpeechMap={lookup,apply,manual,verifiedRule,needsAudibleReview,trialCandidates};
})(typeof window==='undefined'?globalThis:window);
