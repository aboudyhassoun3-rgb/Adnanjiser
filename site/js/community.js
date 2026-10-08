/* AJ Class A — Class A community chat */
(function(){
'use strict';
var EMOJIS = ['👍','❤️','😂','😮','😢','🔥'];
AJ._reply = null;

function visibleName(u){ return u ? (u.name||u.username) : 'مستخدم'; }
function canModerate(me){ return AJ.hasPerm('moderateChat', me) || AJ.hasPerm('deleteMessages', me); }

AJ.registerView('community', function(view){
  AJ.require('useChat');
  var me = AJ.me(), db = AJ.db();
  var online = db.users.filter(function(u){ return u.online && u.active && !u.banned && u.showOnline; });
  var pinned = db.messages.filter(function(m){ return m.pinned && !m.deleted; }).slice(-3);
  var msgs = db.messages.filter(function(m){ return !m.deleted; }).slice(-60);
  // receipts: delivered always; read if my privacy allows
  var changed = false;
  msgs.forEach(function(m){
    if(m.senderId === me.id) return;
    if(m.deliveredTo.indexOf(me.id)<0){ m.deliveredTo.push(me.id); changed = true; }
    if(me.showRead && m.readBy.indexOf(me.id)<0){ m.readBy.push(me.id); changed = true; }
  });
  if(changed) AJ.save();
  var h = '<div class="row between"><div><b style="font-size:19px">Class A 💬</b><div class="cap" style="cursor:pointer" onclick="AJ.onlineList()">🟢 '+online.length+' متصل الآن</div></div>'
    + '<button class="ibtn" onclick="AJ.go(\'search\')">🔍</button></div>';
  if(pinned.length) h += '<div class="card tight"><b>📌 المثبت</b>' + pinned.map(function(m){ return '<div class="cap">'+AJ.esc(m.text).slice(0,80)+'</div>'; }).join('') + '</div>';
  h += '<div id="msg-list">';
  msgs.forEach(function(m){ h += msgHtml(m, me); });
  h += '</div>';
  var canSend = AJ.hasPerm('sendMessages');
  h += '<div id="reply-bar"></div>';
  h += '<div class="composer"><button class="ibtn" onclick="AJ.msgAttach()" title="إرفاق صورة">＋</button>'
    + '<input id="cm-in" placeholder="اكتب رسالة… (جرّب @everyone)" '+(canSend?'':'disabled')+' onkeydown="if(event.key===\'Enter\')AJ.msgSend()">'
    + '<button class="ibtn" onclick="AJ.msgMic()" title="إملاء صوتي">🎤</button>'
    + '<button class="ibtn" onclick="AJ.msgSend()" title="إرسال">📨</button></div>'
    + '<input type="file" id="cm-file" accept="image/*" class="hidden">';
  view.innerHTML = h;
  renderReplyBar();
  var list = AJ.$('#msg-list');
  if(list) list.scrollIntoView({block:'end'});
  window.scrollTo(0, document.body.scrollHeight);
  var fi = AJ.$('#cm-file');
  if(fi) fi.addEventListener('change', function(){ AJ.msgFileGo(fi); });
});
function msgHtml(m, me){
  var mine = m.senderId === me.id;
  var txt = AJ.esc(m.text).replace(/@(\S+)/g, '<b class="acc">@$1</b>');
  var h = '<div class="msg'+(mine?' me':'')+'">';
  h += '<div class="m-name">'+AJ.esc(m.senderName)+'</div>';
  h += '<div class="m-b">';
  if(m.replyTo) h += '<div class="m-reply">↩ '+AJ.esc(m.replyTo.text||'').slice(0,80)+'</div>';
  (m.attachments||[]).forEach(function(a){ h += '<img class="m-img" src="'+a+'" loading="lazy">'; });
  if(m.text) h += '<div>'+txt+'</div>';
  h += '</div><div class="m-meta"><span>'+AJ.fmtTime(m.timestamp)+'</span>';
  if(mine) h += '<span class="acc">'+(m.readBy.length?'✓✓ تمت القراءة':(m.deliveredTo.length?'✓✓ تم التسليم':'✓ تم الإرسال'))+'</span>';
  h += '<button class="ibtn" style="width:auto;height:auto;font-size:12px" onclick="AJ.msgReactBox(\''+m.id+'\')">😊</button>';
  h += '<button class="ibtn" style="width:auto;height:auto;font-size:12px" onclick="AJ.setReply(\''+m.id+'\')">↩</button>';
  if(mine || canModerate(me)) h += '<button class="ibtn" style="width:auto;height:auto;font-size:12px" onclick="AJ.msgDel(\''+m.id+'\')">🗑</button>';
  h += '</div>';
  var rk = Object.keys(m.reactions||{}).filter(function(e){ return (m.reactions[e]||[]).length; });
  if(rk.length){
    h += '<div class="reacts">' + rk.map(function(e){
      var mine2 = (m.reactions[e]||[]).indexOf(me.id)>=0;
      return '<button class="'+(mine2?'mine':'')+'" onclick="AJ.msgReact(\''+m.id+'\',\''+e+'\')">'+e+' '+(m.reactions[e]||[]).length+'</button>';
    }).join('') + '</div>';
  }
  h += '<div id="rx-'+m.id+'"></div></div>';
  return h;
}
function renderReplyBar(){
  var bar = AJ.$('#reply-bar'); if(!bar) return;
  if(!AJ._reply){ bar.innerHTML=''; return; }
  var m = AJ.find('messages', AJ._reply);
  bar.innerHTML = m ? '<div class="card tight row between"><div class="cap">↩ رد على: '+AJ.esc(m.text).slice(0,60)+'</div><button class="ibtn" onclick="AJ.setReply(null)">✕</button></div>' : '';
}
AJ.setReply = function(id){ AJ._reply = id; renderReplyBar(); var i=AJ.$('#cm-in'); if(i) i.focus(); };
AJ.msgReactBox = function(id){
  var box = AJ.$('#rx-'+id); if(!box) return;
  box.innerHTML = '<div class="reacts">' + EMOJIS.map(function(e){ return '<button onclick="AJ.msgReact(\''+id+'\',\''+e+'\')">'+e+'</button>'; }).join('') + '</div>';
};
AJ.msgReact = function(id, emoji){
  var m = AJ.find('messages', id); if(!m) return;
  m.reactions = m.reactions || {};
  var arr = m.reactions[emoji] || [];
  var me = AJ.me().id;
  if(arr.indexOf(me)>=0) m.reactions[emoji] = arr.filter(function(x){return x!==me;});
  else arr.push(me), m.reactions[emoji] = arr;
  AJ.save(); location.reload();
};
AJ.msgDel = function(id){
  if(!confirm('حذف الرسالة؟')) return;
  var m = AJ.find('messages', id); if(!m) return;
  m.deleted = true; m.text = ''; m.attachments = [];
  AJ.audit('delete_message', id); AJ.save(); location.reload();
};
AJ.onlineList = function(){
  var db = AJ.db();
  var on = db.users.filter(function(u){ return u.online && u.showOnline; });
  AJ.openModal('<h2 class="vt">🟢 المتصلون ('+on.length+')</h2><div style="margin-top:10px">'
    + (on.map(function(u){ return '<div class="kv"><b>'+AJ.esc(u.name)+'</b><span>@'+AJ.esc(u.username)+'</span></div>'; }).join('') || '<div class="cap">لا أحد متصل</div>')
    + '</div><div class="btnrow"><button class="btn ghost" onclick="AJ.closeModal()">إغلاق</button></div>');
};
AJ.msgAttach = function(){ var f = AJ.$('#cm-file'); if(f) f.click(); };
AJ.msgFileGo = function(input){
  var file = input.files && input.files[0]; if(!file) return;
  var rd = new FileReader();
  rd.onload = function(){
    var img = new Image();
    img.onload = function(){
      var max = 800, sc = Math.min(1, max/Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width*sc); c.height = Math.round(img.height*sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      AJ._pendingImg = c.toDataURL('image/jpeg', 0.7);
      AJ.toast('تم إرفاق الصورة — اضغط إرسال 📨');
      var i = AJ.$('#cm-in'); if(i) i.focus();
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
  input.value = '';
};
AJ.msgMic = function(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ AJ.toast('الإملاء الصوتي غير مدعوم في هذا المتصفح'); return; }
  try{
    var r = new SR(); r.lang = 'ar-SA'; r.interim = false;
    r.onresult = function(e){ var t = e.results[0][0].transcript; var i = AJ.$('#cm-in'); if(i) i.value = (i.value+' '+t).trim(); };
    r.onerror = function(){ AJ.toast('تعذر التعرف على الصوت'); };
    r.start(); AJ.toast('🎤 تحدث الآن…');
  }catch(e){ AJ.toast('تعذر تشغيل الميكروفون'); }
};
AJ.msgSend = function(){
  var me = AJ.me();
  if(!AJ.hasPerm('sendMessages')){ AJ.toast('لا تملك صلاحية الإرسال'); return; }
  var inp = AJ.$('#cm-in');
  var text = inp ? inp.value.trim() : '';
  var img = AJ._pendingImg || null;
  if(!text && !img) return;
  var reply = null;
  if(AJ._reply){ var rm = AJ.find('messages', AJ._reply); if(rm) reply = {id:rm.id, text:rm.text}; }
  var m = {id:AJ.uid('m'), senderId:me.id, senderName:me.name, text:text, type: img?'image':'text',
    timestamp:Date.now(), deliveredTo:[], readBy:[], replyTo:reply, attachments: img?[img]:[],
    reactions:{}, pinned:false, deleted:false, mentionAll:false};
  // mentions
  var men = text.match(/@(\S+)/g) || [];
  var db = AJ.db();
  db.messages.push(m);
  if(db.messages.length > 300) db.messages = db.messages.slice(-300);
  men.forEach(function(men2){
    var name = men2.slice(1);
    if(name === 'everyone'){
      if(AJ.hasPerm('moderateChat') || AJ.hasPerm('sendNotifications')){
        m.mentionAll = true;
        AJ.notifyAll({kind:'mention', title:'📣 '+me.name+' ذكر الجميع', body:text.slice(0,100), route:'community'});
      }
    } else {
      var u = db.users.filter(function(x){ return x.username.toLowerCase()===name.toLowerCase(); })[0];
      if(u && u.id !== me.id){
        AJ.notifyUser(u.id, {kind:'mention', title:'💬 '+me.name+' ذكرك', body:text.slice(0,100), route:'community'});
        if(AJ.prefs().browserNotify && 'Notification' in window && Notification.permission==='granted'){
          try{ new Notification('ذكرك '+me.name, {body:text.slice(0,100)}); }catch(e){}
        }
      }
    }
  });
  AJ.save();
  AJ._pendingImg = null; AJ._reply = null;
  location.reload();
};
})();
