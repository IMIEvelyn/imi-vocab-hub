/* IMI phonetic data: reviewed against MOE 國語注音符號手冊 §§6 and the
   2009-03-26 MOE Hanyu Pinyin comparison. See PHONETICS_DATA_REVIEW.md. */
(()=>{'use strict';
const initials='ㄅ:b ㄆ:p ㄇ:m ㄈ:f ㄉ:d ㄊ:t ㄋ:n ㄌ:l ㄍ:g ㄎ:k ㄏ:h ㄐ:j ㄑ:q ㄒ:x ㄓ:zh ㄔ:ch ㄕ:sh ㄖ:r ㄗ:z ㄘ:c ㄙ:s'.split(' ').map(x=>{const [zh,py]=x.split(':');return {zh,py}});
const finalCodes={a:'ㄚ',o:'ㄛ',e:'ㄜ',eh:'ㄝ',ai:'ㄞ',ei:'ㄟ',ao:'ㄠ',ou:'ㄡ',an:'ㄢ',en:'ㄣ',ang:'ㄤ',eng:'ㄥ',er:'ㄦ',i:'ㄧ',u:'ㄨ',v:'ㄩ',ia:'ㄧㄚ',ie:'ㄧㄝ',iao:'ㄧㄠ',iu:'ㄧㄡ',ian:'ㄧㄢ',in:'ㄧㄣ',iang:'ㄧㄤ',ing:'ㄧㄥ',ua:'ㄨㄚ',uo:'ㄨㄛ',uai:'ㄨㄞ',ui:'ㄨㄟ',uan:'ㄨㄢ',un:'ㄨㄣ',uang:'ㄨㄤ',ong:'ㄨㄥ',ve:'ㄩㄝ',van:'ㄩㄢ',vn:'ㄩㄣ',iong:'ㄩㄥ'};
const finalSpell={eh:'ê',v:'ü',iu:'iou',ui:'uei',un:'uen',ong:'ueng',ve:'üe',van:'üan',vn:'ün'};
const finals=Object.entries(finalCodes).map(([code,zh])=>({code,zh,py:finalSpell[code]||code,group:zh.length>1?'結合韻':'韻母'}));
// Explicit whitelist: absence never means “join the letters anyway”.
const rows={
b:'a o ai ei ao an en ang eng i ie iao ian in ing u',
p:'a o ai ei ao ou an en ang eng i ie iao ian in ing u',
m:'a o e ai ei ao ou an en ang eng i ie iao iu ian in ing u',
f:'a o ei ou an en ang eng u',
d:'a e ai ei ao ou an ang eng ong i ie iao iu ian ing u uo ui uan un',
t:'a e ai ao ou an ang eng ong i ie iao ian ing u uo ui uan un',
n:'a e ai ei ao ou an en ang eng ong i ie iao iu ian in iang ing u uo uan v ve',
l:'a e ai ei ao ou an ang eng ong i ia ie iao iu ian in iang ing u uo uan un v ve',
g:'a e ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang',
k:'a e ai ao ou an en ang eng ong u ua uo uai ui uan un uang',
h:'a e ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang',
j:'i ia ie iao iu ian in iang ing iong v ve van vn',
q:'i ia ie iao iu ian in iang ing iong v ve van vn',
x:'i ia ie iao iu ian in iang ing iong v ve van vn',
zh:'a e ai ei ao ou an en ang eng ong u ua uo uai ui uan un uang',
ch:'a e ai ao ou an en ang eng ong u uo uai ui uan un uang',
sh:'a e ai ei ao ou an en ang eng u ua uo uai ui uan un uang',
r:'e ao ou an en ang eng ong u uo ui uan un',
z:'a e ai ei ao ou an en ang eng ong u uo ui uan un',
c:'a e ai ao ou an en ang eng ong u uo ui uan un',
s:'a e ai ao ou an en ang eng ong u uo ui uan un'
};
const neutral=[
{py:'ba',zh:'ㄅㄚ',character:'吧',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=103&la=0&powerMode=0'},
{py:'ma',zh:'ㄇㄚ',character:'嗎',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=3600&la=0&powerMode=0'},
{py:'me',zh:'ㄇㄜ',character:'麼',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=3783&la=0&powerMode=0'},
{py:'de',zh:'ㄉㄜ',character:'的',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=7457&q=1'},
{py:'ne',zh:'ㄋㄜ',character:'呢',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=12181&la=0&powerMode=0'},
{py:'le',zh:'ㄌㄜ',character:'了',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=13268&la=0&powerMode=0'},
{py:'men',zh:'ㄇㄣ',character:'們',source:'https://dict.concised.moe.edu.tw/dictView.jsp?ID=45128&la=0&powerMode=0'}
];
function spell(initial,code){let end=code;if(code.startsWith('v'))end=(['j','q','x'].includes(initial)?'u':'ü')+({v:'',ve:'e',van:'an',vn:'n'}[code]);return initial+end}
const syllables=initials.flatMap(i=>rows[i.py].split(' ').map(code=>({initial:i.zh,final:finalCodes[code],zh:i.zh+finalCodes[code],py:spell(i.py,code)})));
const marks={0:'',1:'',2:'ˊ',3:'ˇ',4:'ˋ',5:'˙'},vowelMarks={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù','ü':'ǖǘǚǜ'};
function tonePinyin(py,tone){if(!tone||tone===5)return py;let at=py.indexOf('a');if(at<0)at=py.indexOf('e');if(at<0&&py.includes('ou'))at=py.indexOf('o');if(at<0){for(let i=py.length-1;i>=0;i--)if(vowelMarks[py[i]]){at=i;break}}return at<0?py:py.slice(0,at)+vowelMarks[py[at]][tone-1]+py.slice(at+1)}
function combine(chosenInitials,chosenFinals){return syllables.filter(s=>chosenInitials.includes(s.initial)&&chosenFinals.includes(s.final)).map(s=>({...s}))}
function questions(list,tones){const selected=[...new Set(tones)].filter(t=>Number.isInteger(t)&&t>=0&&t<=5);if(selected.includes(0)&&selected.length!==1)throw Error('不加聲調不能與其他聲調同時選取。');return list.flatMap(s=>selected.filter(t=>t!==5||neutral.some(n=>n.zh===s.zh)).map(t=>({...s,id:'blend:'+s.zh+':'+t,baseZh:s.zh,zh:s.zh+marks[t],py:tonePinyin(s.py,t),tone:t,mark:marks[t],kind:'sound',group:'聲韻拼合'})))}
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function split(zh){return {symbols:Array.from(zh||'').filter(s=>/[ㄅ-ㄩ]/.test(s)),mark:(String(zh||'').match(/[ˊˇˋ˙]/)||[''])[0]}}
function markup(zh,py='',style='combined'){const {symbols,mark}=split(zh);if(!symbols.length)return escape(py||zh);return '<span class="ph-reading ph-length-'+symbols.length+'">'+(style!=='pinyin'?'<span class="ph-stack"><span class="ph-column">'+symbols.map(z=>'<span>'+escape(z)+'</span>').join('')+(mark==='˙'?'<span class="ph-neutral" aria-label="輕聲"></span>':mark?'<span class="ph-tone">'+mark+'</span>':'')+'</span></span>':'')+(style!=='zhuyin'&&py?'<span class="ph-pinyin">'+escape(py)+'</span>':'')+'</span>'}
function parse(value){const parts=String(value).split(/\s*\/\s*/);return {zh:parts.find(x=>/[ㄅ-ㄩ]/.test(x))||'',py:parts.find(x=>!/[ㄅ-ㄩ]/.test(x))||''}}
function drawCanvas(ctx,zh,py,style,size,limit=260){const {symbols,mark}=split(zh),hasZh=style!=='pinyin'&&symbols.length,hasPy=style!=='zhuyin'&&py;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const step=size*1.04,pySize=size*.48,total=(hasZh?symbols.length*step:0)+(hasPy?pySize*1.5:0),top=-total/2;if(hasZh){symbols.forEach((z,i)=>{ctx.font='700 '+size+'px sans-serif';ctx.fillText(z,0,top+step*(i+.5))});if(mark==='˙'){ctx.beginPath();ctx.arc(0,top-size*.13,size*.1,0,Math.PI*2);ctx.fill()}else if(mark){ctx.font='700 '+size*1.2+'px sans-serif';ctx.fillText(mark,size*.66,top+symbols.length*step/2)}}if(hasPy){ctx.font='700 '+(hasZh?pySize:size)+'px sans-serif';ctx.fillText(py,0,hasZh?top+symbols.length*step+pySize*.8:0,limit)}ctx.restore()}
window.IMIPhonetic={initials,finals,syllables,neutral,combine,questions,tonePinyin,markup,parse,split,drawCanvas};
})();
