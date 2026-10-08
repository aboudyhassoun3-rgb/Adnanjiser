/* AJ Class A — main views: home, study, homework, exams, quiz */
(function(){
'use strict';
var DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
var DAY_AR = {mon:'الإثنين', tue:'الثلاثاء', wed:'الأربعاء', thu:'الخميس', fri:'الجمعة', sun:'الأحد', sat:'السبت'};

AJ.getStreak = function(uid){
  var s = (AJ.db().streaks||{})[uid] || {days:0,last:''};
  return s;
};
AJ.bumpStreak = function(uid){
  var db = AJ.db(); db.streaks = db.streaks||{};
  var today = AJ.dayKey(), s = db.streaks[uid] || {days:0,last:''};
  if(s.last !== today){ s.days += 1; s.last = today; db.streaks[uid]=s; AJ.save(); }
  return s.days;
};
function todaySchedule(){
  var dow = DAYS[new Date().getDay()];
  return AJ.db().schedule.filter(function(s){ return s.day===dow; }).sort(function(a,b){ return a.startMin-b.startMin; });
}
function nextSlot(){
  var now = new Date(); var nowMin = now.getHours()*60+now.getMinutes();
  var list = todaySchedule();
  for(var i=0;i<list.length;i++){
    if(list[i].endMin > nowMin) return {slot:list[i], live: list[i].startMin <= nowMin};
  }
  return null;
}

/* ---------- HOME ---------- */
AJ.registerView('home', function(view){
  var me = AJ.me(); AJ.require('accessApp');
  var days = AJ.bumpStreak(me.id);
  var db = AJ.db();
  var nx = nextSlot();
  var hour = new Date().getHours();
  var greet = hour<12 ? 'صباح الخير' : (hour<18 ? 'مساء الخير' : 'مساء النور');
  var hw = db.homework.filter(function(h){ return h.dueAt > Date.now()-86400000; }).sort(function(a,b){return a.dueAt-b.dueAt;}).slice(0,3);
  var ex = db.exams.filter(function(e){ return e.endsAt > Date.now(); }).slice(0,2);
  var notes = db.notes.filter(function(n){ return n.userId===me.id && !n.done && n.dateAt && n.dateAt < Date.now()+86400000; }).slice(0,3);
  var ann = db.announcements.slice(0,2);
  var last = null;
  try{ last = JSON.parse(localStorage.getItem('ajlast')||'null'); }catch(e){}
  var h = '';
  h += '<div class="cap">'+AJ.esc(AJ.fmtDate(Date.now()))+'</div>';
  h += '<div class="row between"><h2 class="vt">'+greet+'، '+AJ.esc(me.name.split(' ')[0])+' 👋</h2><span class="chip">🔥 '+days+' أيام</span></div>';
  h += '<div class="vsub">1AS — Section A • ثانوية عدنان الجسر</div>';
  if(last && (last.chatId || last.lessonId)){
    h += '<div class="card tight row between"><div>▶ تابع من حيث توقفت<br><span class="cap">'+AJ.esc(last.title||'')+'</span></div><button class="btn small" onclick="'+(last.chatId?("AJ.go('aichat','"+last.chatId+"')"):("AJ.go('lesson','"+last.lessonId+"')"))+'">متابعة</button></div>';
  }
  h += '<div class="card"><div class="cap">الحصة القادمة</div>';
  if(nx) h += '<div style="font-weight:800;font-size:17px;margin-top:4px">'+(nx.live?'🔴 الآن: ':'')+AJ.esc(nx.slot.subjectName)+'</div><div class="cap">'+AJ.slotLabel(nx.slot.startMin)+' — '+AJ.esc(nx.slot.teacher||'')+(nx.slot.room?' • '+AJ.esc(nx.slot.room):'')+'</div>';
  else h += '<div style="font-weight:700;margin-top:4px">لا حصص متبقية اليوم 🎉</div>';
  h += '</div>';
  h += '<div class="grid3">'
    + '<div class="tile" onclick="AJ.go(\'ai\')"><div class="t-ic">🤖</div><div class="t-t">اسأل AI</div></div>'
    + '<div class="tile" onclick="AJ.go(\'aichat\',\'new:camera\')"><div class="t-ic">📷</div><div class="t-t">حل سؤال</div></div>'
    + '<div class="tile" onclick="AJ.go(\'tools\')"><div class="t-ic">🧰</div><div class="t-t">الأدوات</div></div>'
    + '</div>';
  h += '<div class="card"><div class="row between"><b>مهام اليوم</b><button class="btn small ghost" onclick="AJ.go(\'calendar\')">التقويم</button></div><div style="margin-top:8px;font-size:14px">';
  var tasks = [];
  hw.forEach(function(x){ tasks.push('📝 '+x.title+' — <span class="acc">'+AJ.countdown(x.dueAt)+'</span>'); });
  ex.forEach(function(x){ tasks.push('🧪 '+x.title); });
  notes.forEach(function(n){ tasks.push('📌 '+n.title); });
  h += tasks.length ? tasks.join('<br>') : 'لا مهام اليوم 🎉';
  h += '</div></div>';
  h += '<div class="card"><div class="row between"><b>🎯 تحدي اليوم</b><button class="btn small ghost" onclick="AJ.go(\'daily\')">المشاركة</button></div><div class="cap">سؤال قصير جديد كل يوم + سؤال المراجعة</div></div>';
  if(ann.length){
    h += '<b>آخر الإعلانات</b><div style="margin-top:8px">';
    ann.forEach(function(a){ h += '<div class="list-item" onclick="AJ.go(\'announcements\')"><div class="li-t">'+AJ.esc(a.title)+'</div><div class="li-s">'+AJ.esc(a.body.slice(0,90))+'…</div></div>'; });
    h += '</div>';
  }
  view.innerHTML = h;
});

/* ---------- STUDY ---------- */
AJ.registerView('study', function(view){
  AJ.require('accessApp');
  var subs = AJ.db().subjects.slice().sort(function(a,b){return a.order-b.order;});
  var h = '<h2 class="vt">📚 الدراسة</h2><div class="vsub">اختر مادة لعرض الدروس والواجبات والاختبارات</div><div class="grid2">';
  subs.forEach(function(s){
    var n = AJ.db().lessons.filter(function(l){return l.subjectId===s.id;}).length;
    h += '<div class="tile" onclick="AJ.go(\'subject\',\''+s.id+'\')"><div class="t-ic">'+s.icon+'</div><div class="t-t">'+AJ.esc(s.nameAr)+'</div><div class="t-s">'+n+' دروس • '+AJ.esc(s.teacher||'')+'</div></div>';
  });
  h += '</div>';
  if(AJ.hasPerm('manageSubjects')) h += '<div class="btnrow"><button class="btn ghost" onclick="AJ.adminAddSubject()">+ مادة جديدة</button></div>';
  view.innerHTML = h;
});

AJ.registerView('subject', function(view, id){
  AJ.require('accessApp');
  var s = AJ.find('subjects', id); if(!s){ view.innerHTML = AJ.stateEmpty('المادة غير موجودة'); return; }
  var db = AJ.db();
  var lessons = db.lessons.filter(function(l){return l.subjectId===id;}).sort(function(a,b){return a.order-b.order;});
  var hw = db.homework.filter(function(x){return x.subjectId===id;}).sort(function(a,b){return b.createdAt-a.createdAt;}).slice(0,5);
  var exs = db.exams.filter(function(x){return x.subjectId===id;}).slice(0,5);
  var files = db.library.filter(function(f){return f.subjectId===id;});
  var h = '<div class="row"><div style="font-size:34px">'+s.icon+'</div><div><h2 class="vt">'+AJ.esc(s.nameAr)+'</h2><div class="cap">'+AJ.esc(s.teacher||'')+'</div></div></div>';
  h += '<div class="btnrow"><button class="btn small" onclick="AJ.askSubject(\''+id+'\')">🤖 اسأل AI عن '+AJ.esc(s.nameAr)+'</button></div>';
  h += '<div class="tabs" style="margin-top:12px"><button class="on">📚 الدروس ('+lessons.length+')</button></div>';
  if(!lessons.length) h += AJ.stateEmpty('لا دروس بعد');
  lessons.forEach(function(l){
    h += '<div class="list-item" onclick="AJ.go(\'lesson\',\''+l.id+'\')"><div class="li-t">'+AJ.esc(l.title)+'</div><div class="li-s">'+AJ.esc(l.desc||'')+'</div></div>';
  });
  if(hw.length){ h += '<b>📝 الواجبات</b>'; hw.forEach(function(x){ h+='<div class="list-item" onclick="AJ.go(\'homework\')"><div class="li-t">'+AJ.esc(x.title)+'</div><div class="li-s">'+AJ.countdown(x.dueAt)+'</div></div>'; }); }
  if(exs.length){ h += '<b>🧪 الاختبارات</b>'; exs.forEach(function(x){ h+='<div class="list-item" onclick="AJ.go(\'exam\',\''+x.id+'\')"><div class="li-t">'+AJ.esc(x.title)+'</div><div class="li-s">'+x.questions.length+' أسئلة • '+x.durationMin+' دقيقة</div></div>'; }); }
  if(files.length){ h += '<b>📄 الملفات</b>'; files.forEach(function(f){ h+='<div class="list-item" onclick="AJ.openLibrary(\''+f.id+'\')"><div class="li-t">'+AJ.esc(f.title)+'</div><div class="li-s">'+AJ.esc(f.term||'')+'</div></div>'; }); }
  if(AJ.hasPerm('manageLessons')) h += '<div class="btnrow"><button class="btn ghost" onclick="AJ.adminAddLesson(\''+id+'\')">+ درس جديد</button></div>';
  view.innerHTML = h;
});

AJ.registerView('lesson', function(view, id){
  AJ.require('accessApp');
  var l = AJ.find('lessons', id); if(!l){ view.innerHTML = AJ.stateEmpty('الدرس غير موجود'); return; }
  try{ localStorage.setItem('ajlast', JSON.stringify({lessonId:id, title:l.title})); }catch(e){}
  var paras = AJ.esc(l.body||l.desc||'').split('\n').map(function(p){
    if(!p.trim()) return '';
    if(p.trim().indexOf('•')===0||p.trim().indexOf('-')===0) return '<li>'+p.trim().slice(1)+'</li>';
    return '<p>'+p+'</p>';
  }).join('').replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  view.innerHTML = '<div class="cap">'+AJ.esc((AJ.find('subjects', l.subjectId)||{}).nameAr||'')+'</div>'
    + '<h2 class="vt">'+AJ.esc(l.title)+'</h2><div class="vsub">'+AJ.esc(l.desc||'')+'</div>'
    + '<div class="card"><div class="md">'+paras+'</div></div>'
    + '<div class="btnrow"><button class="btn" onclick="AJ.askSubject(\''+l.subjectId+'\')">🤖 اشرح أكثر مع AI</button>'
    + '<button class="btn ghost" onclick="AJ.saveItem(\'lesson\',\''+l.id+'\')">⭐ حفظ</button></div>';
});

/* ---------- HOMEWORK ---------- */
AJ.registerView('homework', function(view){
  AJ.require('accessApp');
  var me = AJ.me(), db = AJ.db();
  var list = db.homework.slice().sort(function(a,b){return a.dueAt-b.dueAt;});
  var h = '<h2 class="vt">📝 الواجبات</h2><div class="vsub">سلّم في الوقت — التأخير حسب سياسة كل واجب</div>';
  if(AJ.hasPerm('createHomework')) h += '<div class="btnrow" style="margin:0 0 12px"><button class="btn ghost" onclick="AJ.hwCreate()">+ واجب جديد</button></div>';
  if(!list.length) h += AJ.stateEmpty('لا توجد واجبات حالياً 🎉');
  list.forEach(function(x){
    var sub = db.submissions.filter(function(s){return s.homeworkId===x.id && s.userId===me.id;})[0];
    h += '<div class="list-item" onclick="AJ.hwDetail(\''+x.id+'\')"><div class="li-t">'+AJ.esc(x.title)+'</div>'
      + '<div class="li-s">'+AJ.esc(x.subjectName)+' • <span class="acc">'+AJ.countdown(x.dueAt)+'</span> • '+(sub?'✅ مُسلَّم':'⏳ بانتظار التسليم')+'</div></div>';
  });
  view.innerHTML = h;
});
AJ.hwDetail = function(id){
  var x = AJ.find('homework', id); if(!x) return;
  var me = AJ.me();
  var sub = AJ.db().submissions.filter(function(s){return s.homeworkId===id && s.userId===me.id;})[0];
  AJ.openModal('<h2 class="vt">'+AJ.esc(x.title)+'</h2><div class="cap">'+AJ.esc(x.subjectName)+' • التسليم: '+AJ.fmtDT(x.dueAt)+' ('+AJ.countdown(x.dueAt)+')</div>'
    + '<div class="card" style="margin-top:12px">'+AJ.esc(x.description)+'</div>'
    + (sub ? '<div class="card tight">✅ تم التسليم: '+AJ.fmtDT(sub.submittedAt)+(sub.late?' (متأخر)':'')+'<br><span class="cap">'+AJ.esc(sub.text).slice(0,200)+'</span></div>'
      : '<form onsubmit="return AJ.hwSubmit(event,\''+id+'\')"><label class="f">حلّك / تسليمك</label><textarea class="in" id="hw-txt" required></textarea><div class="btnrow"><button class="btn" type="submit">تسليم الواجب</button></div></form>')
    + '<div class="btnrow"><button class="btn ghost" onclick="AJ.closeModal()">إغلاق</button></div>');
};
AJ.hwSubmit = function(e, id){
  e.preventDefault();
  var x = AJ.find('homework', id), me = AJ.me();
  if(Date.now() > x.dueAt && !x.allowLate){ AJ.toast('انتهى وقت التسليم'); return false; }
  AJ.db().submissions.push({id:AJ.uid('s'), homeworkId:id, userId:me.id, userName:me.name, text:AJ.$('#hw-txt').value, submittedAt:Date.now(), late:Date.now()>x.dueAt});
  AJ.save(); AJ.closeModal(); AJ.toast('تم التسليم ✅');
  location.hash='#/homework'; location.reload(); return false;
};
AJ.hwCreate = function(){
  AJ.require('createHomework');
  var subs = AJ.db().subjects.map(function(s){return '<option value="'+s.id+'|'+AJ.esc(s.nameAr)+'">'+AJ.esc(s.nameAr)+'</option>';}).join('');
  AJ.openModal('<h2 class="vt">واجب جديد</h2><form onsubmit="return AJ.hwCreateGo(event)">'
    + '<label class="f">العنوان</label><input class="in" id="hw-t" required>'
    + '<label class="f">المادة</label><select class="in" id="hw-s">'+subs+'</select>'
    + '<label class="f">الوصف</label><textarea class="in" id="hw-d" required></textarea>'
    + '<label class="f">تاريخ التسليم</label><input class="in" id="hw-due" type="datetime-local" required>'
    + '<div class="swrow"><span>السماح بالتأخير</span><label class="sw"><input type="checkbox" id="hw-late" checked><span class="tr"></span></label></div>'
    + '<div class="btnrow"><button class="btn" type="submit">نشر + إشعار الطلاب</button></div></form>');
};
AJ.hwCreateGo = function(e){
  e.preventDefault();
  var me = AJ.me();
  var sp = AJ.$('#hw-s').value.split('|');
  var hw = {id:AJ.uid('hw'), title:AJ.$('#hw-t').value, subjectId:sp[0], subjectName:sp[1], description:AJ.$('#hw-d').value,
    attachments:[], dueAt:new Date(AJ.$('#hw-due').value).getTime(), allowLate:AJ.$('#hw-late').checked, status:'open', createdBy:me.id, createdAt:Date.now()};
  AJ.db().homework.unshift(hw); AJ.save();
  AJ.notifyAll({kind:'homework', title:'واجب جديد: '+hw.title, body:hw.subjectName+' • التسليم '+AJ.fmtDT(hw.dueAt), route:'homework'});
  AJ.audit('create_homework', hw.title); AJ.closeModal(); AJ.toast('تم النشر ✅');
  location.reload(); return false;
};

/* ---------- EXAMS ---------- */
AJ.registerView('exams', function(view){
  AJ.require('accessApp');
  var me = AJ.me(), db = AJ.db();
  var h = '<h2 class="vt">🧪 الاختبارات</h2><div class="vsub">اختبر نفسك وراجع أخطاءك</div>';
  h += '<div class="card tight row between"><div><b>🎲 اختبار عشوائي</b><br><span class="cap">من بنك الأسئلة حسب المادة والصعوبة</span></div><button class="btn small" onclick="AJ.go(\'quiz\')">إنشاء</button></div>';
  if(AJ.hasPerm('createExams')){ h += '<div class="btnrow" style="margin:0 0 12px"><button class="btn ghost" onclick="AJ.exCreate()">+ اختبار جديد</button></div>'; }
  var list = db.exams.slice().sort(function(a,b){ return b.createdAt-a.createdAt; });
  if(!list.length){ h += AJ.stateEmpty('لا اختبارات بعد'); }
  list.forEach(function(x){
    var allr = db.results.filter(function(r){ return r.examId===x.id && r.userId===me.id; });
    allr.sort(function(a,b){ return b.submittedAt-a.submittedAt; });
    var last = allr[0];
    var info = last ? ('آخر نتيجة: ' + last.score + '/' + last.total) : 'لم يُحل بعد';
    h += '<div class="list-item" onclick="AJ.go(\'exam\',\'" + x.id + "\')"><div class="li-t">' + AJ.esc(x.title) + '</div><div class="li-s">' + x.questions.length + ' أسئلة • ' + x.durationMin + ' د • ' + info + '</div></div>';
  });
  var my = db.results.filter(function(r){ return r.userId===me.id; }).slice(0,5);
  if(my.length){
    h += '<b>نتائجي الأخيرة</b>';
    my.forEach(function(r){
      var ex = AJ.find('exams', r.examId) || {title:r.examId};
      h += '<div class="list-item"><div class="li-t">' + AJ.esc(ex.title) + ' — ' + r.score + '/' + r.total + '</div><div class="li-s">' + AJ.fmtDT(r.submittedAt) + '</div></div>';
    });
  }
  view.innerHTML = h;
});
function norm(s){ return (s||'').trim().replace(/^[. ،,؛;:\s]+|[. ،,؛;:\s]+$/g,'').replace(/\s+/g,' '); }
AJ.registerView('exam', function(view, id){
  AJ.require('accessApp');
  var x = AJ.find('exams', id); if(!x){ view.innerHTML = AJ.stateEmpty('الاختبار غير موجود'); return; }
  AJ._exam = {def:x, answers:{}, endAt:Date.now()+x.durationMin*60000, timer:null};
  renderExamQ(view, 0);
});
function renderExamQ(view, i){
  var st = AJ._exam, x = st.def, q = x.questions[i];
  clearInterval(st.timer);
  var left = function(){ return Math.max(0, st.endAt - Date.now()); };
  var h = '<div class="row between"><div class="cap">'+(i+1)+' / '+x.questions.length+'</div><div class="chip" id="ex-timer">⏱ …</div></div>'
    + '<h2 class="vt" style="font-size:19px">'+AJ.esc(x.title)+'</h2>'
    + '<div class="card" style="margin-top:12px"><b>'+AJ.esc(q.question)+'</b><span class="cap"> • '+q.points+' نقاط • '+AJ.esc(q.difficulty||'')+'</span><div style="margin-top:10px">';
  if(q.type==='short'){
    h += '<input class="in" id="ex-a" value="'+AJ.esc(st.answers[q.id]||'')+'" placeholder="إجابتك…" />';
  } else {
    q.options.forEach(function(op, oi){
      var chk = (st.answers[q.id]||[]).indexOf(oi)>=0 ? 'checked' : '';
      h += '<label class="list-item row" style="cursor:pointer"><input type="'+(q.type==='multi'?'checkbox':'radio')+'" name="exo" value="'+oi+'" '+chk+' style="width:20px;height:20px" /><span>'+AJ.esc(op)+'</span></label>';
    });
  }
  h += '</div></div><div class="btnrow">'
    + (i>0?'<button class="btn ghost" onclick="AJ.exNav(-1)">السابق</button>':'')
    + (i<x.questions.length-1?'<button class="btn" onclick="AJ.exNav(1)">التالي</button>':'<button class="btn" onclick="AJ.exFinish()">تسليم ✅</button>')
    + '</div>';
  view.innerHTML = h;
  var tick = function(){
    var ms = left();
    var el = document.getElementById('ex-timer'); if(el) el.textContent = '⏱ '+Math.floor(ms/60000)+':'+('0'+Math.floor(ms%60000/1000)).slice(-2);
    if(ms<=0){ clearInterval(st.timer); AJ.exFinish(true); }
  };
  tick(); st.timer = setInterval(tick, 1000);
}
AJ.exNav = function(d){
  var st = AJ._exam; if(!st) return;
  var x = st.def, idx = currentExamIdx();
  collectExamAnswer();
  renderExamQ(document.getElementById('view'), Math.min(x.questions.length-1, Math.max(0, idx+d)));
};
function currentExamIdx(){ return AJ._examIdx||0; }
var _origRender = renderExamQ;
renderExamQ = function(view, i){ AJ._examIdx = i; _origRender(view, i); };
function collectExamAnswer(){
  var st = AJ._exam; if(!st) return;
  var q = st.def.questions[AJ._examIdx||0]; if(!q) return;
  if(q.type==='short'){ var el = document.getElementById('ex-a'); if(el) st.answers[q.id]=el.value; }
  else if(q.type==='multi'){ var c=[]; Array.prototype.forEach.call(document.querySelectorAll('input[name="exo"]:checked'), function(r){ c.push(+r.value); }); st.answers[q.id]=c; }
  else { var r = document.querySelector('input[name="exo"]:checked'); st.answers[q.id]= r ? [+r.value] : []; }
}
AJ.exFinish = function(auto){
  var st = AJ._exam; if(!st) return;
  collectExamAnswer();
  clearInterval(st.timer);
  var x = st.def, me = AJ.me(), score = 0, total = 0, wrong = [];
  x.questions.forEach(function(q){
    total += q.points;
    var ok = false, a = st.answers[q.id];
    if(q.type==='short'){ ok = norm(a) !== '' && (norm(a)===norm(q.correctText) || norm(q.correctText).split('/').map(norm).indexOf(norm(a))>=0); }
    else if(q.type==='multi'){ var ca=(q.correct||[]).slice().sort().join(','), ga=((a instanceof Array)?a:[]).slice().sort().join(','); ok = ca===ga && ga!==''; }
    else { ok = (a||[])[0] === (q.correct||[])[0] && (a||[]).length>0; }
    if(ok) score += q.points; else wrong.push(q);
  });
  var pct = total?Math.round(score*100/total):0;
  AJ.db().results.unshift({id:AJ.uid('r'), examId:x.id, userId:me.id, score:score, total:total, answers:st.answers, wrongIds:wrong.map(function(q){return q.id;}), submittedAt:Date.now()});
  AJ.bumpStreak(me.id); AJ.save();
  var weak = wrong.length ? '<div class="card"><b>💡 تحتاج مراجعة:</b><br>'+wrong.slice(0,3).map(function(q){return '• '+AJ.esc(q.question.slice(0,60))+'…';}).join('<br>')+'</div><div class="btnrow"><button class="btn" onclick="AJ.askSubject(\''+x.subjectId+'\',\'اشرح لي هذه المواضيع التي أخطأت فيها: '+AJ.esc(wrong.slice(0,3).map(function(q){return q.question;}).join(' / ')).slice(0,300)+'\')">🤖 اشرح أخطائي مع AI</button></div>' : '<div class="card">🎉 ممتاز! إجابات صحيحة بالكامل.</div>';
  var rev = x.questions.map(function(q,i){
    var a = st.answers[q.id];
    var your = q.type==='short' ? AJ.esc(a||'—') : ((a||[]).map(function(o){return AJ.esc(q.options[o]);}).join('، ')||'—');
    var good = q.type==='short' ? AJ.esc(q.correctText) : (q.correct||[]).map(function(o){return AJ.esc(q.options[o]);}).join('، ');
    return '<div class="card tight"><b>'+(i+1)+'. '+AJ.esc(q.question)+'</b><br>إجابتك: '+your+'<br>الصحيحة: <span class="acc">'+good+'</span>'+(q.explanation?'<br><span class="cap">💡 '+AJ.esc(q.explanation)+'</span>':'')+'</div>';
  }).join('');
  document.getElementById('view').innerHTML = '<h2 class="vt">النتيجة: '+score+' / '+total+' ('+pct+'%)</h2><div class="vsub">'+(auto?'انتهى الوقت وتم التسليم تلقائيًا':'تم التسليم')+' • '+AJ.esc(x.title)+'</div>'+weak+'<b>مراجعة الأخطاء</b><div style="margin-top:8px">'+rev+'</div><div class="btnrow"><button class="btn ghost" onclick="AJ.go(\'exams\')">رجوع</button></div>';
  AJ._exam = null;
};
/* ---------- quiz generator ---------- */
AJ.registerView('quiz', function(view){
  AJ.require('accessApp');
  var subs = AJ.db().subjects.map(function(s){return '<option value="'+s.id+'">'+AJ.esc(s.nameAr)+'</option>';}).join('');
  view.innerHTML = '<h2 class="vt">🎲 اختبار عشوائي</h2><div class="vsub">من بنك الأسئلة حسب المادة والصعوبة</div><div class="card">'
    + '<label class="f">المادة</label><select class="in" id="qz-s">'+subs+'</select>'
    + '<label class="f">الصعوبة</label><select class="in" id="qz-d"><option value="">الكل</option><option value="easy">سهلة</option><option value="medium">متوسطة</option><option value="hard">صعبة</option></select>'
    + '<label class="f">عدد الأسئلة</label><select class="in" id="qz-n"><option>5</option><option>10</option><option>15</option></select>'
    + '<div class="btnrow"><button class="btn" onclick="AJ.quizStart()">بدء الاختبار</button></div></div>';
});
AJ.quizStart = function(){
  var sid = AJ.$('#qz-s').value, dif = AJ.$('#qz-d').value, n = +AJ.$('#qz-n').value;
  var pool = AJ.db().qbank.filter(function(q){ return q.subjectId===sid && (!dif || q.difficulty===dif); });
  if(pool.length < 3){ AJ.toast('أسئلة غير كافية — سيستخدم AI توليد اختبار عند توفره'); }
  pool = pool.slice().sort(function(){return Math.random()-0.5;}).slice(0, Math.min(n, pool.length));
  if(!pool.length){ AJ.toast('لا توجد أسئلة لهذه المادة'); return; }
  var s = AJ.find('subjects', sid);
  var exam = {id:'quiz-'+Date.now(), title:'اختبار عشوائي — '+(s?s.nameAr:''), subjectId:sid, subjectName:s?s.nameAr:'', durationMin:15, questions:pool.map(function(q,i){ var c=JSON.parse(JSON.stringify(q)); c.id='qq'+i; return c; })};
  AJ.db().exams.unshift(Object.assign({description:'مولّد تلقائيًا', startsAt:Date.now(), endsAt:Date.now()+86400000, createdBy:AJ.me().id, createdAt:Date.now()}, exam));
  AJ.save();
  AJ.go('exam', exam.id);
};
AJ.exCreate = function(){ AJ.require('createExams'); AJ.toast('أنشئ الاختبار من لوحة الإدارة • المحتوى'); AJ.go('admin'); };
})();
