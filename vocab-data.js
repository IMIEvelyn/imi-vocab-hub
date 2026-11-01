/* IMI data adapter. Stored annotation strings are immutable unless explicitly edited. */
(function(root){'use strict';
const marks={1:'',2:'ˊ',3:'ˇ',4:'ˋ',5:'˙'};
function csv(text){text=String(text).replace(/^\uFEFF/,'');const first=text.split(/\r?\n/).find(x=>x.trim())||'',delimiter=first.includes('\t')&&!first.includes(',')?'\t':',';let rows=[],cells=[],field='',quoted=false,closed=false,line=1,start=1;
 const cell=()=>{cells.push(field);field='';closed=false;},row=()=>{cell();if(cells.some(x=>x.trim()))rows.push({cells,line:start});cells=[];};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else{field+=c;if(c==='\n')line++;}continue;}if(c==='"'){if(field.trim()||closed)throw Error('第'+line+'行：引號位置不正確');field='';quoted=true;}else if(c===delimiter)cell();else if(c==='\n'){row();line++;start=line;}else if(c==='\r'&&text[i+1]==='\n')continue;else if(closed&&!/\s/.test(c))throw Error('第'+line+'行：引號後須為分隔符號');else field+=c;}
 if(quoted)throw Error('第'+start+'行：引號未關閉');row();return rows;
}
const field=s=>/[",\r\n]/.test(String(s))?'"'+String(s).replaceAll('"','""')+'"':String(s);
const stringify=rows=>rows.map(r=>r.map(field).join(',')).join('\n');
function bare(py){return String(py).normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g,'').normalize('NFC').toLowerCase();}
function toneOf(py){const x=String(py).normalize('NFD').match(/[\u0304\u0301\u030c\u0300]/g)||[];return x.map(c=>({'\u0304':1,'\u0301':2,'\u030c':3,'\u0300':4})[c]);}
function speechKey(a){return JSON.stringify([a.char||'',bare(a.pinyin||''),a.zhuyin||'',a.tone??null]);}
function parse(text){const map=new Map;for(const {cells:c,line}of csv(text)){if(c[0].trim().startsWith('```'))continue;if(['詞彙組別','wordId'].includes(c[0].trim()))continue;
 if(![7,8,9].includes(c.length))throw Error('第'+line+'行：需要7、8或9欄，目前'+c.length+'欄');
 const [id,tone,zh,py,zy,mark,meaning]=c.map(x=>x.trim());if(!id||Array.from(zh).length!==1||!/^\p{Script=Han}$/u.test(zh))throw Error('第'+line+'行：組別不可空白，中文須一字一行');if(!/^[1-5]$/.test(tone))throw Error('第'+line+'行：聲調須為1～5');
 if(!map.has(id))map.set(id,{id,atoms:[],errors:[],warnings:[]});const w=map.get(id);const a={char:zh,pinyin:py,zhuyin:zy,tone:Number(tone),mark,meaning,line,tts:c.length>=8?c[7]:null};if(c.length===9){let meta;try{meta=JSON.parse(c[8]);}catch(_){throw Error('第'+line+'行：朗讀來源紀錄格式不正確，原稿保留');}
 if(!meta||![1,2].includes(meta.v)||typeof meta.key!=='string'||meta.key.length>500||!(meta.v===1?meta.mode==='auto':['auto','manual','original'].includes(meta.mode)))throw Error('第'+line+'行：不支援的朗讀來源紀錄，原稿保留');
 if(meta.v===2){if(!(meta.value===null||typeof meta.value==='string')||typeof meta.isolate!=='boolean')throw Error('第'+line+'行：逐字朗讀資料不正確');a.tts=meta.value;
 if(meta.whole!==undefined){if(w.atoms.length||!meta.whole||typeof meta.whole.text!=='string'||typeof meta.whole.active!=='boolean'||(meta.whole.active&&!meta.whole.text.trim()))throw Error('第'+line+'行：整詞朗讀資料不正確');w.speechWhole={text:meta.whole.text,active:meta.whole.active};}}
 a.speech=meta;a.speechMetaRaw=c[8];if(meta.unresolved)w.warnings.push('第'+line+'行朗讀尚需人工修正');if(meta.mode==='auto'&&meta.key!==speechKey(a))w.warnings.push('第'+line+'行自動朗讀與標音不同，請重新產生或手動修正');}w.atoms.push(a);
 if(zy&&!/^[ㄅ-ㄩ]+$/.test(zy))w.errors.push('第'+line+'行注音欄須僅含符號，調號放第六欄');
 if(zy&&mark!==marks[a.tone]&&!(a.tone===1&&mark==='ˉ'))w.errors.push('第'+line+'行注音聲調與聲調數字不符');if(!zy&&mark)w.errors.push('第'+line+'行缺注音卻有調號');
 if(py&&!/^[a-züêāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ0-5'’:-]+$/iu.test(py))w.errors.push('第'+line+'行拼音含不支援字元');
 if(/<\s*\/?[a-z][^>]*>/iu.test(meaning))w.errors.push('第'+line+'行翻譯須為純文字，不接受HTML標籤');
 if(py&&(toneOf(py).some(t=>t!==a.tone)))w.errors.push('第'+line+'行拼音聲調不一致');
 if(!py&&!zy)w.warnings.push('第'+line+'行未附標音，請教師核對');
 }
 return [...map.values()].map(w=>{w.word=w.atoms.map(a=>a.char).join('');w.pinyin=w.atoms.map(a=>a.pinyin).join(' ');w.zhuyin=w.atoms.map(a=>a.zhuyin).join(' ');const meanings=[...new Set(w.atoms.map(a=>a.meaning).filter(Boolean))];if(meanings.length>1)w.errors.push('同一詞彙的外語意思不一致');w.meaning=meanings[0]||'';
 // An explicitly blank eighth field means silence, never “replace with the original glyph”.
 refreshSpeech(w);if(!w.tts.trim())w.errors.push('整詞發音字串不可全空白');
 if(/[兒儿]/.test(w.word)||w.atoms.some(a=>/r$/.test(bare(a.pinyin))&&bare(a.pinyin)!=='er'))w.warnings.push('含兒／儿或可能兒化：專門處理暫緩，請人工核對');
 return w;});
}
function atomText(a){return a.tts===null?a.char:a.tts;}
function refreshSpeech(w){w.tts=w.speechWhole?.active?w.speechWhole.text:w.atoms.map(atomText).join('');return w;}
function speechPlan(w){if(w.speechWhole?.active)return [w.speechWhole.text];const parts=[];let joined='';const flush=()=>{if(joined.trim())parts.push(joined);joined='';};for(const a of w.atoms){const text=atomText(a);if(a.speech?.isolate){flush();if(text.trim())parts.push(text);}else joined+=text;}flush();return parts;}
function manualAtom(a){return a.tts!==null&&a.speech?.mode!=='auto'&&a.speech?.mode!=='original';}
function legacyManual(w){return w.atoms.some(a=>a.tts!==null&&!a.speech);}
function editSpeech(w){if(legacyManual(w)){const text=w.tts;w.speechWhole={text,active:true};for(const a of w.atoms){a.tts=null;delete a.speech;delete a.speechMetaRaw;}}return refreshSpeech(w);}
function rows(words){return words.flatMap(w=>w.atoms.map((a,i)=>{const c=[w.id,String(a.tone),a.char,a.pinyin,a.zhuyin,a.mark,a.meaning];const whole=w.speechWhole;const effective=whole?.active?(i===0?whole.text:' '):a.tts;
 if(whole||a.speech?.v===2){const meta={...(a.speech||{}),v:2,mode:a.speech?.mode||'original',key:a.speech?.key||speechKey(a),value:a.tts,isolate:!!a.speech?.isolate};delete meta.whole;if(i===0&&whole)meta.whole={...whole};c.push(effective===null?a.char:effective,JSON.stringify(meta));}
 else {if(a.tts!==null)c.push(a.tts);if(a.speech){if(a.tts===null)throw Error('自動朗讀缺少替代文字');c.push(a.speechMetaRaw||JSON.stringify(a.speech));}}return c;}));}
const encode=words=>stringify(rows(words));
function setSpeech(w,text){if(!String(text).trim())throw Error('發音修正不可全空白');w.speechWhole={text:String(text),active:true};return refreshSpeech(w);}
function setAtomSpeech(w,i,text,isolate=true){const a=w.atoms[i];if(!a)throw Error('請先選擇字位');if(!String(text).trim())throw Error('單字修正不可全空白');a.tts=String(text);a.speech={v:2,mode:'manual',key:speechKey(a),value:a.tts,isolate:!!isolate};delete a.speechMetaRaw;if(w.speechWhole)w.speechWhole.active=false;return refreshSpeech(w);}
function tonePinyin(py,t){if(t===5)return py;const vm={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù',ü:'ǖǘǚǜ'};let i=py.indexOf('a');if(i<0)i=py.indexOf('e');if(i<0&&py.includes('ou'))i=py.indexOf('o');if(i<0)for(let j=py.length-1;j>=0;j--)if(vm[py[j]]){i=j;break;}return i<0?py:py.slice(0,i)+vm[py[i]][t-1]+py.slice(i+1);}
function isRisk(w){return !!(w.errors.length||w.warnings.length||w.atoms.some(a=>a.tone===5)||/[轉转重行髮发教長长樂乐假覺觉差得地著着還还了]/.test(w.word));}
const api={csv,stringify,parse,rows,encode,bare,marks,setSpeech,setAtomSpeech,tonePinyin,isRisk,speechKey,refreshSpeech,speechPlan,manualAtom,legacyManual,editSpeech};root.IMIVocabData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
