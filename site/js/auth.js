/* AJ Class A — auth, roles, permissions */
(function(){
'use strict';
var ROLES = ['OWNER','SUPER_ADMIN','ADMIN','MODERATOR','TEACHER','STUDENT'];
AJ.ROLES = ROLES;
var PERMS = ['accessApp','useAI','useCameraAI','useChat','sendMessages','sendImages','sendFiles',
 'createNotes','createHomework','createExams','uploadFiles','manageStudents','createUsers','editUsers',
 'deleteUsers','manageSchedule','manageSubjects','manageLessons','manageAnnouncements','sendNotifications',
 'moderateChat','deleteMessages','manageAI','accessAdminPanel','manageAdmins','managePermissions','manageSettings'];
AJ.PERMS = PERMS;
var PERM_AR = {accessApp:'دخول التطبيق',useAI:'استخدام AI',useCameraAI:'حل بالكاميرا',useChat:'الدردشة',
 sendMessages:'إرسال رسائل',sendImages:'إرسال صور',sendFiles:'إرسال ملفات',createNotes:'المفكرة',
 createHomework:'إنشاء واجبات',createExams:'إنشاء اختبارات',uploadFiles:'رفع ملفات',manageStudents:'إدارة الطلاب',
 createUsers:'إنشاء مستخدمين',editUsers:'تعديل المستخدمين',deleteUsers:'حذف المستخدمين',manageSchedule:'إدارة الجدول',
 manageSubjects:'إدارة المواد',manageLessons:'إدارة الدروس',manageAnnouncements:'إدارة الإعلانات',
 sendNotifications:'إرسال إشعارات',moderateChat:'إشراف الدردشة',deleteMessages:'حذف الرسائل',manageAI:'إدارة AI',
 accessAdminPanel:'لوحة الإدارة',manageAdmins:'إدارة المشرفين',managePermissions:'إدارة الصلاحيات',manageSettings:'إدارة الإعدادات'};
AJ.permAr = function(p){ return PERM_AR[p] || p; };

function defaultsFor(role){
  var all = {}, i;
  function base(list){ var m={}; PERMS.forEach(function(p){ m[p]=false; }); list.forEach(function(p){ m[p]=true; }); return m; }
  if (role==='OWNER' || role==='SUPER_ADMIN'){ PERMS.forEach(function(p){ all[p]=true; }); if(role==='SUPER_ADMIN') all.manageAdmins=false; return all; }
  if (role==='ADMIN') return base(['accessApp','useAI','useCameraAI','useChat','sendMessages','sendImages','sendFiles','createNotes','createHomework','createExams','uploadFiles','manageStudents','manageSchedule','manageSubjects','manageLessons','manageAnnouncements','sendNotifications','moderateChat','deleteMessages','accessAdminPanel']);
  if (role==='MODERATOR') return base(['accessApp','useAI','useChat','sendMessages','sendImages','moderateChat','deleteMessages']);
  if (role==='TEACHER') return base(['accessApp','useAI','useCameraAI','useChat','sendMessages','sendImages','sendFiles','createNotes','createHomework','createExams','uploadFiles','manageLessons']);
  return base(['accessApp','useAI','useCameraAI','useChat','sendMessages','sendImages','sendFiles','createNotes']);
}
AJ.defaultsFor = defaultsFor;

AJ.me = function(){
  try {
    var id = sessionStorage.getItem('aj_session') || localStorage.getItem('aj_session');
    if(!id) return null;
    var u = AJ.find('users', id);
    if(!u || !u.active || u.banned) return null;
    return u;
  } catch(e){ return null; }
};
AJ.hasPerm = function(key, user){
  var u = user || AJ.me();
  if(!u) return false;
  if(u.role==='OWNER' || (u.email||'').toLowerCase()==='aboudyhassoun3@gmail.com') return true;
  if(u.permissions && (key in u.permissions)) return !!u.permissions[key];
  return !!defaultsFor(u.role)[key];
};
AJ.isOwner = function(u){ u = u || AJ.me(); return !!u && (u.role==='OWNER' || (u.email||'').toLowerCase()==='aboudyhassoun3@gmail.com'); };
AJ.canAdmin = function(u){ return AJ.isOwner(u) || AJ.hasPerm('accessAdminPanel', u); };
AJ.require = function(key){
  if(!AJ.me()){ location.hash='#/login'; throw new Error('auth'); }
  if(!AJ.hasPerm(key)){ AJ.toast('لا تملك هذه الصلاحية'); location.hash='#/home'; throw new Error('perm'); }
};

AJ.login = function(username, password){
  username = (username||'').trim();
  var users = AJ.db().users;
  var u = null;
  for (var i=0;i<users.length;i++) if(users[i].username.toLowerCase()===username.toLowerCase()){ u = users[i]; break; }
  if(!u || u.pass !== password) return {error:'بيانات الدخول غير صحيحة'};
  if(!u.active || u.banned) return {error:'الحساب معطّل. تواصل مع الإدارة.'};
  u.online = true; u.lastSeen = Date.now(); AJ.save();
  return {user:u};
};
AJ.setSession = function(id, remember){
  try {
    sessionStorage.setItem('aj_session', id);
    if (remember) localStorage.setItem('aj_session', id); else localStorage.removeItem('aj_session');
    if (remember) localStorage.setItem('aj_remember', '1'); else localStorage.removeItem('aj_remember');
  } catch(e){}
};
AJ.logout = function(){
  var me = AJ.me();
  if(me){ me.online=false; me.lastSeen=Date.now(); AJ.save(); }
  try{ sessionStorage.removeItem('aj_session'); localStorage.removeItem('aj_session'); }catch(e){}
  location.hash = '#/login';
};
AJ.heartbeat = function(){
  var me = AJ.me(); if(!me) return;
  me.online = true; me.lastSeen = Date.now(); AJ.save();
};
setInterval(function(){ try{ AJ.heartbeat(); }catch(e){} }, 60000);
window.addEventListener('beforeunload', function(){
  try{ var id = sessionStorage.getItem('aj_session') || localStorage.getItem('aj_session');
    var u = id && AJ.find('users', id); if(u){ u.online=false; u.lastSeen=Date.now(); AJ.save(); } }catch(e){}
});
})();
