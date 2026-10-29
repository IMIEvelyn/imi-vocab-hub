/* IMI classroom vocabulary export. A4 pages at 300 dpi; no data leaves this browser. */
(function(global){'use strict';
const W=2480,H=3508,M=110,TOP=230,BOTTOM=H-150,GAP=28,COL=(W-2*M)/4;
const FAMILY='"IMIExport", "Noto Sans CJK TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

function presentation(style='combined',showMeaning=true){const names={combined:['word','pinyin','zhuyin'],chinese:['word'],pinyin:['pinyin'],zhuyin:['zhuyin'],hanpy:['word','pinyin'],hanzh:['word','zhuyin'],pyzh:['pinyin','zhuyin']},labels={word:'中文',pinyin:'拼音',zhuyin:'注音',meaning:'意思'},keys=(names[style]||names.combined).slice();if(showMeaning)keys.push('meaning');return {style,showMeaning:!!showMeaning,han:keys.includes('word'),py:keys.includes('pinyin'),zh:keys.includes('zhuyin'),columns:keys.map(key=>({key,label:labels[key]})),label:(names[style]||names.combined).map(k=>labels[k]).join('＋')}}

function font(ctx,size,bold=false){ctx.font=(bold?'700 ':'400 ')+size+'px '+FAMILY}

// Two full-width lines. Never wrap, clip or shrink the teacher's header text.
function headerLines(config={}){
 const clean=value=>String(value??'').replace(/\s+/gu,' ').trim(),h=config.header||{};
 const rawDate=clean(h.date),date=/^\d{4}-\d{2}-\d{2}$/.test(rawDate)?rawDate.replace(/-/g,'/'):rawDate;
 const first=[date,clean(h.className)].filter(Boolean).join('  ');
 return [[first,clean(h.language)].filter(Boolean).join(' / '),[clean(config.title),clean(h.teacherName)].filter(Boolean).join(' / ')];
}
function checkHeader(ctx,config){
 const previous=ctx.font,lines=headerLines(config);
 try{for(let i=0;i<lines.length;i++){font(ctx,i===0?44:30,i===0);if(ctx.measureText(lines[i]).width>W-2*M)throw Error('PDF頁首第'+(i===0?'一':'二')+'行超出整頁寬度，請縮短'+(i===0?'日期／班級（學生）／輔助外語種。':'教材名稱／老師姓名。'));}}
 finally{ctx.font=previous;}
 return lines;
}

// Place tones from visible glyph bounds, rather than font advance boxes.
function drawZhuyin(ctx,a,bx,cy,bs){
 const previous={font:ctx.font,textAlign:ctx.textAlign,textBaseline:ctx.textBaseline};
 ctx.textAlign='left';ctx.textBaseline='alphabetic';font(ctx,bs);
 function ink(text){const m=ctx.measureText(text);return {left:Number.isFinite(m.actualBoundingBoxLeft)?m.actualBoundingBoxLeft:0,right:Number.isFinite(m.actualBoundingBoxRight)?m.actualBoundingBoxRight:m.width,ascent:Number.isFinite(m.actualBoundingBoxAscent)?m.actualBoundingBoxAscent:bs*.8,descent:Number.isFinite(m.actualBoundingBoxDescent)?m.actualBoundingBoxDescent:bs*.2}}
 const symbols=Array.from(a.zhuyin),step=bs*1.03;let right=-Infinity,top=Infinity;
 symbols.forEach((text,i)=>{const m=ink(text),center=cy+(i-(symbols.length-1)/2)*step,x=bx+(m.left-m.right)/2,y=center+(m.ascent-m.descent)/2;ctx.fillText(text,x,y);right=Math.max(right,x+m.right);top=Math.min(top,y-m.ascent)});
 if(a.tone===5){const diameter=bs*.2,gap=bs*.12;ctx.beginPath();ctx.arc(bx,top-gap-diameter/2,diameter/2,0,Math.PI*2);ctx.fill()}
 else if(a.tone!==1&&a.mark){font(ctx,bs*1.3,true);const m=ink(a.mark);ctx.fillText(a.mark,right+bs*.12+m.left,cy+(m.ascent-m.descent)/2)}
 ctx.font=previous.font;ctx.textAlign=previous.textAlign;ctx.textBaseline=previous.textBaseline;
}
function wrap(ctx,text,width){const out=[];for(const paragraph of String(text||'—').split(/\r?\n/)){let line='';for(const ch of Array.from(paragraph)){if(line&&ctx.measureText(line+ch).width>width){out.push(line);line=ch}else line+=ch}out.push(line||'')}return out}
// Table cells use the same per-character source as cards, never the flattened zhuyin string.
function tableColumns(config){return [{key:'vocabulary',label:'詞彙'},...(config.showMeaning?[{key:'meaning',label:'意思'}]:[])]}
function wrapTableText(ctx,text,width){
 const lines=[];for(const paragraph of String(text||'—').split(/\r?\n/)){
  let line='';for(const token of paragraph.match(/\s+|[\p{L}\p{M}\p{N}’'-]+|[^\s]/gu)||[]){
   if(!line&&!token.trim())continue;
   if(line&&ctx.measureText(line+token).width>width){lines.push(line.trimEnd());line='';if(!token.trim())continue}
   if(ctx.measureText(token).width>width){const pieces=wrap(ctx,token,width);line+=pieces.shift();while(pieces.length){lines.push(line);line=pieces.shift()}}
   else line+=token;
  }lines.push(line.trimEnd());
 }return lines;
}
function tableLayout(r,ctx,config){
 const width=(W-2*M)*(config.showMeaning?.6:1),inner=width-48;
 const lineHeight=(config.han||config.zh)?142:80,lines=[];let line=[],used=0;
 if(r.atoms?.length){
  for(const a of r.atoms){
   font(ctx,config.han||config.zh?30:48,true);
   const base=Math.max(config.han?72:config.zh?66:0,config.py?ctx.measureText(a.pinyin||'').width+8:0);
   const annotation=config.han&&config.zh&&a.zhuyin?52:0,unit={a,base,annotation,width:base+annotation};
   if(line.length&&used+12+unit.width>inner){lines.push(line);line=[];used=0}
   line.push(unit);used+=(line.length>1?12:0)+unit.width;
  }
  if(line.length)lines.push(line);
 }else{
  font(ctx,42);const values=config.columns.filter(c=>c.key!=='meaning').map(c=>r[c.key]||'—');
  for(const value of values)for(const text of wrapTableText(ctx,value,inner))lines.push(text);
 }
 font(ctx,42);const meaning=config.showMeaning?wrapTableText(ctx,r.meaning||'—',(W-2*M)-width-48):[];
 return {lines,meaning,lineHeight:r.atoms?.length?lineHeight:56,width};
}
function plan(records,ctx,config=presentation()){
 checkHeader(ctx,config);
 const pages=[];for(let i=0;i<records.length;i+=16)pages.push({type:'cards',records:records.slice(i,i+16).map((r,j)=>({...r,ordinal:i+j+1})),presentation:config});
 let page={type:'table',rows:[],presentation:config},used=0;const maxHeight=BOTTOM-TOP-80;
 for(const r of records){
  const layout=tableLayout(r,ctx,config),height=Math.max(105,layout.lines.length*layout.lineHeight+32,layout.meaning.length*56+32);
  if(used&&used+height>maxHeight){pages.push(page);page={type:'table',rows:[],presentation:config};used=0}
  // Normally an entire vocabulary row stays together. Exceptional oversized input continues safely.
  let wi=0,mi=0;while(wi<layout.lines.length||mi<layout.meaning.length){
   const room=maxHeight-used,wTake=Math.min(layout.lines.length-wi,Math.floor((room-32)/layout.lineHeight)),mTake=Math.min(layout.meaning.length-mi,Math.floor((room-32)/56));
   if((wi<layout.lines.length&&wTake<1)||(mi<layout.meaning.length&&mTake<1)){pages.push(page);page={type:'table',rows:[],presentation:config};used=0;continue}
   const words=layout.lines.slice(wi,wi+wTake),meanings=layout.meaning.slice(mi,mi+mTake);
   const rowHeight=Math.max(105,words.length*layout.lineHeight+32,meanings.length*56+32);
   page.rows.push({record:r,layout:{...layout,lines:words,meaning:meanings},height:rowHeight,continued:wi>0||mi>0});used+=rowHeight;wi+=wTake;mi+=mTake;
   if(wi<layout.lines.length||mi<layout.meaning.length){pages.push(page);page={type:'table',rows:[],presentation:config};used=0}
  }
 }
 if(page.rows.length)pages.push(page);return pages;
}
function drawTableWord(ctx,layout,x,y,config){
 ctx.fillStyle='#233f39';ctx.textBaseline='middle';
 layout.lines.forEach((line,row)=>{
  const top=y+16+row*layout.lineHeight;
  if(typeof line==='string'){font(ctx,42);ctx.textAlign='left';ctx.fillText(line,x+24,top+28);return}
  let left=x+24;for(const u of line){const a=u.a,cy=top+54;ctx.textAlign='center';
   if(config.han){font(ctx,72,true);ctx.fillText(a.char,left+u.base/2,cy)}
   if(config.py){font(ctx,config.han||config.zh?30:48,true);ctx.fillText(a.pinyin||'',left+u.base/2,config.han||config.zh?top+112:top+40)}
   if(config.zh&&a.zhuyin)drawZhuyin(ctx,a,config.han?left+u.base+16:left+u.base/2,cy,28);
   left+=u.width+12;
  }
 });
}
function drawTable(ctx,spec,config){
 let y=TOP;const columns=tableColumns(config),widths=config.showMeaning?[(W-2*M)*.6,(W-2*M)*.4]:[W-2*M];
 ctx.fillStyle='#e3eee5';ctx.fillRect(M,y,W-2*M,80);font(ctx,43,true);ctx.fillStyle='#233f39';ctx.textAlign='left';ctx.textBaseline='middle';let x=M;columns.forEach((c,i)=>{ctx.fillText(c.label,x+24,y+40);x+=widths[i]});ctx.strokeStyle='#d6dfd4';ctx.strokeRect(M,y,W-2*M,80);if(config.showMeaning){ctx.beginPath();ctx.moveTo(M+widths[0],y);ctx.lineTo(M+widths[0],y+80);ctx.stroke()}y+=80;
 for(const row of spec.rows){ctx.fillStyle='#ffffff';ctx.fillRect(M,y,W-2*M,row.height);ctx.strokeStyle='#d6dfd4';ctx.strokeRect(M,y,W-2*M,row.height);drawTableWord(ctx,row.layout,M,y,config);
  if(row.continued&&!row.layout.lines.length){font(ctx,30);ctx.fillStyle='#66756c';ctx.textAlign='left';ctx.fillText('（續）',M+24,y+40)}
  if(config.showMeaning){font(ctx,42);ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#233f39';row.layout.meaning.forEach((text,i)=>ctx.fillText(text,M+widths[0]+24,y+18+i*56));ctx.beginPath();ctx.moveTo(M+widths[0],y);ctx.lineTo(M+widths[0],y+row.height);ctx.stroke()}y+=row.height;
 }
}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
function drawWord(ctx,r,box,config){if(!r.atoms){const values=config.columns.filter(c=>c.key!=='meaning').map(c=>r[c.key]||'—');ctx.fillStyle='#233f39';ctx.textAlign='center';ctx.textBaseline='middle';values.forEach((value,i)=>{font(ctx,Math.min(110,box.w/Math.max(Array.from(value).length*.65,1)),true);ctx.fillText(value,box.x+box.w/2,box.y+box.h*(i+1)/(values.length+1),box.w)});return}const n=r.atoms.length,columns=Math.min(n,4),rows=Math.ceil(n/columns),rowRatio=config.py&&(config.han||config.zh)?1.9:1.45;let size=Math.min(170,Math.floor(box.w/(columns*(config.zh&&config.han?1.72:1.3))),Math.floor(box.h/(rows*rowRatio)));size=Math.max(16,size);let lines;function getLines(){const result=[];for(let i=0;i<n;i+=columns){const atoms=r.atoms.slice(i,i+columns);font(ctx,size*((config.han||config.zh)? .42 : .65),true);const units=atoms.map(a=>({a,base:Math.max(config.han?size:config.zh?size*.85:0,config.py?ctx.measureText(a.pinyin||'').width+8:0),annotation:config.zh&&config.han&&a.zhuyin?size*.64:0}));result.push(units)}return result}lines=getLines();for(let tries=0;tries<15&&Math.max(...lines.map(line=>line.reduce((sum,u)=>sum+u.base+u.annotation,0)+(line.length-1)*size*.12))>box.w;tries++){size*=.94;lines=getLines()}const rowH=size*rowRatio,top=box.y+(box.h-rowH*rows)/2;ctx.textBaseline='middle';for(let row=0;row<lines.length;row++){const units=lines[row],width=units.reduce((sum,u)=>sum+u.base+u.annotation,0)+(units.length-1)*size*.12;let x=box.x+(box.w-width)/2;const cy=top+row*rowH+size*.73;for(const u of units){const a=u.a;ctx.textAlign='center';ctx.fillStyle='#233f39';if(config.han){font(ctx,size,true);ctx.fillText(a.char,x+u.base/2,cy)}if(config.py){font(ctx,size*((config.han||config.zh)? .42 : .65),true);ctx.fillText(a.pinyin||'',x+u.base/2,cy+(config.han||config.zh?size*.77:0))}if(config.zh&&a.zhuyin)drawZhuyin(ctx,a,config.han?x+u.base+size*.18:x+u.base/2,cy,size*.32);x+=u.base+u.annotation+size*.12}}}
function ordinalLabel(n){const digits='零一二三四五六七八九';if(n>9999)return '第'+n+'個詞彙';let text='',zero=false;for(const [unit,name]of [[1000,'千'],[100,'百'],[10,'十'],[1,'']]){const d=Math.floor(n/unit)%10;if(d){if(zero)text+='零';text+=(unit===10&&d===1&&!text?'':digits[d])+name;zero=false;}else if(text&&n%unit)zero=true;}return '第'+text+'個詞彙';}
function render(spec,canvas,index,total){canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d'),config=spec.presentation||presentation(),colWidth=(W-2*M)/config.columns.length;ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,W,H);ctx.fillStyle='#27594c';ctx.textAlign='left';ctx.textBaseline='top';const header=checkHeader(ctx,config);font(ctx,44,true);ctx.fillText(header[0],M,70);font(ctx,30);ctx.fillStyle='#66756c';ctx.fillText(header[1],M,135);ctx.strokeStyle='#dce2d8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,190);ctx.lineTo(W-M,190);ctx.stroke();if(spec.type==='cards'){const cw=(W-2*M-3*GAP)/4,ch=(BOTTOM-TOP-3*GAP)/4;spec.records.forEach((r,i)=>{const x=M+(i%4)*(cw+GAP),y=TOP+Math.floor(i/4)*(ch+GAP);rounded(ctx,x,y,cw,ch,28);ctx.fillStyle='#ffffff';ctx.fill();ctx.strokeStyle='#d6dfd4';ctx.lineWidth=3;ctx.stroke();font(ctx,28);ctx.fillStyle='#66756c';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(ordinalLabel(r.ordinal||i+1),x+25,y+25);font(ctx,34);let meaningLines=wrap(ctx,config.showMeaning?r.meaning||'':'',cw-54);let meaningSize=34;if(meaningLines.length>5){meaningSize=26;font(ctx,meaningSize);meaningLines=wrap(ctx,config.showMeaning?r.meaning||'':'',cw-54)}const mh=config.showMeaning&&r.meaning?meaningLines.length*meaningSize*1.3:0;const wordTop=y+92,wordHeight=ch-126-mh;drawWord(ctx,r,{x:x+25,y:wordTop,w:cw-50,h:wordHeight},config);if(config.showMeaning&&r.meaning){font(ctx,meaningSize);ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#66756c';meaningLines.forEach((line,j)=>ctx.fillText(line,x+cw/2,y+ch-25-mh+j*meaningSize*1.3))}})}else{drawTable(ctx,spec,config)}ctx.fillStyle='#66756c';font(ctx,26);ctx.textBaseline='bottom';ctx.textAlign='left';ctx.fillText('© Teacher Evelyn · IMI Mandarin',M,H-60);ctx.textAlign='right';ctx.fillText((index+1)+' / '+total,W-M,H-60);return canvas}
async function build(records,env={}){if(!records.length)throw Error('請先貼上有效的詞彙資料。');const make=env.createCanvas||(()=>document.createElement('canvas'));const canvas=make(),ctx=canvas.getContext('2d'),pages=plan(records,ctx,env.presentation||presentation()).filter(p=>!env.type||p.type===env.type);const lib=env.PDFLib||global.PDFLib;if(!lib)throw Error('PDF 功能尚未載入，請重新整理後再試。');const pdf=await lib.PDFDocument.create();pdf.setTitle('IMI Vocabulary Cards and Table');pdf.setAuthor('Teacher Evelyn · IMI Mandarin');for(let i=0;i<pages.length;i++){render(pages[i],canvas,i,pages.length);const data=canvas.toDataURL('image/jpeg',.98),img=await pdf.embedJpg(data);const page=pdf.addPage([595.276,841.89]);page.drawImage(img,{x:0,y:0,width:595.276,height:841.89});if(env.onProgress)env.onProgress(i+1,pages.length);if(env.yieldPage)await env.yieldPage()}canvas.width=1;canvas.height=1;return {bytes:await pdf.save(),pages:pages.length}}
global.IMIVocabExport={presentation,headerLines,checkHeader,tableColumns,plan,render,build,width:W,height:H};
})(typeof window!=='undefined'?window:globalThis);
