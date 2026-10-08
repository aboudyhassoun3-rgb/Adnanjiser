/* AJ Class A — core: utils, daily content, local database + seed */
var AJ = window.AJ || (window.AJ = {});
(function(){
'use strict';
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
AJ.$ = $; AJ.$$ = $$;

AJ.esc = function(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
};
AJ.uid = function(p){
  try { if (window.crypto && crypto.randomUUID) return (p||'id') + '-' + crypto.randomUUID().slice(0,8); } catch(e){}
  return (p||'id') + '-' + Date.now().toString(36) + Math.floor(Math.random()*1e6).toString(36);
};
AJ.now = function(){ return Date.now(); };

/* ---------- time ---------- */
function pad(n){ return (n<10?'0':'')+n; }
AJ.fmtTime = function(ts){ var d=new Date(ts); return pad(d.getHours())+':'+pad(d.getMinutes()); };
AJ.fmtDate = function(ts){ try{ return new Date(ts).toLocaleDateString('ar-DZ',{weekday:'long',day:'numeric',month:'long'});}catch(e){ return new Date(ts).toLocaleDateString(); } };
AJ.fmtDT = function(ts){ return AJ.fmtDate(ts)+' • '+AJ.fmtTime(ts); };
AJ.dayKey = function(ts){ var d=new Date(ts||Date.now()); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
AJ.timeAgo = function(ts){
  var m = Math.floor((Date.now()-ts)/60000);
  if (m < 1) return 'الآن';
  if (m < 60) return 'منذ '+m+' د';
  var h = Math.floor(m/60);
  if (h < 24) return 'منذ '+h+' س';
  var d = Math.floor(h/24);
  if (d === 1) return 'أمس';
  return 'منذ '+d+' أيام';
};
AJ.countdown = function(to){
  var d = to - Date.now();
  if (d <= 0) return 'انتهى الوقت';
  var h = Math.floor(d/3600000), m = Math.floor(d%3600000/60000);
  if (h > 48) return 'متبقي '+Math.floor(h/24)+' أيام';
  if (h > 0) return 'متبقي '+h+' س و '+m+' د';
  return 'متبقي '+m+' دقيقة';
};
AJ.slotLabel = function(min){ return pad(Math.floor(min/60))+':'+pad(min%60); };

/* ---------- daily verse / hadith (rotates by date, source preserved) ---------- */
var VERSES = [
  {t:'﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾', s:'سورة طه — الآية 114'},
  {t:'﴿يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ﴾', s:'سورة المجادلة — الآية 11'},
  {t:'﴿وَمَا أُوتِيتُم مِّنَ الْعِلْمِ إِلَّا قَلِيلًا﴾', s:'سورة الإسراء — الآية 85'},
  {t:'﴿هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ﴾', s:'سورة الزمر — الآية 9'}
];
var HADITHS = [
  {t:'«طلبُ العلمِ فريضةٌ على كلِّ مسلمٍ»', s:'سنن ابن ماجه (224)'},
  {t:'«من سلك طريقًا يلتمس فيه علمًا سهَّل الله له به طريقًا إلى الجنة»', s:'صحيح مسلم (2699)'},
  {t:'«إن الملائكة لتضع أجنحتها رضًا لطالب العلم»', s:'سنن أبي داود (3641)'}
];
AJ.dailyContent = function(){
  var key = AJ.dayKey(), h = 0;
  for (var i=0;i<key.length;i++) h = (h*31 + key.charCodeAt(i)) >>> 0;
  if (h % 2 === 0){ var v = VERSES[h % VERSES.length]; return {kind:'verse', label:'آية اليوم', text:v.t, source:v.s}; }
  var x = HADITHS[h % HADITHS.length]; return {kind:'hadith', label:'حديث اليوم', text:x.t, source:x.s};
};

/* ---------- toast + modal ---------- */
AJ.toast = function(msg){
  var root = $('#toast-root'); if(!root) return;
  var el = document.createElement('div'); el.className='toast'; el.textContent = msg;
  root.appendChild(el); setTimeout(function(){ el.remove(); }, 2600);
};
AJ.openModal = function(html){
  var root = $('#modal-root');
  root.innerHTML = '<div class="mback" id="mback"><div class="mbox">'+html+'</div></div>';
  $('#mback').addEventListener('click', function(e){ if(e.target.id==='mback') AJ.closeModal(); });
};
AJ.closeModal = function(){ $('#modal-root').innerHTML=''; };

/* ---------- prefs (theme, AI endpoint — key only via settings, never hardcoded) ---------- */
var PREFS_KEY='ajprefs_v1';
AJ.prefs = function(){
  try { return Object.assign({theme:'dark', aiMemory:true, browserNotify:false},
    JSON.parse(localStorage.getItem(PREFS_KEY)||'{}')); }
  catch(e){ return {theme:'dark', aiMemory:true, browserNotify:false}; }
};
AJ.savePrefs = function(p){ localStorage.setItem(PREFS_KEY, JSON.stringify(p)); };
AJ.applyTheme = function(){
  var t = AJ.prefs().theme || 'dark';
  if (t === 'system') t = (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  var m = document.querySelector('meta[name="theme-color"]'); if(m) m.content = t==='light' ? '#F5F6F7' : '#0E0F12';
};

/* ---------- database ---------- */
var DB_KEY='ajdb_v1';
function seed(){
  var T = Date.now(), D = 86400000;
  var users = [
    {id:'u-owner', name:'مالك المنصة', username:'owner', email:'aboudyhassoun3@gmail.com', pass:'AjOwner123', role:'OWNER', active:true, banned:false, permissions:{}, photo:'', mustChangePassword:false, online:false, lastSeen:0, section:'A', showOnline:true, showLastSeen:true, showRead:true, createdAt:T},
    {id:'u-admin', name:'إدارة الشعبة', username:'admin', email:'admin@ajclassa.example', pass:'Admin123', role:'ADMIN', active:true, banned:false, permissions:{}, photo:'', mustChangePassword:false, online:false, lastSeen:0, section:'A', showOnline:true, showLastSeen:true, showRead:true, createdAt:T},
    {id:'u-teacher', name:'أ. سمير بلقاسم', username:'teacher', email:'teacher@ajclassa.example', pass:'Teacher123', role:'TEACHER', active:true, banned:false, permissions:{}, photo:'', mustChangePassword:false, online:false, lastSeen:0, section:'A', showOnline:true, showLastSeen:true, showRead:true, createdAt:T},
    {id:'u-s1', name:'محمد بن أحمد', username:'mohamed', email:'mohamed@ajclassa.example', pass:'Student123', role:'STUDENT', active:true, banned:false, permissions:{}, photo:'', mustChangePassword:false, online:false, lastSeen:0, section:'A', showOnline:true, showLastSeen:true, showRead:true, createdAt:T},
    {id:'u-s2', name:'أمينة زروقي', username:'amina', email:'amina@ajclassa.example', pass:'Student123', role:'STUDENT', active:true, banned:false, permissions:{}, photo:'', mustChangePassword:false, online:false, lastSeen:0, section:'A', showOnline:true, showLastSeen:true, showRead:true, createdAt:T}
  ];
  var subjects = [
    {id:'sub-math', name:'Mathematics', nameAr:'رياضيات', icon:'📐', teacher:'أ. سمير بلقاسم', order:1},
    {id:'sub-phys', name:'Physics', nameAr:'فيزياء', icon:'⚛️', teacher:'أ. ليلى مرابط', order:2},
    {id:'sub-sci', name:'Science', nameAr:'علوم طبيعية', icon:'🧬', teacher:'أ. كريم حداد', order:3},
    {id:'sub-ar', name:'Arabic', nameAr:'لغة عربية', icon:'📖', teacher:'أ. فاطمة الزهراء', order:4},
    {id:'sub-en', name:'English', nameAr:'لغة إنجليزية', icon:'🔤', teacher:'Ms. Sarah', order:5},
    {id:'sub-fr', name:'French', nameAr:'لغة فرنسية', icon:'🇫🇷', teacher:'Mme. Claire', order:6},
    {id:'sub-hg', name:'History & Geography', nameAr:'تاريخ وجغرافيا', icon:'🗺️', teacher:'أ. يوسف عمراني', order:7},
    {id:'sub-info', name:'Informatics', nameAr:'إعلام آلي', icon:'💻', teacher:'أ. رياض بوعلام', order:8}
  ];
  var lessons = [
    {id:'l-m1', subjectId:'sub-math', title:'الدوال الخطية', order:1, createdAt:T,
     desc:'تعريف الدالة الخطية وتمثيلها البياني.',
     body:'الدالة الخطية هي دالة تكتب على الشكل: f(x) = ax + b حيث a و b عددان حقيقيان.\n\n• العدد a يسمى المعامل الموجَّه (الميل): إذا كان موجبًا فالدالة متزايدة، وإذا كان سالبًا فمتناقصة.\n• العدد b هو الترتيب عند المبدأ: نقطة تقاطع المستقيم مع محور التراتيب (0,b).\n\nمثال: f(x) = 2x + 1 — دالة متزايدة لأن 2 > 0، وتقطع محور التراتيب في النقطة (0,1).\n\nلرسمها نكفي بنقطتين: x=0 تعطي y=1، و x=1 تعطي y=3، ثم نصل بينهما بخط مستقيم.'},
    {id:'l-m2', subjectId:'sub-math', title:'حل معادلة من الدرجة الأولى', order:2, createdAt:T,
     desc:'خطوات حل ax + b = 0.',
     body:'لحل معادلة من الشكل ax + b = 0 (حيث a ≠ 0):\n\n1. ننقل b إلى الطرف الثاني بتغيير إشارته: ax = -b.\n2. نقسم الطرفين على a: x = -b/a.\n\nمثال: 3x - 9 = 0 ← 3x = 9 ← x = 3.\n\nتحقق دائمًا بالتعويض: 3×3 - 9 = 0 ✓'},
    {id:'l-p1', subjectId:'sub-phys', title:'الحركة المستقيمة المنتظمة', order:1, createdAt:T,
     desc:'السرعة والمسافة والزمن.',
     body:'يكون الجسم في حركة مستقيمة منتظمة إذا قطع مسافات متساوية في أزمنة متساوية.\n\nالقانون: v = d / t (السرعة = المسافة ÷ الزمن).\n\nمثال: سيارة تقطع 120km في ساعتين ← v = 120/2 = 60km/h.\n\n• المعطيات: d = 120km، t = 2h.\n• القانون: v = d/t.\n• التعويض: v = 120/2.\n• النتيجة: v = 60km/h.'},
    {id:'l-p2', subjectId:'sub-phys', title:'مفهوم القوة', order:2, createdAt:T,
     desc:'تعريف القوة ووحدتها.',
     body:'القوة سبب يغيّر حالة الجسم (سكون/حركة) أو شكله.\n\n• تقاس بالنيوتن (N).\n• تمثل بشعاع: له مبدأ واتجاه وشدة.\n• أمثلة: قوة الثقل، قوة الاحتكاك، القوة العضلية.'},
    {id:'l-s1', subjectId:'sub-sci', title:'الخلية وحدة بناء الكائن الحي', order:1, createdAt:T,
     desc:'مكونات الخلية.',
     body:'الخلية هي أصغر وحدة بنائية ووظيفية في الكائن الحي.\n\nمكوناتها الأساسية:\n• الغشاء السيتوبلاسمي: يحيط بالخلية وينظم المبادلات.\n• السيتوبلاسم: وسط التفاعلات الحيوية.\n• النواة: مركز القيادة وتحتوي على المادة الوراثية.'},
    {id:'l-a1', subjectId:'sub-ar', title:'التمييز', order:1, createdAt:T,
     desc:'قاعدة التمييز وإعرابه.',
     body:'التمييز اسم نكرة يزيل الإبهام عن الجملة.\n\nمثال: «اشتريت عشرين كتابًا» — كلمة (كتابًا) تمييز منصوب.\n\n• يكون غالبًا بعد الأعداد والأوزان والمقادير.\n• إعرابه: تمييز منصوب وعلامة نصبه الفتحة.'},
    {id:'l-e1', subjectId:'sub-en', title:'Present Simple', order:1, createdAt:T,
     desc:'زمن المضارع البسيط.',
     body:'We use the Present Simple for habits and facts.\n\n• I/You/We/They + verb: "I play football."\n• He/She/It + verb-s: "She plays tennis."\n\nSignal words: always, usually, every day.'},
    {id:'l-f1', subjectId:'sub-fr', title:'Le présent de l’indicatif', order:1, createdAt:T,
     desc:'تصريف الحاضر.',
     body:'Au présent, les verbes du 1er groupe prennent: -e, -es, -e, -ons, -ez, -ent.\n\nExemple — parler: je parle, tu parles, il parle, nous parlons, vous parlez, ils parlent.'},
    {id:'l-h1', subjectId:'sub-hg', title:'الحضارة الرومانية في الجزائر', order:1, createdAt:T,
     desc:'أهم المدن الأثرية.',
     body:'تركت الحضارة الرومانية آثارًا مهمة في الجزائر:\n\n• جميلة (سطيف): من أجمل المدن الأثرية.\n• تيمقاد (باتنة): تسمى بومبي إفريقيا.\n• تيبازة: مدينة ساحلية عريقة.\n\nسجلت هذه المواقع في التراث العالمي لليونسكو.'},
    {id:'l-i1', subjectId:'sub-info', title:'مكونات الحاسوب', order:1, createdAt:T,
     desc:'عتاد وبرمجيات.',
     body:'يتكون الحاسوب من:\n\n• العتاد (Hardware): المعالج، الذاكرة RAM، القرص، الشاشة، لوحة المفاتيح.\n• البرمجيات (Software): نظام التشغيل (Windows/Linux) والتطبيقات.\n\nوحدة قياس الذاكرة: البايت (Byte) ومضاعفاته KB, MB, GB.'}
  ];
  var schedule = [
    {id:'sc-mo1', day:'mon', startMin:480, endMin:570, subjectId:'sub-math', subjectName:'رياضيات', teacher:'أ. سمير بلقاسم', room:'ق 3'},
    {id:'sc-mo2', day:'mon', startMin:580, endMin:670, subjectId:'sub-phys', subjectName:'فيزياء', teacher:'أ. ليلى مرابط', room:'ق 3'},
    {id:'sc-mo3', day:'mon', startMin:780, endMin:870, subjectId:'sub-ar', subjectName:'لغة عربية', teacher:'أ. فاطمة الزهراء', room:'ق 3'},
    {id:'sc-tu1', day:'tue', startMin:480, endMin:570, subjectId:'sub-sci', subjectName:'علوم طبيعية', teacher:'أ. كريم حداد', room:'مخبر 1'},
    {id:'sc-tu2', day:'tue', startMin:580, endMin:670, subjectId:'sub-math', subjectName:'رياضيات', teacher:'أ. سمير بلقاسم', room:'ق 3'},
    {id:'sc-tu3', day:'tue', startMin:780, endMin:870, subjectId:'sub-en', subjectName:'لغة إنجليزية', teacher:'Ms. Sarah', room:'ق 3'},
    {id:'sc-we1', day:'wed', startMin:480, endMin:570, subjectId:'sub-fr', subjectName:'لغة فرنسية', teacher:'Mme. Claire', room:'ق 3'},
    {id:'sc-we2', day:'wed', startMin:580, endMin:670, subjectId:'sub-hg', subjectName:'تاريخ وجغرافيا', teacher:'أ. يوسف عمراني', room:'ق 3'},
    {id:'sc-th1', day:'thu', startMin:480, endMin:570, subjectId:'sub-math', subjectName:'رياضيات', teacher:'أ. سمير بلقاسم', room:'ق 3'},
    {id:'sc-th2', day:'thu', startMin:580, endMin:670, subjectId:'sub-info', subjectName:'إعلام آلي', teacher:'أ. رياض بوعلام', room:'ق إعلام'},
    {id:'sc-fr1', day:'fri', startMin:480, endMin:570, subjectId:'sub-phys', subjectName:'فيزياء', teacher:'أ. ليلى مرابط', room:'مخبر 1'},
    {id:'sc-fr2', day:'fri', startMin:580, endMin:670, subjectId:'sub-ar', subjectName:'لغة عربية', teacher:'أ. فاطمة الزهراء', room:'ق 3'}
  ];
  var homework = [
    {id:'hw-1', title:'تمارين الدوال الخطية ص 42', subjectId:'sub-math', subjectName:'رياضيات', description:'حل التمارين 5، 6، 7 صفحة 42 مع رسم المستقيمات على ورقة مليمترية.', attachments:[], dueAt:T+2*D, allowLate:true, status:'open', createdBy:'u-teacher', createdAt:T-D},
    {id:'hw-2', title:'تقرير تجربة الحركة', subjectId:'sub-phys', subjectName:'فيزياء', description:'اكتب تقريرًا قصيرًا عن تجربة قياس السرعة مع جدول النتائج.', attachments:[], dueAt:T+4*D, allowLate:false, status:'open', createdBy:'u-teacher', createdAt:T-D},
    {id:'hw-3', title:'حفظ 10 كلمات إنجليزية', subjectId:'sub-en', subjectName:'لغة إنجليزية', description:'احفظ الكلمات العشر من الوحدة 3 واستعمل كل واحدة في جملة.', attachments:[], dueAt:T+1*D, allowLate:true, status:'open', createdBy:'u-teacher', createdAt:T-D}
  ];
  var exams = [
    {id:'ex-1', title:'اختبار رياضيات — الدوال', subjectId:'sub-math', subjectName:'رياضيات', description:'اختبار قصير في الدوال الخطية والمعادلات.', durationMin:20, startsAt:T-D, endsAt:T+5*D, createdBy:'u-teacher', createdAt:T-D,
     questions:[
      {id:'q1', type:'mcq', difficulty:'easy', points:2, question:'ما ميل الدالة f(x) = 3x - 2 ؟', options:['3','-2','2','0'], correct:[0], explanation:'الميل هو معامل x أي 3.'},
      {id:'q2', type:'tf', difficulty:'easy', points:2, question:'الدالة f(x) = -x + 5 متناقصة.', options:['صح','خطأ'], correct:[0], explanation:'المعامل سالب (-1) إذن متناقصة.'},
      {id:'q3', type:'mcq', difficulty:'medium', points:3, question:'حل المعادلة: 2x + 6 = 0', options:['x = 3','x = -3','x = 6','x = -6'], correct:[1], explanation:'2x = -6 ← x = -3.'},
      {id:'q4', type:'short', difficulty:'medium', points:3, question:'ما الترتيب عند المبدأ للدالة f(x) = 4x + 7 ؟', correctText:'7', explanation:'b = 7.'},
      {id:'q5', type:'mcq', difficulty:'hard', points:4, question:'المستقيمان y=2x+1 و y=2x-3 هما:', options:['متقاطعان','متوازيان','متطابقان','متعامدان'], correct:[1], explanation:'نفس الميل (2) وترتيبان مختلفان ← متوازيان.'}
     ]}
  ];
  var qbank = [
    {id:'qb1', subjectId:'sub-math', difficulty:'easy', type:'mcq', question:'ما قيمة f(2) إذا كان f(x) = 5x ؟', options:['7','10','3','12'], correct:[1], explanation:'5×2=10.'},
    {id:'qb2', subjectId:'sub-math', difficulty:'medium', question:'حل: 5x - 15 = 0', type:'mcq', options:['3','-3','5','15'], correct:[0], explanation:'x=3.'},
    {id:'qb3', subjectId:'sub-phys', difficulty:'easy', type:'mcq', question:'وحدة قياس القوة هي:', options:['الجول','النيوتن','الواط','المتر'], correct:[1], explanation:'النيوتن (N).'},
    {id:'qb4', subjectId:'sub-phys', difficulty:'medium', type:'mcq', question:'سيارة تقطع 180km في 3 ساعات، سرعتها:', options:['90km/h','60km/h','45km/h','30km/h'], correct:[1], explanation:'180÷3=60.'},
    {id:'qb5', subjectId:'sub-ar', difficulty:'easy', type:'mcq', question:'«اشتريت عشرين ___» الكلمة المناسبة تمييزًا:', options:['كتابٌ','كتابًا','كتابٍ','الكتاب'], correct:[1], explanation:'التمييز منصوب.'},
    {id:'qb6', subjectId:'sub-en', difficulty:'easy', type:'mcq', question:'She ___ to school every day.', options:['go','goes','going','gone'], correct:[1], explanation:'He/She/It + s.'}
  ];
  var announcements = [
    {id:'an-1', title:'رزنامة اختبارات الفصل الأول', body:'تنطلق اختبارات الفصل الأول الأسبوع القادم. راجعوا دروس الرياضيات والفيزياء، وبالتوفيق للجميع.', pinned:true, target:'all', createdBy:'u-admin', createdAt:T-2*3600000},
    {id:'an-2', title:'حصة دعم في الرياضيات', body:'حصة دعم مجانية في الدوال الخطية يوم الأربعاء على 14:00 بقاعة 3.', pinned:false, target:'all', createdBy:'u-teacher', createdAt:T-5*3600000}
  ];
  var library = [
    {id:'lb-1', subjectId:'sub-math', subjectName:'رياضيات', title:'ملخص الدوال الخطية', kind:'lesson', refId:'l-m1', term:'الفصل 1', createdAt:T},
    {id:'lb-2', subjectId:'sub-phys', subjectName:'فيزياء', title:'ملخص الحركة المنتظمة', kind:'lesson', refId:'l-p1', term:'الفصل 1', createdAt:T},
    {id:'lb-3', subjectId:'sub-info', subjectName:'إعلام آلي', title:'مكونات الحاسوب', kind:'lesson', refId:'l-i1', term:'الفصل 1', createdAt:T}
  ];
  var messages = [
    {id:'m-1', senderId:'u-admin', senderName:'إدارة الشعبة', text:'أهلًا بكم في مجتمع الشعبة A 🎉', type:'text', timestamp:T-7200000, deliveredTo:['u-s1'], readBy:['u-s1'], replyTo:null, attachments:[], reactions:{'👍':['u-s1']}, pinned:true, deleted:false, mentionAll:false},
    {id:'m-2', senderId:'u-s1', senderName:'محمد بن أحمد', text:'شكرًا! هل حصة الدعم تشمل الفيزياء أيضًا؟', type:'text', timestamp:T-3600000, deliveredTo:['u-admin'], readBy:[], replyTo:{id:'m-1', text:'أهلًا بكم في مجتمع الشعبة A 🎉'}, attachments:[], reactions:{}, pinned:false, deleted:false, mentionAll:false}
  ];
  return {v:1, users:users, subjects:subjects, lessons:lessons, homework:homework, submissions:[],
    exams:exams, results:[], qbank:qbank, announcements:announcements, schedule:schedule,
    messages:messages, aiChats:[], aiMsgs:{}, saved:[], notes:[
      {id:'n-1', userId:'u-s1', kind:'reminder', title:'مراجعة الفيزياء', description:'إعادة قراءة درس الحركة + حل مثالين', dateAt:T+D, remindAt:0, done:false, createdAt:T}
    ],
    notifications:[], library:library, audit:[
      {id:'a-1', actorId:'system', actorName:'النظام', action:'init_seed', target:'database', timestamp:T}
    ],
    settings:{appName:'AJ Class A', aiUrl:'', aiModel:'aj-tutor-1', aiMaxTokens:2048,
      systemPrompt:'أنت مدرّس مساعد لطلاب الصف الأول الثانوي (شعبة A). اشرح بدقة وبطريقة منظمة: المعطيات، القانون، التعويض، النتيجة. لا تخمّن أبدًا.'},
    streaks:{}};
}
var _db = null;
AJ.db = function(){
  if (_db) return _db;
  try {
    var raw = localStorage.getItem(DB_KEY);
    if (raw){ _db = JSON.parse(raw); if(_db.v===1) return _db; }
  } catch(e){}
  _db = seed();
  AJ.save();
  return _db;
};
AJ.save = function(){ try{ localStorage.setItem(DB_KEY, JSON.stringify(_db)); }catch(e){} };
AJ.resetAll = function(){ _db = seed(); AJ.save(); };
AJ.find = function(col, id){ var a = AJ.db()[col]||[]; for(var i=0;i<a.length;i++) if(a[i].id===id) return a[i]; return null; };

/* ---------- notifications + audit ---------- */
AJ.notifyUser = function(userId, n){
  var db = AJ.db();
  db.notifications.unshift(Object.assign({id:AJ.uid('nt'), userId:userId, read:false, createdAt:Date.now(),
    kind:'general', title:'', body:'', route:'', targetId:''}, n||{}));
  db.notifications = db.notifications.slice(0,300);
  AJ.save();
  AJ.updateBadge();
};
AJ.notifyAll = function(n){ AJ.db().users.forEach(function(u){ if(u.active && !u.banned) AJ.notifyUser(u.id, n); }); };
AJ.audit = function(action, target){
  var me = AJ.me(); var db = AJ.db();
  db.audit.unshift({id:AJ.uid('a'), actorId:me?me.id:'-', actorName:me?me.name:'-', action:action, target:target||'', timestamp:Date.now()});
  AJ.save();
};
AJ.updateBadge = function(){
  var me = AJ.me(); var n = 0;
  if (me) n = AJ.db().notifications.filter(function(x){ return x.userId===me.id && !x.read; }).length;
  AJ.$$('[data-badge]').forEach(function(el){ el.textContent = n>0?n:''; el.style.display = n>0?'flex':'none'; });
  var b = AJ.$('#ntf-badge'); if(b){ b.textContent = n>0?n:''; b.style.display = n>0?'flex':'none'; }
};
})();
