'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:null};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('vocab-data.js','utf8'),c);vm.runInContext(fs.readFileSync('teacher-language.js','utf8'),c);
const detect=(...meaning)=>c.IMITeacherLanguage.detect(meaning.map(meaning=>({meaning})));
for(const [text,label]of [
 ['selamat dan semoga kaya raya','印尼文'],['berlimpah di awal tahun','印尼文'],['เปิด หนังสือ พัดลม','泰文'],['課本を開く','日文'],['교과서 선생님','韓文'],['សៀវភៅ','柬埔寨文'],['học sinh và giáo viên','越南文'],['open the textbook','英文'],['just now','英文'],['bonjour ouvrir le livre','法文'],['abrir el libro','西班牙文'],['ang guro sa paaralan','菲律賓文'],['otevřít učebnice','捷克文']])assert.equal(detect(text),label,text);
assert.equal(detect(''), '');assert.equal(detect('123 / 🙂'), '');assert.equal(detect('中文課本'), '');assert.equal(detect('xyzabc'), '');assert.equal(detect('bonjour','hello'),'');
const html=fs.readFileSync('teacher.js','utf8');const scan=html.match(/function scan\(\)\{.*\}\n/)[0];
const elements={vocabInput:{value:''},inputLanguage:{value:'原選項'}};c.$=id=>elements[id];c.D=c.IMIVocabData;c.render=c.stale=c.schedulePDF=()=>{};
vm.runInContext('let words=[],lastLanguageImport="";'+scan,c);
const run=s=>vm.runInContext(s,c);
elements.vocabInput.value='W1,1,書,shū,ㄕㄨ,,selamat dan semoga kaya raya';run('scan()');assert.equal(elements.inputLanguage.value,'印尼文');
elements.inputLanguage.value='英文';run('scan()');assert.equal(elements.inputLanguage.value,'英文');
elements.vocabInput.value='W1,1,書,,ㄕㄨ,,selamat dan semoga kaya raya';run('scan()');assert.equal(elements.inputLanguage.value,'英文','phonetic corrections must not override manual language');
elements.vocabInput.value='W1,1,書,,,,เปิดหนังสือ';run('scan()');assert.equal(elements.inputLanguage.value,'泰文');
elements.inputLanguage.value='法文';run('scan()');assert.equal(elements.inputLanguage.value,'法文');run('lastLanguageImport="";scan()');assert.equal(elements.inputLanguage.value,'泰文','explicit reimport may preset again');
elements.vocabInput.value='W1,1,書,,,,xyzabc';run('scan()');assert.equal(elements.inputLanguage.value,'泰文','unknown must retain current option');
console.log('PASS 11 language suggestions, blank/unknown/tied translations, manual override, rescanning, annotation correction, new data and explicit reimport.');
