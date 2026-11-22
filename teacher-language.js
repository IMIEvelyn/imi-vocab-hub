/* Local suggestions from imported translations only; the teacher can always edit the label. */
(()=>{'use strict';
const lexicons={
 '英文':'hello goodbye thank thanks please sorry yes no open close textbook book text teacher student class school learn study speak talk know understand use ride bicycle motorcycle electric fan cooker air conditioner rice water drink eat cold hot fast slow before after today tomorrow yesterday now just originally country vietnam india awesome happy new year abundant wealth pencil kind how small big the a an to of for with from is are be and or not in on at this that these those my your his her our their just now open close textbook text originally teacher student learn study school book pencil pen friend hello goodbye thank you please sorry good bad big small hot cold fast slow before after today tomorrow yesterday morning night eat drink water rice food work home go come use know understand speak chat ride bicycle motorcycle air conditioner electric fan rice cooker India awesome happy',
 '印尼文':'dan atau yang di ke dari dengan untuk ini itu saya aku kamu anda dia kami kita mereka tidak bukan ada adalah sedang akan sudah belum juga sangat lebih kurang bisa boleh harus ingin mau makan minum air nasi buku guru murid siswa belajar sekolah kelas teman rumah pergi datang baik bagus besar kecil panas dingin cepat lambat sebelum sesudah sekarang hari besok kemarin pagi malam selamat terima kasih maaf tolong nama membuka menutup berbicara mengobrol tahu mengerti menggunakan naik sepeda motor kipas angin listrik memasak penanak beras kulkas pensil jenis bagaimana berlimpah awal tahun semoga kaya raya',
 '越南文':'và hoặc của là có không tôi bạn anh chị em chúng họ này đó một những các rất đang đã sẽ chưa cũng được phải muốn ăn uống nước cơm sách giáo viên học sinh trường lớp nhà đi đến tốt lớn nhỏ nóng lạnh nhanh chậm trước sau hôm nay ngày mai chào cảm ơn xin lỗi mở đóng nói biết hiểu dùng xe đạp máy điện quạt nồi bút tiếng',
 '法文':'le la les un une des du de et ou avec pour dans sur est sont être avoir je tu il elle nous vous ils elles ce cette ces mon ma mes votre bonjour merci salut ouvrir fermer livre manuel école professeur enseignant étudiant élève apprendre parler savoir comprendre manger boire eau riz maison grand petit chaud froid vite lent avant après aujourd’hui demain hier maintenant vélo moto ventilateur climatiseur crayon comment quel quelle très bien bon bonne',
 '西班牙文':'el la los las un una unos unas de del y o con para por en es son ser estar tener yo tú él ella nosotros ustedes ellos este esta mi tu su hola gracias adiós abrir cerrar libro escuela profesor profesora estudiante aprender hablar saber entender comer beber agua arroz casa grande pequeño caliente frío rápido lento antes después hoy mañana ayer ahora bicicleta motocicleta ventilador aire acondicionado lápiz cómo qué muy bien bueno buena',
 '菲律賓文':'ang mga ng sa at o ay ako ikaw siya kami tayo kayo sila ito iyan iyon hindi oo mayroon wala isang para mula kasama gusto kailangan kumain uminom tubig kanin aklat guro mag-aaral paaralan bahay kaibigan magandang umaga gabi salamat paumanhin pakiusap buksan isara malaki maliit mainit malamig mabilis mabagal bago pagkatapos ngayon bukas kahapon bisikleta bentilador lapis magsalita alam maintindihan uri paano',
 '捷克文':'a nebo ale je jsou být mít já ty on ona my vy oni ten tato toto můj vaše dobrý den ahoj děkuji prosím otevřít zavřít kniha učebnice škola učitel student učit mluvit vědět rozumět jíst pít voda rýže dům velký malý horký studený rychlý pomalý před po dnes zítra včera teď kolo motocykl ventilátor klimatizace tužka jak velmi'
};
const dictionaries=Object.entries(lexicons).map(([name,words])=>[name,new Set(words.split(' '))]);
function detect(words){
 const text=[...new Set(words.map(w=>String(w.meaning||'').trim()).filter(Boolean))].join(' ').normalize('NFC').toLowerCase();
 if(!text)return '';
 const scripts=[['日文',/[\p{Script=Hiragana}\p{Script=Katakana}]/gu],['韓文',/\p{Script=Hangul}/gu],['泰文',/\p{Script=Thai}/gu],['柬埔寨文',/\p{Script=Khmer}/gu]].map(([name,re])=>[name,(text.match(re)||[]).length]).sort((a,b)=>b[1]-a[1]);
 if(scripts[0][1]>0&&scripts[0][1]>scripts[1][1])return scripts[0][0];
 const tokens=new Set(text.match(/\p{Script=Latin}+(?:[-’']\p{Script=Latin}+)*/gu)||[]);
 const scores=dictionaries.map(([name,dict])=>[name,[...tokens].reduce((s,t)=>s+(dict.has(t)?1:0),0)]);
 const bonus=(name,re)=>{if(re.test(text))scores.find(x=>x[0]===name)[1]+=3;};
 bonus('越南文',/[ăơưđạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/u);
 bonus('捷克文',/[čěňřšťůž]/u);bonus('法文',/[œæçëïîûÿ]/u);bonus('西班牙文',/[ñ¿¡]/u);
 scores.sort((a,b)=>b[1]-a[1]);return scores[0][1]>0&&scores[0][1]>scores[1][1]?scores[0][0]:'';
}
window.IMITeacherLanguage=Object.freeze({detect});
})();
