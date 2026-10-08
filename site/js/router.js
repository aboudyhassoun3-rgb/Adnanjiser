/* AJ Class A — router + app shell */
(function(){
'use strict';
var TABS = [
  {r:'home', t:'الرئيسية', ic:'🏠'},
  {r:'study', t:'الدراسة', ic:'📚'},
  {r:'ai', t:'AI', ic:'🤖'},
  {r:'community', t:'المجتمع', ic:'💬'},
  {r:'profile', t:'حسابي', ic:'👤'}
];
var TITLES = {home:'AJ Class A', study:'الدراسة', ai:'AJ AI', community:'Class A', profile:'حسابي',
  homework:'الواجبات', exams:'الاختبارات', quiz:'بنك الأسئلة', notes:'المفكرة', calendar:'التقويم',
  library:'المكتبة', announcements:'الإعلانات', notifications:'الإشعارات', tools:'أدوات الدراسة',
  admin:'لوحة الإدارة', settings:'الإعدادات', search:'البحث', saved:'المحفوظات', daily:'تحدي اليوم',
  subject:'المادة', lesson:'الدرس', exam:'الاختبار', aichat:'محادثة AI', login:'تسجيل الدخول'};
var NOTABS = {subject:1, lesson:1, exam:1, aichat:1, login:1};

function topbar(route, param){
  var me = AJ.me();
  var back = (NOTABS[route] && !(route==='login' && !me)) ? '<button class="ibtn" onclick="history.back()" aria-label="رجوع">→</button>' : '';
  var unread = me ? AJ.db().notifications.filter(function(x){ return x.userId===me.id && !x.read; }).length : 0;
  var bell = me ? '<button class="ibtn badge" onclick="AJ.go(\'notifications\')" aria-label="إشعارات">🔔<span class="bdg" id="ntf-badge" data-badge style="display:'+(unread?'flex':'none')+'">'+(unread||'')+'</span></button>'
    + '<button class="ibtn" onclick="AJ.go(\'search\')" aria-label="بحث">🔍</button>' : '';
  var sub = me ? '<div class="tb-sub">'+AJ.esc(me.name)+' • '+AJ.esc(me.role)+'</div>' : '';
  AJ.$('#topbar').innerHTML = back + '<div class="grow"><div class="tb-title">'+AJ.esc(TITLES[route]||'AJ Class A')+'</div>'+sub+'</div>' + bell;
}
function bottomnav(route){
  var nav = AJ.$('#bottomnav');
  if(NOTABS[route]){ nav.innerHTML=''; nav.style.display='none'; AJ.$('#fab-ai').style.display='none'; return; }
  nav.style.display='flex'; AJ.$('#fab-ai').style.display='';
  nav.innerHTML = TABS.map(function(t){
    return '<button class="'+(t.r===route?'on':'')+'" onclick="AJ.go(\''+t.r+'\')"><span class="ic">'+t.ic+'</span>'+t.t+'</button>';
  }).join('');
}
AJ.go = function(route, param){
  location.hash = '#/' + route + (param ? '/' + encodeURIComponent(param) : '');
};
function parseHash(){
  var h = (location.hash||'').replace(/^#\/?/, '');
  var parts = h.split('/');
  return {route: parts[0]||'home', param: parts[1] ? decodeURIComponent(parts[1]) : ''};
}
var PUBLIC = {login:1};
function render(){
  var p = parseHash(), route = p.route || 'home', param = p.param;
  var me = AJ.me();
  if(!me && !PUBLIC[route]){ location.hash = '#/login'; return; }
  if(me && route==='login'){ location.hash = '#/home'; return; }
  var view = AJ.$('#view');
  try {
    var fn = AJ.views && AJ.views[route];
    if(!fn){ route='home'; fn = AJ.views.home; }
    topbar(route, param); bottomnav(route);
    view.innerHTML = '';
    fn(view, param);
    window.scrollTo(0,0);
    AJ.updateBadge();
  } catch(err){
    if(err && (err.message==='auth' || err.message==='perm')) return;
    view.innerHTML = '<div class="err">حدث خطأ. حاول مرة أخرى.</div><div class="btnrow"><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div>';
  }
}
window.addEventListener('hashchange', render);
AJ.rerender = render;
window.addEventListener('hashchange', function(){
  try{ if(AJ._exam && AJ._exam.timer){ clearInterval(AJ._exam.timer); AJ._exam.timer = null; } }catch(e){}
});

AJ.boot = function(){
  AJ.applyTheme();
  var d = AJ.dailyContent();
  AJ.$('#spKind').textContent = d.label;
  AJ.$('#spVerse').textContent = d.text;
  AJ.$('#spSrc').textContent = d.source;
  AJ.db();
  AJ.$('#fab-ai').addEventListener('click', function(){ AJ.go('ai'); });
  window.addEventListener('online', AJ.netBar);
  window.addEventListener('offline', AJ.netBar);
  AJ.netBar();
  setTimeout(function(){
    AJ.$('#splash').classList.add('gone');
    AJ.$('#app').classList.remove('hidden');
    if(!location.hash) location.hash = AJ.me() ? '#/home' : '#/login';
    render();
    setTimeout(function(){ var s=AJ.$('#splash'); if(s) s.remove(); }, 600);
  }, 2000);
};
AJ.netBar = function(){
  var off = !navigator.onLine;
  AJ.$('#offlinebar').classList.toggle('hidden', !off);
};
AJ.views = AJ.views || {};
AJ.registerView = function(name, fn){ AJ.views[name] = fn; };
/* login + shared states */
AJ.registerView('login', function(view){
  var remembered = '';
  try{ remembered = localStorage.getItem('aj_remember') ? (JSON.parse(localStorage.getItem(AJ.DBKEY||'ajdb_v1')||'{}').users||[]).length : 0; }catch(e){}
  view.innerHTML =
    '<h2 class="vt">تسجيل الدخول</h2><div class="vsub">مرحباً بعودتك إلى شعبة A — الحسابات ينشئها المسؤول</div>' +
    '<div class="card"><form id="login-f">' +
    '<label class="f">Username</label><input class="in" id="lg-u" autocomplete="username" />' +
    '<label class="f">Password</label><input class="in" id="lg-p" type="password" autocomplete="current-password" />' +
    '<div class="row" style="margin-top:10px"><input type="checkbox" id="lg-r" style="width:20px;height:20px" /><label for="lg-r" style="font-size:13px;color:var(--sub)">تذكرني</label></div>' +
    '<div class="err hidden" id="lg-e" style="margin-top:10px"></div>' +
    '<div class="btnrow"><button class="btn" type="submit">دخول</button></div></form></div>' +
    '<div class="card"><div class="cap" style="margin-bottom:8px">حسابات تجريبية (اضغط للتعبئة):</div>' +
    '<div class="btnrow" style="margin-top:0">' +
    '<button class="btn ghost small" data-fill="owner|AjOwner123">👑 owner</button>' +
    '<button class="btn ghost small" data-fill="mohamed|Student123">🎒 mohamed</button>' +
    '<button class="btn ghost small" data-fill="teacher|Teacher123">👨‍🏫 teacher</button>' +
    '</div><div class="cap" style="margin-top:8px">Owner: aboudyhassoun3@gmail.com</div></div>';
  AJ.$$('#login-f').length;
  AJ.$('#login-f').addEventListener('submit', function(e){
    e.preventDefault();
    var r = AJ.login(AJ.$('#lg-u').value, AJ.$('#lg-p').value);
    if(r.error){ var el=AJ.$('#lg-e'); el.textContent=r.error; el.classList.remove('hidden'); return; }
    AJ.setSession(r.user.id, AJ.$('#lg-r').checked);
    if(r.user.mustChangePassword){ AJ.toast('يجب تغيير كلمة المرور أولاً'); location.hash='#/settings'; }
    else location.hash = '#/home';
  });
  AJ.$('[data-fill]').forEach ? null : null;
  Array.prototype.forEach.call(view.querySelectorAll('[data-fill]'), function(b){
    b.addEventListener('click', function(){
      var p = b.getAttribute('data-fill').split('|');
      AJ.$('#lg-u').value = p[0]; AJ.$('#lg-p').value = p[1]; AJ.$('#lg-r').checked = true;
    });
  });
});
AJ.stateLoading = function(msg){ return '<div class="skel"></div><div class="skel"></div><div class="skel" style="width:60%"></div>'; };
AJ.stateEmpty = function(msg, btn){ return '<div class="state"><div class="big">📭</div><p>'+AJ.esc(msg||'لا عناصر بعد')+'</p>'+(btn||'')+'</div>'; };
})();
