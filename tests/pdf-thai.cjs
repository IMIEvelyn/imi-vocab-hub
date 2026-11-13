'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={Intl,setTimeout,clearTimeout};context.window=context;vm.createContext(context);
for(const file of ['pdf-font-coverage.js','teacher-pdf.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const api=context.IMIVocabExport;
const records=[{word:'老師',meaning:'แม่ ครู ผู้สอน สวัสดี ขอบคุณ เก้า น้ำ เรียนภาษาไทย',atoms:[{char:'老',pinyin:'lǎo',zhuyin:'ㄌㄠ',tone:3,mark:'ˇ'},{char:'師',pinyin:'shī',zhuyin:'ㄕ',tone:1,mark:''}]}];
const config={...api.presentation('combined',true),chineseFont:'traditional',title:'泰文測試',header:{className:'ห้องเรียน แม่',language:'泰文',date:'2026-11-13'}};
assert.doesNotThrow(()=>api.validateGlyphs(records,config));
assert.doesNotThrow(()=>api.validateGlyphs(records,{...config,chineseFont:'simplified'}));
assert.ok(api.family(config).includes('IMIPDFThai'));
assert.throws(()=>api.validateGlyphs([{...records[0],meaning:'😀'}],config),/U\+1F600/);
// A stale/missing coverage file must still reject Thai rather than silently exporting tofu.
const thai=context.IMIPDFFontCoverage.thai;delete context.IMIPDFFontCoverage.thai;
assert.throws(()=>api.validateGlyphs(records,config),/U\+E2B|U\+E41/);context.IMIPDFFontCoverage.thai=thai;
const loads=[];context.document={fonts:{load:async spec=>{loads.push(spec);return [{}];}}};
(async()=>{
 await api.loadFonts(config);await api.loadFonts(config);
 assert.equal(loads.filter(s=>s.includes('IMIPDFThai')).length,1);
 const failed={Intl,setTimeout,clearTimeout,document:{fonts:{load:async spec=>{if(spec.includes('IMIPDFThai'))throw Error('network');return [{}];}}}};failed.window=failed;vm.createContext(failed);vm.runInContext(fs.readFileSync('teacher-pdf.js','utf8'),failed);
 await assert.rejects(failed.IMIVocabExport.loadFonts(config),/Noto Serif Thai載入失敗/);
 console.log('Thai glyph validation, both Chinese fonts, unsupported-glyph protection, font loading/cache and failed-font handling passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
