/* AJ Class A — secondary views: notes, calendar, library, announcements, notifications, search, tools, daily, profile, settings */
(function(){
'use strict';
var DAYN = [6,0,1,2,3,4,5]; // JS Sun..Sat -> offset
var DOW_AR = ['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'];
var DAYKEY = {mon:0, tue:1, wed:2, thu:3, fri:4, sat:5, sun:6};

/* ---------- saved ---------- */
AJ.saveItem = function(kind, refId){
  var me = AJ.me();
  var title = refId, snippet = '';
  if(kind==='lesson'){ var l = AJ.find('lessons', refId); if(l){ title = l.title; snippet = (l.desc||'').slice(0,120); } }
  if(kind==='homework'){ var x = AJ.find('homework', refId); if(x){ title = x.title; snippet = x.description.slice(0,120); } }
  if(kind==='ai'){ var c = AJ.find('aiChats', refId); if(c){ title = c.title; snippet = 'محادثة AI'; } }
  AJ.db().saved.unshift({id:AJ.uid('sv'), userId:me.id, kind:kind, refId:refId, title:title, snippet:snippet, createdAt:Date.now()});
  AJ.save(); AJ.toast('تم الحفظ في ⭐ المحفوظات');
};
AJ.registerView('saved', function(view){
  AJ.require('accessApp');
  var me = AJ.me();
  var list = AJ.db().saved.filter(function(s){ return s.userId===me.id; });
  var h = '<h2 class="vt">⭐ المحفوظات</h2><div class="vsub">إجابات ودروس مهمة</div>';
  if(!list.length) h += AJ.stateEmpty('لا محفوظات بعد');
  list.forEach(function(s){
    var go = s.kind==='lesson' ? ("AJ.go('lesson','"+s.refId+"')") : (s.kind==='ai' ? ("AJ.go('aichat','"+s.refId+"')") : "AJ.go('homework')");
    h += '<div class="list-item" onclick="'+go+'"><div class="li-t">'+AJ.esc(s.title)+'</div><div class="li-s">'+AJ.esc(s.kind)+' • '+AJ.esc(s.snippet||'')+'</div></div>';
  });
  view.innerHTML = h;
});

/* ---------- notes ---------- */
AJ.registerView('notes', function(view){
  AJ.require('createNotes');
  var me = AJ.me();
  var list = AJ.db().notes.filter(function(n){ return n.userId===me.id; }).sort(function(a,b){ return (a.done-b.done) || ((a.dateAt||9e15)-(b.dateAt||9e15)); });
  var h = '<h2 class="vt">📝 المفكرة</h2><div class="vsub">مهامك ومواعيدك الشخصية</div>';
  h += '<div class="btnrow" style="margin:0 0 12px"><button class="btn" onclick="AJ.noteForm()">+ عنصر جديد</button></div>';
  if(!list.length) h += AJ.stateEmpty('لا ملاحظات بعد — أنشئ أول مهمة');
  var KN = {note:'📝 ملاحظة', homework:'📚 واجب', exam:'🧪 امتحان', reminder:'⏰ تذكير', event:'📌 موعد'};
  list.forEach(function(n){
    h += '<div class="list-item"><div class="row between"><div class="li-t">'+(n.done?'✅ ':'')+AJ.esc(n.title)+'</div>'
      + '<span class="pill">'+(KN[n.kind]||n.kind)+'</span></div>'
      + (n.description?'<div class="li-s">'+AJ.esc(n.description)+'</div>':'')
      + (n.dateAt?'<div class="li-s">📅 '+AJ.fmtDT(n.dateAt)+'</div>':'')
      + '<div class="btnrow"><button class="btn small ghost" onclick="AJ.noteToggle(\''+n.id+'\')">'+(n.done?'إعادة فتح':'إنجاز')+'</button>'
      + '<button class="btn small danger" onclick="AJ.noteDel(\''+n.id+'\')">حذف</button></div></div>';
  });
  view.innerHTML = h;
});
AJ.noteForm = function(){
  AJ.openModal('<h2 class="vt">عنصر جديد</h2><form onsubmit="return AJ.noteSave(event)">'
    + '<label class="f">العنوان</label><input class="in" id="nt-t" required>'
    + '<label class="f">النوع</label><select class="in" id="nt-k"><option value="note">ملاحظة</option><option value="homework">واجب</option><option value="exam">امتحان</option><option value="reminder">تذكير</option><option value="event">موعد</option></select>'
    + '<label class="f">الوصف</label><textarea class="in" id="nt-d"></textarea>'
    + '<label class="f">التاريخ (اختياري)</label><input class="in" id="nt-date" type="datetime-local">'
    + '<div class="btnrow"><button class="btn" type="submit">حفظ</button></div></form>');
};
AJ.noteSave = function(e){
  e.preventDefault();
  var me = AJ.me();
  var dt = AJ.$('#nt-date').value ? new Date(AJ.$('#nt-date').value).getTime() : 0;
  AJ.db().notes.unshift({id:AJ.uid('n'), userId:me.id, kind:AJ.$('#nt-k').value, title:AJ.$('#nt-t').value,
    description:AJ.$('#nt-d').value, dateAt:dt, remindAt:dt, done:false, createdAt:Date.now()});
  AJ.save(); AJ.closeModal(); AJ.toast('تم الحفظ ✅'); location.reload(); return false;
};
AJ.noteToggle = function(id){ var n = AJ.find('notes', id); if(n){ n.done=!n.done; if(n.done) AJ.bumpStreak(AJ.me().id); AJ.save(); location.reload(); } };
AJ.noteDel = function(id){ var db=AJ.db(); db.notes = db.notes.filter(function(n){return n.id!==id;}); AJ.save(); location.reload(); };

/* ---------- calendar ---------- */
AJ.calOffset = 0;
AJ.registerView('calendar', function(view){
  AJ.require('accessApp');
  var base = new Date(); base.setMonth(base.getMonth()+AJ.calOffset);
  var Y = base.getFullYear(), M = base.getMonth();
  var first = new Date(Y, M, 1); var startOff = (first.getDay()+6)%7;
  var dim = new Date(Y, M+1, 0).getDate();
  var db = AJ.db(), me = AJ.me();
  function dayItems(day){
    var items = [];
    var wd = DOW_AR[(new Date(Y,M,day).getDay()+6)%7];
    db.schedule.forEach(function(s){ if(DAY_AR_REV(s.day)===wd) items.push('📚 '+s.subjectName); });
    db.homework.forEach(function(x){ var d=new Date(x.dueAt); if(d.getFullYear()===Y&&d.getMonth()===M&&d.getDate()===day) items.push('📝 '+x.title); });
    db.exams.forEach(function(x){ var d=new Date(x.endsAt); if(d.getFullYear()===Y&&d.getMonth()===M&&d.getDate()===day) items.push('🧪 '+x.title); });
    db.notes.forEach(function(n){ if(n.userId!==me.id||!n.dateAt) return; var d=new Date(n.dateAt); if(d.getFullYear()===Y&&d.getMonth()===M&&d.getDate()===day) items.push('📌 '+n.title); });
    return items;
  }
  var h = '<div class="row between"><h2 class="vt">🗓 التقويم</h2><div class="row"><button class="ibtn" onclick="AJ.calOffset--;location.reload()">‹</button><button class="ibtn" onclick="AJ.calOffset++;location.reload()">›</button></div></div>';
  h += '<div class="vsub">'+({0:'جانفي',1:'فيفري',2:'مارس',3:'أفريل',4:'ماي',5:'جوان',6:'جويلية',7:'أوت',8:'سبتمبر',9:'أكتوبر',10:'نوفمبر',11:'ديسمبر'})[M]+' '+Y+'</div>';
  h += '<div class="cal">' + DOW_AR.map(function(d){return '<div class="dow">'+d.slice(0,3)+'</div>';}).join('');
  for(var i=0;i<startOff;i++) h += '<div></div>';
  var today = new Date();
  for(var d=1;d<=dim;d++){
    var items = dayItems(d);
    var isT = today.getFullYear()===Y && today.getMonth()===M && today.getDate()===d;
    h += '<div class="day'+(isT?' today':'')+'" onclick="AJ.calDay('+Y+','+M+','+d+')"><div class="dt">'+d+'</div><div class="dots">'+items.slice(0,2).map(function(t){return '• '+AJ.esc(t.slice(0,12));}).join('<br>')+(items.length>2?'<br>…':'')+'</div></div>';
  }
  h += '</div>';
  view.innerHTML = h;
});
function DAY_AR_REV(k){ return {mon:'الإثنين',tue:'الثلاثاء',wed:'الأربعاء',thu:'الخميس',fri:'الجمعة',sat:'السبت',sun:'الأحد'}[k]; }
AJ.calDay = function(Y, M, d){
  var db = AJ.db(), me = AJ.me(), items = [];
  db.homework.forEach(function(x){ var t=new Date(x.dueAt); if(t.getFullYear()===Y&&t.getMonth()===M&&t.getDate()===d) items.push('📝 '+x.title+' — '+AJ.countdown(x.dueAt)); });
  db.exams.forEach(function(x){ var t=new Date(x.endsAt); if(t.getFullYear()===Y&&t.getMonth()===M&&t.getDate()===d) items.push('🧪 '+x.title); });
  db.notes.forEach(function(n){ if(n.userId!==me.id||!n.dateAt) return; var t=new Date(n.dateAt); if(t.getFullYear()===Y&&t.getMonth()===M&&t.getDate()===d) items.push('📌 '+n.title); });
  AJ.openModal('<h2 class="vt">'+d+' / '+(M+1)+' / '+Y+'</h2><div class="card" style="margin-top:10px">'+(items.length?items.map(AJ.esc).join('<br>'):'لا عناصر في هذا اليوم')+'</div><div class="btnrow"><button class="btn ghost" onclick="AJ.closeModal()">إغلاق</button></div>');
};

/* ---------- library ---------- */
AJ.registerView('library', function(view){
  AJ.require('accessApp');
  var db = AJ.db();
  var subs = db.subjects;
  var h = '<h2 class="vt">📁 مركز الملفات</h2><div class="vsub">ملخصات وملفات حسب المادة</div>';
  h += '<div class="tabs" id="lib-tabs"><button class="on" data-s="">الكل</button>' + subs.map(function(s){return '<button data-s="'+s.id+'">'+s.icon+' '+AJ.esc(s.nameAr)+'</button>';}).join('') + '</div><div id="lib-list"></div>';
  view.innerHTML = h;
  function renderLib(sid){
    var files = db.library.filter(function(f){ return !sid || f.subjectId===sid; });
    AJ.$('#lib-list').innerHTML = files.length ? files.map(function(f){
      return '<div class="list-item" onclick="AJ.openLibrary(\''+f.id+'\')"><div class="li-t">📄 '+AJ.esc(f.title)+'</div><div class="li-s">'+AJ.esc(f.subjectName)+' • '+AJ.esc(f.term||'')+' • '+AJ.esc(f.kind)+'</div></div>';
    }).join('') : AJ.stateEmpty('لا ملفات بعد');
  }
  renderLib('');
  Array.prototype.forEach.call(view.querySelectorAll('#lib-tabs button'), function(b){
    b.addEventListener('click', function(){
      Array.prototype.forEach.call(view.querySelectorAll('#lib-tabs button'), function(x){ x.classList.remove('on'); });
      b.classList.add('on'); renderLib(b.getAttribute('data-s'));
    });
  });
});
AJ.openLibrary = function(id){
  var f = AJ.find('library', id); if(!f) return;
  if(f.kind==='lesson' && f.refId){ AJ.go('lesson', f.refId); return; }
  if(f.url){ window.open(f.url, '_blank'); return; }
  AJ.toast('لا معاينة متاحة لهذا الملف');
};

/* ---------- announcements ---------- */
AJ.registerView('announcements', function(view){
  AJ.require('accessApp');
  var list = AJ.db().announcements.slice().sort(function(a,b){ return (b.pinned-a.pinned) || (b.createdAt-a.createdAt); });
  var h = '<h2 class="vt">📢 الإعلانات</h2><div class="vsub">آخر مستجدات الشعبة</div>';
  if(AJ.hasPerm('manageAnnouncements')) h += '<div class="btnrow" style="margin:0 0 12px"><button class="btn ghost" onclick="AJ.anCreate()">+ إعلان جديد</button></div>';
  if(!list.length) h += AJ.stateEmpty('لا إعلانات بعد');
  list.forEach(function(a){
    h += '<div class="card"><div class="li-t">'+(a.pinned?'📌 ':'')+AJ.esc(a.title)+'</div><div style="font-size:14px;color:var(--sub);margin-top:6px">'+AJ.esc(a.body)+'</div><div class="cap" style="margin-top:6px">'+AJ.timeAgo(a.createdAt)+'</div></div>';
  });
  view.innerHTML = h;
});
AJ.anCreate = function(){
  AJ.require('manageAnnouncements');
  AJ.openModal('<h2 class="vt">إعلان جديد</h2><form onsubmit="return AJ.anSave(event)"><label class="f">العنوان</label><input class="in" id="an-t" required><label class="f">النص</label><textarea class="in" id="an-b" required></textarea><div class="swrow"><span>تثبيت الإعلان</span><label class="sw"><input type="checkbox" id="an-p"><span class="tr"></span></label></div><div class="btnrow"><button class="btn" type="submit">نشر + إشعار</button></div></form>');
};
AJ.anSave = function(e){
  e.preventDefault();
  var a = {id:AJ.uid('an'), title:AJ.$('#an-t').value, body:AJ.$('#an-b').value, imageUrl:'', fileUrl:'', link:'', pinned:AJ.$('#an-p').checked, target:'all', createdBy:AJ.me().id, createdAt:Date.now()};
  AJ.db().announcements.unshift(a); AJ.save();
  AJ.notifyAll({kind:'announcement', title:'📢 '+a.title, body:a.body.slice(0,120), route:'announcements'});
  AJ.audit('create_announcement', a.title); AJ.closeModal(); AJ.toast('تم النشر ✅'); location.reload(); return false;
};

/* ---------- notifications ---------- */
AJ.registerView('notifications', function(view){
  var me = AJ.me(); if(!me){ location.hash='#/login'; return; }
  var list = AJ.db().notifications.filter(function(n){ return n.userId===me.id; });
  var t0 = new Date(); t0.setHours(0,0,0,0);
  var tY = t0.getTime()-86400000;
  var g = {t:[], y:[], o:[]};
  list.forEach(function(n){ if(n.createdAt>=t0.getTime()) g.t.push(n); else if(n.createdAt>=tY) g.y.push(n); else g.o.push(n); });
  var h = '<h2 class="vt">🔔 الإشعارات</h2><div class="vsub">اضغط على إشعار لفتح صفحته</div>';
  h += '<div class="btnrow" style="margin:0 0 12px"><button class="btn ghost small" onclick="AJ.ntfClear()">تحديد الكل كمقروء</button></div>';
  function group(title, arr){
    if(!arr.length) return '';
    return '<b>'+title+'</b>' + arr.map(function(n){
      return '<div class="list-item" style="'+(n.read?'opacity:.65':'')+'" onclick="AJ.ntfOpen(\''+n.id+'\')"><div class="li-t">'+(n.read?'':'🟢 ')+AJ.esc(n.title)+'</div><div class="li-s">'+AJ.esc(n.body||'').slice(0,100)+'<br>'+AJ.timeAgo(n.createdAt)+'</div></div>';
    }).join('');
  }
  h += group('اليوم', g.t) + group('أمس', g.y) + group('الأقدم', g.o);
  if(!list.length) h += AJ.stateEmpty('لا إشعارات بعد');
  view.innerHTML = h;
});
AJ.ntfOpen = function(id){
  var n = AJ.find('notifications', id); if(!n) return;
  n.read = true; AJ.save();
  if(n.route) AJ.go(n.route, n.targetId||'');
  else location.reload();
};
AJ.ntfClear = function(){ var me=AJ.me(); AJ.db().notifications.forEach(function(n){ if(n.userId===me.id) n.read=true; }); AJ.save(); location.reload(); };

/* ---------- search ---------- */
AJ.registerView('search', function(view){
  AJ.require('accessApp');
  view.innerHTML = '<h2 class="vt">🔍 البحث الشامل</h2><div class="vsub">دروس • واجبات • ملفات • إعلانات • محادثات</div>'
    + '<div class="searchbar"><input class="in" id="q" placeholder="ابحث…" oninput="AJ.doSearch(this.value)"></div><div id="sr"></div>';
  AJ.$('#q').focus();
});
AJ.doSearch = function(q){
  q = (q||'').trim(); var box = AJ.$('#sr'); if(!box) return;
  if(q.length < 2){ box.innerHTML = ''; return; }
  var db = AJ.db(), me = AJ.me(), out = [];
  function hit(t, s, go){ out.push('<div class="list-item" onclick="'+go+'"><div class="li-t">'+AJ.esc(t)+'</div><div class="li-s">'+AJ.esc(s||'')+'</div></div>'); }
  db.lessons.forEach(function(l){ if((l.title+l.body).indexOf(q)>=0) hit('📚 '+l.title, 'درس', "AJ.go('lesson','"+l.id+"')"); });
  db.homework.forEach(function(x){ if((x.title+x.description).indexOf(q)>=0) hit('📝 '+x.title, 'واجب', "AJ.go('homework')"); });
  db.announcements.forEach(function(a){ if((a.title+a.body).indexOf(q)>=0) hit('📢 '+a.title, 'إعلان', "AJ.go('announcements')"); });
  db.library.forEach(function(f){ if(f.title.indexOf(q)>=0) hit('📄 '+f.title, 'ملف', "AJ.openLibrary('"+f.id+"')"); });
  db.aiChats.forEach(function(c){ if(c.userId===me.id && c.title.indexOf(q)>=0) hit('🤖 '+c.title, 'محادثة AI', "AJ.go('aichat','"+c.id+"')"); });
  db.messages.forEach(function(m){ if(!m.deleted && m.text.indexOf(q)>=0) hit('💬 '+m.senderName+': '+m.text.slice(0,60), 'المجتمع', "AJ.go('community')"); });
  box.innerHTML = out.length ? out.slice(0,30).join('') : AJ.stateEmpty('لا نتائج');
};

/* ---------- study tools ---------- */
function calcEval(expr){
  var s = String(expr||'').replace(/×/g,'*').replace(/÷/g,'/').replace(/\s+/g,'').replace(/,/g,'.');
  if(!/^[0-9+\-*/().%^ ]+$/.test(s) || !s) throw new Error('bad');
  var pos = 0;
  function peek(){ return s[pos]; }
  function num(){ var st=pos; while(pos<s.length && /[0-9.]/.test(s[pos])) pos++; if(st===pos) throw new Error('bad'); return parseFloat(s.slice(st,pos)); }
  function fac(){ if(peek()==='('){ pos++; var v=ex(); if(peek()!==')') throw new Error('bad'); pos++; return v; } if(peek()==='-'){ pos++; return -fac(); } return num(); }
  function pw(){ var v=fac(); while(peek()==='^'){ pos++; v=Math.pow(v,fac()); } return v; }
  function tm(){ var v=pw(); while(peek()==='*'||peek()==='/'||peek()==='%'){ var o=s[pos++], r=pw(); v = o==='*' ? v*r : (o==='/' ? v/r : v%r); } return v; }
  function ex(){ var v=tm(); while(peek()==='+'||peek()==='-'){ var o=s[pos++], r=tm(); v = o==='+' ? v+r : v-r; } return v; }
  var out = ex(); if(pos!==s.length || !isFinite(out)) throw new Error('bad');
  return Math.round(out*1e10)/1e10;
}
AJ.registerView('tools', function(view){
  AJ.require('accessApp');
  view.innerHTML = '<h2 class="vt">🧰 أدوات الدراسة</h2><div class="vsub">حاسبة • بومودورو • محول وحدات • مؤقت</div>'
    + '<div class="card"><b>🧮 حاسبة علمية</b><input class="in" id="tc-in" placeholder="مثال: (2+3)*4^2" style="margin-top:8px;direction:ltr">'
    + '<div class="btnrow"><button class="btn" onclick="AJ.toolCalc()">احسب (=)</button></div><div id="tc-out" style="font-size:22px;font-weight:800;color:var(--accent);margin-top:8px"></div></div>'
    + '<div class="card"><b>⏱ بومودورو 25 / 5</b><div class="timer-big" id="pm-t">25:00</div>'
    + '<div class="btnrow"><button class="btn" onclick="AJ.pomo(25)">دراسة 25د</button><button class="btn ghost" onclick="AJ.pomo(5)">استراحة 5د</button><button class="btn danger" onclick="AJ.pomoStop()">إيقاف</button></div><div class="cap" id="pm-s" style="text-align:center;margin-top:6px"></div></div>'
    + '<div class="card"><b>📏 محول الوحدات</b><div class="grid2" style="margin-top:8px"><input class="in" id="cv-v" type="number" value="1"><select class="in" id="cv-u"><option value="km-m">km ← m</option><option value="m-cm">m ← cm</option><option value="kg-g">kg ← g</option><option value="c-f">°C ← °F</option><option value="h-min">ساعة ← دقيقة</option></select></div>'
    + '<div class="btnrow"><button class="btn" onclick="AJ.toolConvert()">تحويل</button></div><div id="cv-out" style="font-weight:800;margin-top:8px"></div></div>';
});
AJ.toolCalc = function(){ try{ AJ.$('#tc-out').textContent = '= ' + calcEval(AJ.$('#tc-in').value); }catch(e){ AJ.$('#tc-out').textContent = 'تعبير غير صالح'; } };
AJ._pomoTimer = null;
AJ.pomo = function(min){
  AJ.pomoStop();
  var end = Date.now()+min*60000;
  AJ.$('#pm-s').textContent = min>=25 ? 'جلسة دراسة — بالتوفيق 📚' : 'استراحة — اشرب ماء ☕';
  AJ._pomoTimer = setInterval(function(){
    var ms = Math.max(0, end-Date.now());
    var el = AJ.$('#pm-t'); if(!el){ AJ.pomoStop(); return; }
    el.textContent = Math.floor(ms/60000)+':'+('0'+Math.floor(ms%60000/1000)).slice(-2);
    if(ms<=0){ AJ.pomoStop(); AJ.toast(min>=25?'انتهت الجلسة — خذ استراحة 🎉':'انتهت الاستراحة — عُد للدراسة 💪'); if(min>=25) AJ.bumpStreak(AJ.me().id); }
  }, 500);
};
AJ.pomoStop = function(){ if(AJ._pomoTimer){ clearInterval(AJ._pomoTimer); AJ._pomoTimer=null; } var el=AJ.$('#pm-t'); if(el) el.textContent='25:00'; };
AJ.toolConvert = function(){
  var v = parseFloat(AJ.$('#cv-v').value), u = AJ.$('#cv-u').value, out;
  if(isNaN(v)){ AJ.$('#cv-out').textContent = 'أدخل رقمًا'; return; }
  if(u==='km-m') out = v+' km = '+(v*1000)+' m';
  else if(u==='m-cm') out = v+' m = '+(v*100)+' cm';
  else if(u==='kg-g') out = v+' kg = '+(v*1000)+' g';
  else if(u==='c-f') out = v+' °C = '+(v*9/5+32)+' °F';
  else out = v+' ساعة = '+(v*60)+' دقيقة';
  AJ.$('#cv-out').textContent = out;
};

/* ---------- daily ---------- */
function dailyQs(){
  var bank = AJ.db().qbank;
  var h = 0, k = AJ.dayKey(); for(var i=0;i<k.length;i++) h=(h*33+k.charCodeAt(i))>>>0;
  if(!bank.length) return [null, null];
  return [bank[h%bank.length], bank[(h>>3)%bank.length]];
}
AJ.registerView('daily', function(view){
  AJ.require('accessApp');
  var qs = dailyQs();
  var done = {}; try{ done = JSON.parse(localStorage.getItem('ajdaily')||'{}'); }catch(e){}
  var h = '<h2 class="vt">🎯 تحدي اليوم</h2><div class="vsub">'+AJ.fmtDate(Date.now())+'</div>';
  qs.forEach(function(q, i){
    if(!q) return;
    var key = AJ.dayKey()+'-'+i, ok = done[key];
    h += '<div class="card"><b>'+(i===0?'تحدي اليوم':'سؤال المراجعة')+': '+AJ.esc(q.question)+'</b><div style="margin-top:8px" id="dq-'+i+'">';
    if(ok === true) h += '<span class="chip">✅ إجابة صحيحة</span>';
    else if(ok === false) h += '<span class="chip">❌ راجع الشرح</span>';
    else q.options.forEach(function(op, oi){ h += '<button class="btn ghost small" style="margin:3px" onclick="AJ.dailyAnswer('+i+',\''+q.id+'\','+oi+')">'+AJ.esc(op)+'</button>'; });
    h += '</div>'+(q.explanation?'<div class="cap" style="margin-top:6px">💡 '+AJ.esc(q.explanation)+'</div>':'')+'</div>';
  });
  view.innerHTML = h;
});
AJ.dailyAnswer = function(i, qid, oi){
  var q = AJ.find('qbank', qid); if(!q) return;
  var ok = (q.correct||[])[0] === oi;
  var done = {}; try{ done = JSON.parse(localStorage.getItem('ajdaily')||'{}'); }catch(e){}
  done[AJ.dayKey()+'-'+i] = ok; localStorage.setItem('ajdaily', JSON.stringify(done));
  if(ok){ AJ.bumpStreak(AJ.me().id); AJ.toast('إجابة صحيحة 🎉'); } else AJ.toast('إجابة خاطئة — راجع الشرح 💡');
  location.reload();
};

/* ---------- profile ---------- */
AJ.registerView('profile', function(view){
  var me = AJ.me(); if(!me){ location.hash='#/login'; return; }
  var db = AJ.db();
  var chats = db.aiChats.filter(function(c){return c.userId===me.id;}).length;
  var res = db.results.filter(function(r){return r.userId===me.id;});
  var avg = res.length ? Math.round(res.reduce(function(a,r){return a+r.score/Math.max(1,r.total);},0)/res.length*100) : 0;
  var st = AJ.getStreak(me.id);
  var initial = AJ.esc((me.name||me.username||'?').trim().charAt(0));
  view.innerHTML = '<div class="card"><div class="row"><div style="width:60px;height:60px;border-radius:50%;background:var(--accent-dim);color:var(--accent);font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center">'+initial+'</div>'
    + '<div><div style="font-size:19px;font-weight:800">'+AJ.esc(me.name)+'</div><div class="cap">@'+AJ.esc(me.username)+' • '+AJ.esc(me.role)+' • 1AS-A</div></div></div>'
    + '<div class="grid3" style="margin-top:12px"><div class="tile"><div class="t-t">🔥 '+st.days+'</div><div class="t-s">أيام متتالية</div></div>'
    + '<div class="tile"><div class="t-t">🤖 '+chats+'</div><div class="t-s">محادثات AI</div></div>'
    + '<div class="tile"><div class="t-t">🧪 '+avg+'%</div><div class="t-s">متوسط النتائج</div></div></div></div>'
    + '<div class="list-item" onclick="AJ.go(\'saved\')"><div class="li-t">⭐ المحفوظات</div></div>'
    + '<div class="list-item" onclick="AJ.go(\'notes\')"><div class="li-t">📝 المفكرة</div></div>'
    + '<div class="list-item" onclick="AJ.go(\'tools\')"><div class="li-t">🧰 أدوات الدراسة</div></div>'
    + '<div class="list-item" onclick="AJ.go(\'settings\')"><div class="li-t">⚙ الإعدادات</div></div>'
    + (AJ.canAdmin() ? '<div class="list-item" onclick="AJ.go(\'admin\')"><div class="li-t">👑 لوحة الإدارة</div></div>' : '')
    + '<div class="btnrow"><button class="btn danger" onclick="AJ.logout()">تسجيل الخروج</button></div>';
});

/* ---------- settings ---------- */
AJ.registerView('settings', function(view){
  var me = AJ.me(); if(!me){ location.hash='#/login'; return; }
  var prefs = AJ.prefs(), st = AJ.db().settings;
  var canAI = AJ.hasPerm('manageAI') || AJ.isOwner();
  view.innerHTML = '<h2 class="vt">⚙ الإعدادات</h2><div class="vsub">التخصيص والخصوصية والحساب</div>'
    + '<div class="card"><b>🎨 المظهر</b><div class="tabs" style="margin-top:8px">'
    + ['dark','light','system'].map(function(t){ return '<button class="'+(prefs.theme===t?'on':'')+'" onclick="AJ.setTheme(\''+t+'\')">'+({dark:'داكن',light:'فاتح',system:'النظام'})[t]+'</button>'; }).join('') + '</div></div>'
    + '<div class="card"><b>🤖 الذكاء الاصطناعي</b>'
    + '<div class="swrow"><span>ذاكرة AI (تذكر السياق والتفضيلات)</span><label class="sw"><input type="checkbox" '+(prefs.aiMemory?'checked':'')+' onchange="AJ.toggleMemory(this.checked)"><span class="tr"></span></label></div>'
    + '<div class="btnrow"><button class="btn ghost small" onclick="AJ.clearAiMemory()">🗑 مسح ذاكرة AI</button></div>'
    + (canAI
      ? '<label class="f">AI API URL (قابل للتعديل — عبر Proxy آمن، لا مفاتيح هنا)</label><input class="in" id="st-aiurl" value="'+AJ.esc(st.aiUrl||'')+'" placeholder="https://…" style="direction:ltr">'
       + '<label class="f">النموذج (Model)</label><input class="in" id="st-aimodel" value="'+AJ.esc(st.aiModel||'')+'" style="direction:ltr">'
       + '<div class="btnrow"><button class="btn small" onclick="AJ.saveAiSettings()">حفظ إعدادات AI</button></div>'
      : '<div class="cap">إعدادات AI يديرها Owner فقط.</div>') + '</div>'
    + '<div class="card"><b>🔒 الخصوصية</b>'
    + ['showOnline|إظهار حالة الاتصال','showLastSeen|إظهار آخر ظهور','showRead|إيصالات القراءة'].map(function(x){ var p=x.split('|'); return '<div class="swrow"><span>'+p[1]+'</span><label class="sw"><input type="checkbox" '+(me[p[0]]?'checked':'')+' onchange="AJ.setPrivacy(\''+p[0]+'\',this.checked)"><span class="tr"></span></label></div>'; }).join('') + '</div>'
    + '<div class="card"><b>🔑 تغيير كلمة المرور</b>' + (me.mustChangePassword?'<div class="err">يجب تغيير كلمة المرور (طلب الإدارة)</div>':'')
    + '<label class="f">كلمة مرور جديدة (6+ أحرف)</label><input class="in" id="pw-new" type="password">'
    + '<div class="btnrow"><button class="btn small" onclick="AJ.changePw()">تغيير</button></div></div>'
    + '<div class="card"><b>ℹ حول</b><div class="kv"><span>التطبيق</span><b>AJ Class A</b></div><div class="kv"><span>المدرسة</span><b>Adnan Al Jisr</b></div><div class="kv"><span>الصف</span><b>1AS — Section A</b></div><div class="kv"><span>الإصدار</span><b>1.0.0 (ويب)</b></div></div>'
    + '<div class="card"><b>🗄 البيانات</b><div class="cap">تعمل النسخة محليًا على جهازك. للمزامنة السحابية اربط Firebase من الأسفل.</div><div class="btnrow"><button class="btn ghost small" onclick="AJ.fbStatus()">☁ حالة Firebase</button><button class="btn danger small" onclick="if(confirm(\'إعادة تعيين كل البيانات؟\')){AJ.resetAll();location.reload();}">إعادة تعيين</button></div></div>';
});
AJ.setTheme = function(t){ var p=AJ.prefs(); p.theme=t; AJ.savePrefs(p); AJ.applyTheme(); location.reload(); };
AJ.toggleMemory = function(v){ var p=AJ.prefs(); p.aiMemory=v; AJ.savePrefs(p); AJ.toast(v?'ذاكرة AI مفعّلة':'ذاكرة AI متوقفة'); };
AJ.clearAiMemory = function(){ var db=AJ.db(), me=AJ.me(); db.aiChats.forEach(function(c){ if(c.userId===me.id) c.memorySummary=''; }); AJ.save(); AJ.toast('تم مسح ذاكرة AI 🗑'); };
AJ.setPrivacy = function(k, v){ var me=AJ.me(); me[k]=v; AJ.save(); AJ.toast('تم الحفظ'); };
AJ.changePw = function(){
  var v = AJ.$('#pw-new').value || '';
  if(v.length < 6){ AJ.toast('كلمة المرور 6 أحرف على الأقل'); return; }
  var me = AJ.me(); me.pass = v; me.mustChangePassword = false; AJ.save(); AJ.toast('تم تغيير كلمة المرور ✅'); location.hash='#/profile';
};
AJ.saveAiSettings = function(){
  if(!(AJ.hasPerm('manageAI')||AJ.isOwner())){ AJ.toast('لا صلاحية'); return; }
  var st = AJ.db().settings;
  st.aiUrl = AJ.$('#st-aiurl').value.trim(); st.aiModel = AJ.$('#st-aimodel').value.trim() || 'aj-tutor-1';
  AJ.save(); AJ.audit('update_ai_settings', st.aiUrl); AJ.toast('تم حفظ إعدادات AI ✅');
};
})();
