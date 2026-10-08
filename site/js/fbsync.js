/* AJ Class A — optional Firebase sync (same Firestore collections as the Android app).
   Works only if site/firebase-config.json exists. All failures are silent-safe: the app keeps working locally. */
(function(){
'use strict';
AJ._fb = null;
function loadScript(src){
  return new Promise(function(res, rej){
    var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
AJ.fbStatus = function(){
  AJ.openModal('<h2 class="vt">☁ Firebase</h2><div class="cap">المزامنة السحابية اختيارية — التطبيق يعمل محليًا بالكامل.</div>'
    + '<div id="fb-box" style="margin-top:10px"><div class="skel"></div></div>'
    + '<div class="btnrow"><button class="btn ghost" onclick="AJ.closeModal()">إغلاق</button></div>');
  fetch('firebase-config.json').then(function(r){
    if(!r.ok) throw new Error('no-config');
    return r.json();
  }).then(function(cfg){
    if(!cfg.apiKey || cfg.apiKey === 'REPLACE_ME') throw new Error('placeholder');
    AJ.$('#fb-box').innerHTML = '<div class="card tight">تم العثور على الإعداد ✅<br><span class="cap">المشروع: '+AJ.esc(cfg.projectId||'')+'</span></div>'
      + '<div class="btnrow"><button class="btn" onclick="AJ.fbConnect()">اتصال ومزامنة</button></div><div id="fb-log"></div>';
    AJ._fbCfg = cfg;
  }).catch(function(){
    AJ.$('#fb-box').innerHTML = '<div class="card tight">لا يوجد <b>firebase-config.json</b> مفعّل.<br><span class="cap">انسخ firebase-config.example.json إلى firebase-config.json وضع قيم مشروعك، ثم أعد التحميل. نفس مجموعات Firestore المستعملة في تطبيق Android (users, announcements, settings, communityMessages…).</span></div>';
  });
};
AJ.fbConnect = function(){
  var cfg = AJ._fbCfg; if(!cfg) return;
  var log = AJ.$('#fb-log');
  function say(t){ if(log) log.innerHTML += '<div class="cap">'+AJ.esc(t)+'</div>'; }
  say('تحميل مكتبات Firebase…');
  loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
    .then(function(){ return loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'); })
    .then(function(){
      if(!AJ._fb){
        var app = firebase.initializeApp(cfg);
        AJ._fb = firebase.firestore();
        try{ AJ._fb.settings({cacheSizeBytes: 100*1024*1024}); }catch(e){}
      }
      var db = AJ._fb;
      say('متصل ✅ — مزامنة الإعلانات وإعدادات AI…');
      db.collection('announcements').orderBy('createdAt','desc').limit(20).get().then(function(snap){
        var local = AJ.db(), added = 0;
        snap.forEach(function(d){
          var a = d.data()||{}; a.id = d.id;
          if(!local.announcements.filter(function(x){return x.id===a.id;})[0]){ local.announcements.unshift(a); added++; }
        });
        AJ.save(); say('إعلانات جديدة من السحابة: '+added);
      }).catch(function(){ say('تعذر قراءة الإعلانات (تحقق من القواعد).'); });
      db.collection('settings').doc('ai').get().then(function(d){
        if(d.exists){
          var r = d.data()||{}, st = AJ.db().settings;
          if(r.url) st.aiUrl = r.url;
          if(r.model) st.aiModel = r.model;
          if(r.systemPrompt) st.systemPrompt = r.systemPrompt;
          AJ.save(); say('تم تحديث إعدادات AI من السحابة ✅');
        } else say('لا يوجد مستند settings/ai بعد.');
      }).catch(function(){ say('تعذر قراءة settings/ai.'); });
      AJ.audit('firebase_sync', cfg.projectId||'');
    })
    .catch(function(){ say('تعذر الاتصال — تحقق من الإنترنت والإعداد.'); });
};
})();
