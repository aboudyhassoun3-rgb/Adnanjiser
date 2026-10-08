/* AJ Class A — Owner/Admin panel */
(function(){
'use strict';
try{ AJ._admTab = sessionStorage.getItem('aj_admtab') || AJ._admTab || 'dash'; }catch(e){ AJ._admTab = AJ._admTab || 'dash'; }
function guard(){
  var me = AJ.me(); if(!me){ location.hash='#/login'; return null; }
  if(!AJ.canAdmin()){ AJ.toast('لوحة الإدارة للمخولين فقط'); location.hash='#/home'; return null; }
  return me;
}
AJ.registerView('admin', function(view){
  var me = guard(); if(!me) return;
  var tabs = [['dash','📊 نظرة عامة'],['users','👥 المستخدمون'],['content','📚 المحتوى'],['ai','🤖 AI'],['bc','📣 بث إشعار'],['audit','🧾 السجلات']];
  var h = '<h2 class="vt">👑 لوحة الإدارة</h2><div class="vsub">صلاحياتك: '+AJ.esc(me.role)+'</div>';
  h += '<div class="tabs">' + tabs.map(function(t){ return '<button class="'+(AJ._admTab===t[0]?'on':'')+'" onclick="AJ.admTab(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('') + '</div><div id="adm-body"></div>';
  view.innerHTML = h;
  ({dash:admDash, users:admUsers, content:admContent, ai:admAI, bc:admBc, audit:admAudit})[AJ._admTab](AJ.$('#adm-body'), me);
});
AJ.admTab = function(t){ AJ._admTab = t; try{ sessionStorage.setItem('aj_admtab', t); }catch(e){} if(AJ.rerender) AJ.rerender(); else location.reload(); };

function admDash(box){
  var db = AJ.db();
  var on = db.users.filter(function(u){return u.online;}).length;
  function stat(ic, t, v){ return '<div class="tile"><div class="t-ic">'+ic+'</div><div class="t-t">'+v+'</div><div class="t-s">'+t+'</div></div>'; }
  box.innerHTML = '<div class="grid3">'
    + stat('👥','مستخدم', db.users.length) + stat('🟢','متصل', on) + stat('💬','رسائل', db.messages.length)
    + stat('🤖','محادثات AI', db.aiChats.length) + stat('📝','واجبات', db.homework.length) + stat('🧪','اختبارات', db.exams.length)
    + stat('📢','إعلانات', db.announcements.length) + stat('📝','نتائج', db.results.length) + stat('📚','دروس', db.lessons.length)
    + '</div><div class="card"><b>آخر النشاطات الإدارية</b>' + db.audit.slice(0,5).map(function(a){
      return '<div class="kv"><b>'+AJ.esc(a.action)+' ← '+AJ.esc(a.target||'')+'</b><span>'+AJ.esc(a.actorName)+' • '+AJ.timeAgo(a.timestamp)+'</span></div>';
    }).join('') + '</div>';
}
/* ---------- users ---------- */
function admUsers(box, me){
  var db = AJ.db();
  var canCU = AJ.hasPerm('createUsers'), canEU = AJ.hasPerm('editUsers'), canDU = AJ.hasPerm('deleteUsers');
  var h = '';
  if(canCU) h += '<div class="card"><b>＋ إنشاء مستخدم</b><div class="grid2" style="margin-top:8px">'
    + '<input class="in" id="u-name" placeholder="الاسم الكامل"><input class="in" id="u-user" placeholder="Username" style="direction:ltr">'
    + '<input class="in" id="u-email" placeholder="Email" style="direction:ltr"><input class="in" id="u-pass" placeholder="Password" style="direction:ltr"></div>'
    + '<label class="f">الدور</label><select class="in" id="u-role">' + AJ.ROLES.map(function(r){return '<option'+(r==='STUDENT'?' selected':'')+'>'+r+'</option>';}).join('') + '</select>'
    + '<div class="btnrow"><button class="btn" onclick="AJ.admUserCreate()">إنشاء الحساب</button></div></div>';
  h += db.users.map(function(u){
    return '<div class="list-item"><div class="row between"><div><div class="li-t">'+AJ.esc(u.name)+' '+(u.online?'🟢':'')+'</div><div class="li-s">@'+AJ.esc(u.username)+' • '+AJ.esc(u.role)+' • '+(!u.active||u.banned?'⛔ معطّل':'✅ نشط')+'</div></div>'
    + '<div class="row">' + (canEU?'<button class="btn small ghost" onclick="AJ.admUserEdit(\''+u.id+'\')">تعديل</button>':'')
    + (canDU&&u.id!==me.id?'<button class="btn small danger" onclick="AJ.admUserDel(\''+u.id+'\')">حذف</button>':'') + '</div></div></div>';
  }).join('');
  box.innerHTML = h;
}
AJ.admUserCreate = function(){
  AJ.require('createUsers');
  var me = AJ.me();
  var name = AJ.$('#u-name').value.trim(), un = AJ.$('#u-user').value.trim(), em = AJ.$('#u-email').value.trim(), pw = AJ.$('#u-pass').value;
  var role = AJ.$('#u-role').value;
  if(!name || !un || !em || pw.length<6){ AJ.toast('أكمل الحقول (كلمة المرور 6+)'); return; }
  if(role !== 'STUDENT' && !(AJ.hasPerm('manageAdmins') || AJ.isOwner())){ AJ.toast('تعيين المشرفين يتطلب صلاحية manageAdmins'); return; }
  var exists = AJ.db().users.filter(function(u){ return u.username.toLowerCase()===un.toLowerCase(); })[0];
  if(exists){ AJ.toast('اسم المستخدم موجود'); return; }
  AJ.db().users.push({id:AJ.uid('u'), name:name, username:un, email:em, pass:pw, role:role, active:true, banned:false,
    permissions:{}, photo:'', mustChangePassword:true, online:false, lastSeen:0, section:'A', showOnline:true, showLastSeen:true, showRead:true, createdAt:Date.now()});
  AJ.save(); AJ.audit('create_user', un); AJ.toast('تم إنشاء الحساب ✅'); location.reload();
};
AJ.admUserEdit = function(id){
  AJ.require('editUsers');
  var u = AJ.find('users', id); if(!u) return;
  var me = AJ.me();
  var canPerms = AJ.hasPerm('managePermissions') || AJ.isOwner();
  var eff = AJ.defaultsFor(u.role);
  Object.keys(u.permissions||{}).forEach(function(k){ eff[k] = u.permissions[k]; });
  var h = '<h2 class="vt">'+AJ.esc(u.name)+'</h2><div class="cap">@'+AJ.esc(u.username)+' • '+AJ.esc(u.email)+'</div>'
    + '<label class="f">الدور</label><select class="in" id="e-role">' + AJ.ROLES.map(function(r){return '<option'+(r===u.role?' selected':'')+'>'+r+'</option>';}).join('') + '</select>'
    + '<div class="swrow"><span>الحساب نشط</span><label class="sw"><input type="checkbox" id="e-active" '+(u.active?'checked':'')+'><span class="tr"></span></label></div>'
    + '<div class="swrow"><span>محظور</span><label class="sw"><input type="checkbox" id="e-ban" '+(u.banned?'checked':'')+'><span class="tr"></span></label></div>'
    + '<div class="swrow"><span>يجب تغيير كلمة المرور</span><label class="sw"><input type="checkbox" id="e-must" '+(u.mustChangePassword?'checked':'')+'><span class="tr"></span></label></div>'
    + '<label class="f">كلمة مرور جديدة (اتركها فارغة للإبقاء)</label><input class="in" id="e-pass" type="password" style="direction:ltr">';
  if(canPerms){
    h += '<label class="f">الصلاحيات (تجاوز إعدادات الدور)</label><div class="perm-grid">' + AJ.PERMS.map(function(p){
      return '<div class="swrow"><span style="font-size:12px">'+AJ.permAr(p)+'</span><label class="sw"><input type="checkbox" data-perm="'+p+'" '+(eff[p]?'checked':'')+'><span class="tr"></span></label></div>';
    }).join('') + '</div>';
  } else h += '<div class="cap">تعديل الصلاحيات يتطلب صلاحية managePermissions.</div>';
  h += '<div class="btnrow"><button class="btn" onclick="AJ.admUserSave(\''+id+'\')">حفظ</button><button class="btn ghost" onclick="AJ.closeModal()">إلغاء</button></div>';
  AJ.openModal(h);
};
AJ.admUserSave = function(id){
  var u = AJ.find('users', id); if(!u) return;
  u.role = AJ.$('#e-role').value;
  u.active = AJ.$('#e-active').checked;
  u.banned = AJ.$('#e-ban').checked;
  u.mustChangePassword = AJ.$('#e-must').checked;
  var np = AJ.$('#e-pass').value;
  if(np){ if(np.length<6){ AJ.toast('كلمة المرور 6+'); return; } u.pass = np; }
  u.permissions = u.permissions || {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-perm]'), function(c){ u.permissions[c.getAttribute('data-perm')] = c.checked; });
  AJ.save(); AJ.audit('edit_user', u.username); AJ.closeModal(); AJ.toast('تم الحفظ ✅'); location.reload();
};
AJ.admUserDel = function(id){
  AJ.require('deleteUsers');
  var u = AJ.find('users', id);
  if(!u || !confirm('حذف '+u.name+' نهائيًا؟')) return;
  var db = AJ.db();
  db.users = db.users.filter(function(x){ return x.id!==id; });
  AJ.save(); AJ.audit('delete_user', u.username); AJ.toast('تم الحذف'); location.reload();
};
/* ---------- content ---------- */
try{ AJ._ctab = sessionStorage.getItem('aj_ctab') || AJ._ctab || 'subjects'; }catch(e){ AJ._ctab = AJ._ctab || 'subjects'; }
function admContent(box, me){
  var tabs = [['subjects','المواد'],['lessons','الدروس'],['schedule','الجدول'],['exams','الاختبارات'],['library','المكتبة'],['qbank','بنك الأسئلة']];
  box.innerHTML = '<div class="tabs">' + tabs.map(function(t){ return '<button class="'+(AJ._ctab===t[0]?'on':'')+'" onclick="AJ.admCtab(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('') + '</div><div id="ct-body"></div>';
  var el = AJ.$('#ct-body');
  if(AJ._ctab==='subjects') ctSubjects(el);
  else if(AJ._ctab==='lessons') ctLessons(el);
  else if(AJ._ctab==='schedule') ctSchedule(el);
  else if(AJ._ctab==='exams') ctExams(el);
  else if(AJ._ctab==='library') ctLibrary(el);
  else ctQbank(el);
}
AJ.admCtab = function(t){ AJ._ctab = t; try{ sessionStorage.setItem('aj_ctab', t); }catch(e){} if(AJ.rerender) AJ.rerender(); else location.reload(); };
function ctSubjects(el){
  var db = AJ.db(), can = AJ.hasPerm('manageSubjects');
  var h = db.subjects.map(function(s){
    return '<div class="list-item"><div class="row between"><div><div class="li-t">'+s.icon+' '+AJ.esc(s.nameAr)+'</div><div class="li-s">'+AJ.esc(s.teacher||'')+'</div></div>'
    + (can?'<button class="btn small danger" onclick="AJ.ctSubDel(\''+s.id+'\')">حذف</button>':'') + '</div></div>';
  }).join('');
  if(can) h += '<div class="card"><b>+ مادة جديدة</b><div class="grid2" style="margin-top:8px"><input class="in" id="s-ar" placeholder="الاسم بالعربية"><input class="in" id="s-ic" placeholder="أيقونة 😀" value="📘"><input class="in" id="s-t" placeholder="الأستاذ"></div><div class="btnrow"><button class="btn" onclick="AJ.ctSubAdd()">إضافة</button></div></div>';
  el.innerHTML = h || AJ.stateEmpty('لا مواد');
}
AJ.ctSubAdd = function(){
  var db = AJ.db();
  db.subjects.push({id:AJ.uid('sub'), name:AJ.$('#s-ar').value||'Subject', nameAr:AJ.$('#s-ar').value||'مادة', icon:AJ.$('#s-ic').value||'📘', teacher:AJ.$('#s-t').value, order:db.subjects.length+1});
  AJ.save(); AJ.audit('create_subject', AJ.$('#s-ar').value); location.reload();
};
AJ.ctSubDel = function(id){ if(!confirm('حذف المادة ودروسها؟')) return; var db=AJ.db(); db.subjects=db.subjects.filter(function(s){return s.id!==id;}); db.lessons=db.lessons.filter(function(l){return l.subjectId!==id;}); AJ.save(); AJ.audit('delete_subject', id); location.reload(); };
AJ.adminAddSubject = function(){ AJ._admTab='content'; AJ._ctab='subjects'; AJ.go('admin'); setTimeout(function(){ var el=AJ.$('#s-ar'); if(el) el.focus(); }, 500); };
function ctLessons(el){
  var db = AJ.db(), can = AJ.hasPerm('manageLessons');
  var h = '<label class="f">المادة</label><select class="in" id="cl-s" onchange="try{sessionStorage.setItem('aj_clf',this.value);}catch(e){} location.reload()">' + db.subjects.map(function(s){return '<option value="'+s.id+'">'+AJ.esc(s.nameAr)+'</option>';}).join('') + '</select>';
  try{ AJ._clf = AJ._clf || sessionStorage.getItem('aj_clf'); }catch(e){} var sid = (AJ._clf) || (db.subjects[0]&&db.subjects[0].id) || '';
  h += db.lessons.filter(function(l){return l.subjectId===sid;}).map(function(l){
    return '<div class="list-item"><div class="row between"><div><div class="li-t">'+AJ.esc(l.title)+'</div></div></div><div class="btnrow"><button class="btn small ghost" onclick="AJ.go(\'lesson\',\''+l.id+'\')">عرض</button>'
    + (can?'<button class="btn small danger" onclick="AJ.ctLesDel(\''+l.id+'\')">حذف</button>':'') + '</div></div>';
  }).join('');
  if(can) h += '<div class="card"><b>+ درس جديد</b><input class="in" id="l-t" placeholder="عنوان الدرس" style="margin-top:8px"><input class="in" id="l-d" placeholder="وصف قصير"><textarea class="in" id="l-b" placeholder="نص الدرس (ادعم \\n للفقرات و • للقوائم)"></textarea><div class="btnrow"><button class="btn" onclick="AJ.ctLesAdd(\''+sid+'\')">إضافة</button></div></div>';
  el.innerHTML = h;
  var sel = AJ.$('#cl-s'); if(sel && sid) sel.value = sid;
}
AJ.ctLesAdd = function(sid){
  AJ.db().lessons.push({id:AJ.uid('l'), subjectId:sid, title:AJ.$('#l-t').value, desc:AJ.$('#l-d').value, body:AJ.$('#l-b').value, order:99, createdAt:Date.now()});
  AJ.save(); AJ.audit('create_lesson', AJ.$('#l-t').value); location.reload();
};
AJ.ctLesDel = function(id){ if(!confirm('حذف الدرس؟')) return; var db=AJ.db(); db.lessons=db.lessons.filter(function(l){return l.id!==id;}); AJ.save(); AJ.audit('delete_lesson', id); location.reload(); };
AJ.adminAddLesson = function(sid){ AJ._admTab='content'; AJ._ctab='lessons'; AJ._clf=sid; AJ.go('admin'); };
function ctSchedule(el){
  var db = AJ.db(), can = AJ.hasPerm('manageSchedule');
  var DN = {mon:'الإثنين',tue:'الثلاثاء',wed:'الأربعاء',thu:'الخميس',fri:'الجمعة'};
  var h = Object.keys(DN).map(function(d){
    var rows = db.schedule.filter(function(s){return s.day===d;}).sort(function(a,b){return a.startMin-b.startMin;});
    return '<b>'+DN[d]+'</b>' + (rows.map(function(s){
      return '<div class="list-item"><div class="row between"><div><div class="li-t">'+AJ.esc(s.subjectName)+' • '+AJ.slotLabel(s.startMin)+'-'+AJ.slotLabel(s.endMin)+'</div><div class="li-s">'+AJ.esc(s.teacher||'')+(s.room?' • '+AJ.esc(s.room):'')+'</div></div>'
      + (can?'<button class="btn small danger" onclick="AJ.ctSchDel(\''+s.id+'\')">✕</button>':'') + '</div></div>';
    }).join('') || '<div class="cap">—</div>');
  }).join('');
  if(can){
    var subs = db.subjects.map(function(s){return '<option value="'+s.id+'|'+AJ.esc(s.nameAr)+'">'+AJ.esc(s.nameAr)+'</option>';}).join('');
    h += '<div class="card"><b>+ حصة</b><div class="grid2" style="margin-top:8px"><select class="in" id="sc-d"><option value="mon">الإثنين</option><option value="tue">الثلاثاء</option><option value="wed">الأربعاء</option><option value="thu">الخميس</option><option value="fri">الجمعة</option></select>'
    + '<select class="in" id="sc-s">'+subs+'</select><input class="in" id="sc-b" type="time" value="08:00"><input class="in" id="sc-e" type="time" value="09:30"><input class="in" id="sc-t" placeholder="الأستاذ"><input class="in" id="sc-r" placeholder="القاعة"></div>'
    + '<div class="btnrow"><button class="btn" onclick="AJ.ctSchAdd()">إضافة + إشعار</button></div></div>';
  }
  el.innerHTML = h;
}
function toMin(t){ var p=t.split(':'); return (+p[0])*60+(+p[1]); }
AJ.ctSchAdd = function(){
  var sp = AJ.$('#sc-s').value.split('|');
  var s = {id:AJ.uid('sc'), day:AJ.$('#sc-d').value, startMin:toMin(AJ.$('#sc-b').value), endMin:toMin(AJ.$('#sc-e').value),
    subjectId:sp[0], subjectName:sp[1], teacher:AJ.$('#sc-t').value, room:AJ.$('#sc-r').value};
  AJ.db().schedule.push(s); AJ.save();
  AJ.notifyAll({kind:'schedule', title:'🗓 تعديل في الجدول', body:s.subjectName+' • '+AJ.slotLabel(s.startMin), route:'calendar'});
  AJ.audit('update_schedule', s.subjectName); location.reload();
};
AJ.ctSchDel = function(id){ var db=AJ.db(); db.schedule=db.schedule.filter(function(s){return s.id!==id;}); AJ.save(); AJ.audit('delete_schedule', id); AJ.notifyAll({kind:'schedule', title:'🗓 تعديل في الجدول', body:'تم حذف حصة', route:'calendar'}); location.reload(); };
AJ._exQs = [];
function ctExams(el){
  var db = AJ.db(), can = AJ.hasPerm('createExams');
  var h = db.exams.map(function(x){
    return '<div class="list-item"><div class="row between"><div><div class="li-t">'+AJ.esc(x.title)+'</div><div class="li-s">'+x.questions.length+' أسئلة</div></div></div><div class="btnrow"><button class="btn small ghost" onclick="AJ.go(\'exam\',\''+x.id+'\')">عرض</button>'
    + (can?'<button class="btn small danger" onclick="AJ.ctExDel(\''+x.id+'\')">حذف</button>':'') + '</div></div>';
  }).join('');
  if(can) h += '<div class="card"><b>+ اختبار جديد</b><input class="in" id="ex-t" placeholder="عنوان الاختبار" style="margin-top:8px">'
    + '<div class="grid2"><select class="in" id="ex-s">'+db.subjects.map(function(s){return '<option value="'+s.id+'|'+AJ.esc(s.nameAr)+'">'+AJ.esc(s.nameAr)+'</option>';}).join('')+'</select>'
    + '<select class="in" id="ex-dur"><option value="10">10 دقائق</option><option value="20" selected>20 دقيقة</option><option value="30">30 دقيقة</option></select></div>'
    + '<div id="ex-qs" style="margin-top:8px"></div>'
    + '<div class="btnrow"><button class="btn ghost small" onclick="AJ.exQAdd()">+ سؤال</button><button class="btn small" onclick="AJ.ctExSave()">نشر الاختبار</button></div></div>';
  el.innerHTML = h;
  if(can && !AJ._exQs.length) AJ.exQAdd(); else AJ.exQRender();
}
AJ.exQAdd = function(){ AJ._exQs.push({type:'mcq', q:'', opts:'', correct:'0', pts:2, diff:'medium', expl:''}); AJ.exQRender(); };
AJ.exQRender = function(){
  var box = AJ.$('#ex-qs'); if(!box) return;
  box.innerHTML = AJ._exQs.map(function(q, i){
    return '<div class="card tight"><b>سؤال '+(i+1)+'</b><select class="in" onchange="AJ._exQs['+i+'].type=this.value"><option value="mcq">اختيار متعدد</option><option value="tf">صح/خطأ</option><option value="short">إجابة قصيرة</option></select>'
    + '<input class="in" placeholder="نص السؤال" value="'+AJ.esc(q.q)+'" oninput="AJ._exQs['+i+'].q=this.value">'
    + '<input class="in" placeholder="الخيارات مفصولة بـ | (لـ mcq)" value="'+AJ.esc(q.opts)+'" oninput="AJ._exQs['+i+'].opts=this.value">'
    + '<div class="grid2"><input class="in" placeholder="رقم الإجابة الصحيحة (0..)" value="'+AJ.esc(q.correct)+'" oninput="AJ._exQs['+i+'].correct=this.value"><input class="in" placeholder="الشرح" value="'+AJ.esc(q.expl)+'" oninput="AJ._exQs['+i+'].expl=this.value"></div></div>';
  }).join('');
};
AJ.ctExSave = function(){
  var sp = AJ.$('#ex-s').value.split('|');
  var qs = AJ._exQs.filter(function(q){return q.q.trim();}).map(function(q, i){
    var opts = q.type==='tf' ? ['صح','خطأ'] : q.opts.split('|').map(function(o){return o.trim();}).filter(Boolean);
    return {id:'q'+i+'-'+Date.now(), type:q.type, difficulty:q.diff, points:2, question:q.q, options:opts,
      correct: q.type==='short' ? [] : [+q.correct||0], correctText: q.type==='short' ? q.opts : '', explanation:q.expl};
  });
  if(!qs.length){ AJ.toast('أضف سؤالًا واحدًا على الأقل'); return; }
  AJ.db().exams.unshift({id:AJ.uid('ex'), title:AJ.$('#ex-t').value||'اختبار جديد', subjectId:sp[0], subjectName:sp[1],
    description:'', durationMin:+AJ.$('#ex-dur').value, startsAt:Date.now(), endsAt:Date.now()+7*86400000, createdBy:AJ.me().id, createdAt:Date.now(), questions:qs});
  AJ._exQs = []; AJ.save();
  AJ.notifyAll({kind:'exam', title:'🧪 اختبار جديد', body:AJ.$('#ex-t').value, route:'exams'});
  AJ.audit('create_exam', AJ.$('#ex-t').value); AJ.toast('تم النشر ✅'); location.reload();
};
AJ.ctExDel = function(id){ if(!confirm('حذف الاختبار؟')) return; var db=AJ.db(); db.exams=db.exams.filter(function(x){return x.id!==id;}); AJ.save(); AJ.audit('delete_exam', id); location.reload(); };
function ctLibrary(el){
  var db = AJ.db(), can = AJ.hasPerm('uploadFiles');
  var h = db.library.map(function(f){
    return '<div class="list-item"><div class="row between"><div><div class="li-t">📄 '+AJ.esc(f.title)+'</div><div class="li-s">'+AJ.esc(f.subjectName)+'</div></div>'
    + (can?'<button class="btn small danger" onclick="AJ.ctLibDel(\''+f.id+'\')">حذف</button>':'') + '</div></div>';
  }).join('');
  if(can) h += '<div class="card"><b>+ ملف (رابط أو درس داخلي)</b><div class="grid2" style="margin-top:8px"><select class="in" id="lb-s">'+db.subjects.map(function(s){return '<option value="'+s.id+'|'+AJ.esc(s.nameAr)+'">'+AJ.esc(s.nameAr)+'</option>';}).join('')+'</select>'
    + '<input class="in" id="lb-t" placeholder="عنوان الملف"></div><input class="in" id="lb-u" placeholder="رابط URL (اتركه فارغًا للربط بدرس)" style="direction:ltr">'
    + '<div class="btnrow"><button class="btn" onclick="AJ.ctLibAdd()">إضافة</button></div></div>';
  el.innerHTML = h;
}
AJ.ctLibAdd = function(){
  var sp = AJ.$('#lb-s').value.split('|');
  AJ.db().library.unshift({id:AJ.uid('lb'), subjectId:sp[0], subjectName:sp[1], title:AJ.$('#lb-t').value, kind:AJ.$('#lb-u').value?'url':'note', url:AJ.$('#lb-u').value, refId:'', term:'', createdAt:Date.now()});
  AJ.save(); AJ.audit('add_library', AJ.$('#lb-t').value); location.reload();
};
AJ.ctLibDel = function(id){ var db=AJ.db(); db.library=db.library.filter(function(f){return f.id!==id;}); AJ.save(); location.reload(); };
function ctQbank(el){
  var db = AJ.db(), can = AJ.hasPerm('createExams');
  var h = db.qbank.map(function(q){
    var s = AJ.find('subjects', q.subjectId)||{};
    return '<div class="list-item"><div class="row between"><div><div class="li-t">'+AJ.esc(q.question)+'</div><div class="li-s">'+AJ.esc(s.nameAr||'')+' • '+AJ.esc(q.difficulty||'')+'</div></div>'
    + (can?'<button class="btn small danger" onclick="AJ.ctQbDel(\''+q.id+'\')">حذف</button>':'') + '</div></div>';
  }).join('');
  if(can) h += '<div class="card"><b>+ سؤال للبنك</b><div class="grid2" style="margin-top:8px"><select class="in" id="qb-s">'+db.subjects.map(function(s){return '<option value="'+s.id+'">'+AJ.esc(s.nameAr)+'</option>';}).join('')+'</select>'
    + '<select class="in" id="qb-d"><option value="easy">سهلة</option><option value="medium" selected>متوسطة</option><option value="hard">صعبة</option></select></div>'
    + '<input class="in" id="qb-q" placeholder="نص السؤال"><input class="in" id="qb-o" placeholder="الخيارات مفصولة بـ |"><input class="in" id="qb-c" placeholder="رقم الإجابة الصحيحة (0..)">'
    + '<div class="btnrow"><button class="btn" onclick="AJ.ctQbAdd()">إضافة</button></div></div>';
  el.innerHTML = h;
}
AJ.ctQbAdd = function(){
  AJ.db().qbank.unshift({id:AJ.uid('qb'), subjectId:AJ.$('#qb-s').value, difficulty:AJ.$('#qb-d').value, type:'mcq',
    question:AJ.$('#qb-q').value, options:AJ.$('#qb-o').value.split('|').map(function(o){return o.trim();}), correct:[+AJ.$('#qb-c').value||0], explanation:''});
  AJ.save(); location.reload();
};
AJ.ctQbDel = function(id){ var db=AJ.db(); db.qbank=db.qbank.filter(function(q){return q.id!==id;}); AJ.save(); location.reload(); };
/* ---------- AI settings ---------- */
function admAI(box, me){
  var st = AJ.db().settings;
  var can = AJ.hasPerm('manageAI') || AJ.isOwner();
  var key = ''; try{ key = localStorage.getItem('aj_proxy_key') || ''; }catch(e){}
  box.innerHTML = '<div class="card"><b>🤖 إعدادات AI</b><div class="cap">المفتاح لا يُخزن في الكود أبدًا — عبر Proxy فقط.</div>'
    + (can
      ? '<label class="f">AI API URL</label><input class="in" id="ai-url" value="'+AJ.esc(st.aiUrl||'')+'" style="direction:ltr" placeholder="https://…">'
       + '<label class="f">Model</label><input class="in" id="ai-model" value="'+AJ.esc(st.aiModel||'')+'" style="direction:ltr">'
       + '<label class="f">System Prompt</label><textarea class="in" id="ai-sys">'+AJ.esc(st.systemPrompt||'')+'</textarea>'
       + '<label class="f">Proxy Key (اختياري — يُحفظ في جهازك فقط)</label><input class="in" id="ai-key" type="password" value="'+AJ.esc(key)+'" style="direction:ltr">'
       + '<div class="btnrow"><button class="btn" onclick="AJ.admAiSave()">حفظ</button><button class="btn ghost" onclick="AJ.admAiTest()">اختبار الاتصال</button></div><div id="ai-test" style="margin-top:8px"></div>'
      : '<div class="cap">إدارة AI للمالك فقط.</div>') + '</div>';
}
AJ.admAiSave = function(){
  var st = AJ.db().settings;
  st.aiUrl = AJ.$('#ai-url').value.trim(); st.aiModel = AJ.$('#ai-model').value.trim() || 'aj-tutor-1'; st.systemPrompt = AJ.$('#ai-sys').value;
  try{ localStorage.setItem('aj_proxy_key', AJ.$('#ai-key').value); }catch(e){}
  AJ.save(); AJ.audit('update_ai_settings', st.aiUrl); AJ.toast('تم الحفظ ✅');
};
AJ.admAiTest = function(){
  AJ.$('#ai-test').innerHTML = '<div class="skel"></div>';
  AJ.aiSend([{role:'system', content:'أجب بكلمة واحدة.'},{role:'user', content:'قل: يعمل'}], 20).then(function(r){
    AJ.$('#ai-test').innerHTML = '<div class="card tight">✅ الاتصال يعمل — الرد: '+AJ.esc(r.text).slice(0,100)+'</div>';
  }).catch(function(){ AJ.$('#ai-test').innerHTML = '<div class="err">تعذر الاتصال — تحقق من الرابط.</div>'; });
};
/* ---------- broadcast ---------- */
function admBc(box){
  if(!AJ.hasPerm('sendNotifications')){ box.innerHTML = '<div class="err">تحتاج صلاحية sendNotifications.</div>'; return; }
  box.innerHTML = '<div class="card"><b>📣 بث إشعار للجميع</b><input class="in" id="bc-t" placeholder="العنوان" style="margin-top:8px"><textarea class="in" id="bc-b" placeholder="النص"></textarea><div class="btnrow"><button class="btn" onclick="AJ.admBcGo()">إرسال</button></div></div>';
}
AJ.admBcGo = function(){
  AJ.notifyAll({kind:'admin', title:AJ.$('#bc-t').value||'إشعار إداري', body:AJ.$('#bc-b').value, route:'announcements'});
  AJ.audit('broadcast', AJ.$('#bc-t').value); AJ.toast('تم البث 📣'); location.reload();
};
/* ---------- audit ---------- */
function admAudit(box){
  var list = AJ.db().audit.slice(0,100);
  box.innerHTML = list.map(function(a){
    return '<div class="kv"><b>'+AJ.esc(a.action)+' ← '+AJ.esc(a.target||'')+'</b><span>'+AJ.esc(a.actorName)+' • '+AJ.timeAgo(a.timestamp)+'</span></div>';
  }).join('') || AJ.stateEmpty('لا سجلات');
}
})();
