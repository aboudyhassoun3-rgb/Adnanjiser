/* AJ Class A — AI chats, memory, markdown renderer, camera solver, generators */
(function(){
'use strict';
/* ---------- markdown renderer (native, no deps) ---------- */
AJ.md = function(src){
  var s = String(src||'');
  s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var html = '', lines = s.split('\n'), i = 0, inCode = false, codeLang = '', codeBuf = [];
  function inline(t){
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
    t = t.replace(/`(.+?)`/g, '<code>$1</code>');
    t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent)">$1</a>');
    return t;
  }
  while(i < lines.length){
    var L = lines[i];
    if(/^```/.test(L)){
      if(!inCode){ inCode = true; codeLang = L.replace(/```/,'').trim(); codeBuf = []; }
      else { inCode = false; html += '<pre><code>' + codeBuf.join('\n') + '</code></pre>'; }
      i++; continue;
    }
    if(inCode){ codeBuf.push(L); i++; continue; }
    if(/^#{1,3}\s/.test(L)){ var lv = L.match(/^(#{1,3})/)[1].length; html += '<h'+lv+'>' + inline(L.replace(/^#{1,3}\s/,'')) + '</h'+lv+'>'; i++; continue; }
    if(/^\s*>\s?/.test(L)){ html += '<blockquote>' + inline(L.replace(/^\s*>\s?/,'')) + '</blockquote>'; i++; continue; }
    if(/^\s*([-*•]\s+)/.test(L)){
      html += '<ul>';
      while(i<lines.length && /^\s*([-*•]\s+)/.test(lines[i])){ html += '<li>' + inline(lines[i].replace(/^\s*([-*•]\s+)/,'')) + '</li>'; i++; }
      html += '</ul>'; continue;
    }
    if(/^\s*\d+[.)]\s+/.test(L)){
      html += '<ol>';
      while(i<lines.length && /^\s*\d+[.)]\s+/.test(lines[i])){ html += '<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/,'')) + '</li>'; i++; }
      html += '</ol>'; continue;
    }
    if(/^\|.*\|$/.test(L)){
      var rows = [];
      while(i<lines.length && /^\|.*\|$/.test(lines[i])){ rows.push(lines[i]); i++; }
      rows = rows.filter(function(r){ return !/^\|[\s:\-|]+\|$/.test(r); });
      html += '<table>' + rows.map(function(r, ri){
        var cells = r.split('|').filter(function(c,j,a){ return j>0 && j<a.length-1; });
        var tag = ri===0 ? 'th' : 'td';
        return '<tr>' + cells.map(function(c){ return '<'+tag+'>'+inline(c.trim())+'</'+tag+'>'; }).join('') + '</tr>';
      }).join('') + '</table>'; continue;
    }
    if(/^---+$/.test(L.trim())){ html += '<div class="hr"></div>'; i++; continue; }
    if(/^💡/.test(L.trim())){ html += '<div class="callout">' + inline(L) + '</div>'; i++; continue; }
    if(!L.trim()){ i++; continue; }
    html += '<p>' + inline(L) + '</p>'; i++;
  }
  return '<div class="md">' + html + '</div>';
};

/* ---------- provider ---------- */
function aiCfg(){
  var st = AJ.db().settings || {};
  var key = ''; try{ key = localStorage.getItem('aj_proxy_key') || ''; }catch(e){}
  return {url:(st.aiUrl||'').replace(/\/+$/,''), model:st.aiModel||'aj-tutor-1', key:key, system:st.systemPrompt||''};
}
AJ.aiConfigured = function(){ return !!aiCfg().url; };
function withTimeout(ms){
  var c = (window.AbortController ? new AbortController() : null);
  var t = setTimeout(function(){ if(c) c.abort(); }, ms || 90000);
  return {signal: c ? c.signal : undefined, done:function(){ clearTimeout(t); }};
}
AJ.aiSend = function(messages, maxTokens){
  var cfg = aiCfg();
  if(!cfg.url) return Promise.reject(new Error('no-config'));
  var t = withTimeout(90000);
  var headers = {'Content-Type':'application/json'};
  if(cfg.key) headers.Authorization = 'Bearer ' + cfg.key;
  return fetch(cfg.url + '/chat/completions', {
    method:'POST', headers:headers, signal:t.signal,
    body: JSON.stringify({model:cfg.model, messages:messages, max_tokens:maxTokens||2048, temperature:0.4})
  }).then(function(r){ t.done(); if(!r.ok) throw new Error('http '+r.status); return r.json(); })
  .then(function(j){
    var txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    var tok = j && j.usage && j.usage.total_tokens;
    if(!txt) throw new Error('empty');
    return {text:String(txt).trim(), tokens:tok||0};
  }).catch(function(e){ t.done(); throw e; });
};
AJ.aiVision = function(prompt, b64){
  var cfg = aiCfg();
  if(!cfg.url) return Promise.reject(new Error('no-config'));
  var t = withTimeout(120000);
  var headers = {'Content-Type':'application/json'};
  if(cfg.key) headers.Authorization = 'Bearer ' + cfg.key;
  return fetch(cfg.url + '/vision/analyze', {
    method:'POST', headers:headers, signal:t.signal,
    body: JSON.stringify({model:cfg.model, prompt:prompt, image_base64:b64, max_tokens:2048})
  }).then(function(r){ t.done(); if(!r.ok) throw new Error('http '+r.status); return r.json(); })
  .then(function(j){
    var txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if(!txt) throw new Error('empty');
    return String(txt).trim();
  }).catch(function(e){ t.done(); throw e; });
};
function systemFor(subjectName){
  var base = (AJ.db().settings||{}).systemPrompt || 'أنت مدرّس مساعد لطلاب الصف الأول الثانوي.';
  return base + (subjectName ? (' المادة الحالية: ' + subjectName + '.') : '') + ' القواعد: لا تخمّن أبدًا. للمسائل اعرض: المعطيات، القانون، التعويض، النتيجة. اختم بقسم 💡 شرح مبسّط.';
}
function buildHistory(chat, prompt){
  var mem = AJ.prefs().aiMemory;
  var msgs = [{role:'system', content:systemFor(chat.subjectName || '')}];
  var all = (AJ.db().aiMsgs[chat.id] || []);
  if(mem && chat.memorySummary) msgs.push({role:'system', content:'ملخص المحادثة السابقة: ' + chat.memorySummary});
  var tail = mem ? all.slice(-24) : [];
  tail.forEach(function(m){ msgs.push({role:m.role, content:m.content}); });
  msgs.push({role:'user', content:prompt});
  return msgs;
}
function rollSummary(chat, userPrompt, answer){
  var s = ((chat.memorySummary||'') + '\nQ: ' + userPrompt + '\nA: ' + answer).trim();
  chat.memorySummary = s.slice(-1200);
}

/* ---------- chat list ---------- */
AJ.registerView('ai', function(view){
  AJ.require('useAI');
  var me = AJ.me();
  var chats = AJ.db().aiChats.filter(function(c){ return c.userId===me.id; })
    .sort(function(a,b){ return (b.pinned-a.pinned) || (b.updatedAt-a.updatedAt); });
  var h = '<div class="row between"><div><h2 class="vt">AJ AI 🤖</h2><div class="cap">مساعدك الدراسي — يتذكر سياق كل محادثة</div></div>'
    + '<button class="btn small" onclick="AJ.newAiChat()">+ New</button></div>';
  h += '<div class="grid3" style="margin:12px 0">'
    + '<div class="tile" onclick="AJ.aiHub(\'camera\')"><div class="t-ic">📷</div><div class="t-t">حل سؤال</div></div>'
    + '<div class="tile" onclick="AJ.aiHub(\'explain\')"><div class="t-ic">📚</div><div class="t-t">شرح درس</div></div>'
    + '<div class="tile" onclick="AJ.aiHub(\'plan\')"><div class="t-ic">🎯</div><div class="t-t">خطة دراسة</div></div></div>';
  if(!AJ.aiConfigured()) h += '<div class="card"><b>⚙ اربط AI أولاً</b><div class="cap">لم يضبط Owner عنوان AI API بعد. '+(AJ.isOwner()?'اذهب للإعدادات وأضف AI API URL (Proxy آمن).':'اطلب من الإدارة تفعيل AI.')+'</div></div>';
  if(!chats.length) h += AJ.stateEmpty('لا توجد محادثات بعد.', '<button class="btn" onclick="AJ.newAiChat()">+ بدء محادثة</button>');
  chats.forEach(function(c){
    h += '<div class="list-item" onclick="AJ.go(\'aichat\',\''+c.id+'\')"><div class="li-t">'+(c.pinned?'📌 ':'')+AJ.esc(c.title)+'</div><div class="li-s">'+AJ.timeAgo(c.updatedAt)+' • '+(AJ.db().aiMsgs[c.id]||[]).length+' رسائل</div></div>';
  });
  view.innerHTML = h;
});
AJ.newAiChat = function(subjectId, title){
  var me = AJ.me();
  var now = Date.now();
  var c = {id:AJ.uid('ch'), userId:me.id, title:title||'محادثة جديدة', pinned:false, memorySummary:'', subjectId:subjectId||'', subjectName:'', createdAt:now, updatedAt:now};
  if(subjectId){ var s = AJ.find('subjects', subjectId); if(s) c.subjectName = s.nameAr; }
  AJ.db().aiChats.unshift(c); AJ.save();
  AJ.go('aichat', c.id);
  return c.id;
};
AJ.askSubject = function(subjectId, prefill){
  AJ.require('useAI');
  var me = AJ.me();
  var open = AJ.db().aiChats.filter(function(c){ return c.userId===me.id && c.subjectId===subjectId; })[0];
  var id = open ? open.id : AJ.newAiChatSilent(subjectId);
  if(prefill){ try{ sessionStorage.setItem('aj_prefill', prefill); }catch(e){} }
  AJ.go('aichat', id);
};
AJ.newAiChatSilent = function(subjectId){
  var me = AJ.me(), now = Date.now();
  var s = AJ.find('subjects', subjectId);
  var c = {id:AJ.uid('ch'), userId:me.id, title:s?('استفسار — '+s.nameAr):'محادثة جديدة', pinned:false, memorySummary:'', subjectId:subjectId||'', subjectName:s?s.nameAr:'', createdAt:now, updatedAt:now};
  AJ.db().aiChats.unshift(c); AJ.save();
  return c.id;
};
/* help-me hub */
AJ.aiHub = function(kind){
  if(kind==='camera'){ AJ.cameraSolver(); return; }
  if(kind==='explain'){ var id = AJ.newAiChatSilent(''); AJ.go('aichat', id); setTimeout(function(){ AJ.toast('اكتب اسم الدرس لشرحه 📚'); }, 400); return; }
  if(kind==='plan'){
    AJ.openModal('<h2 class="vt">🎯 خطة دراسة</h2><form onsubmit="return AJ.planGo(event)"><label class="f">مثال: لدي امتحان رياضيات الخميس</label><textarea class="in" id="pl-t" required></textarea><div class="btnrow"><button class="btn" type="submit">إنشاء الخطة</button></div></form>');
    return;
  }
  AJ.newAiChat();
};
AJ.planGo = function(e){
  e.preventDefault();
  var t = AJ.$('#pl-t').value;
  var id = AJ.newAiChatSilent('');
  try{ sessionStorage.setItem('aj_prefill', 'أنشئ لي خطة دراسة يومية مفصلة (المدة، المواضيع، التدريبات، اختبار تجريبي) لهذا الوضع: ' + t); }catch(x){}
  AJ.closeModal(); AJ.go('aichat', id); return false;
};

/* ---------- chat view ---------- */
AJ.registerView('aichat', function(view, param){
  AJ.require('useAI');
  var me = AJ.me(), db = AJ.db();
  var chat = db.aiChats.filter(function(c){ return c.id===param && c.userId===me.id; })[0];
  if(!chat){ AJ.go('ai'); return; }
  try{ localStorage.setItem('ajlast', JSON.stringify({chatId:chat.id, title:chat.title})); }catch(e){}
  var msgs = db.aiMsgs[chat.id] || [];
  var h = '<div class="row"><div class="grow"><b style="font-size:17px">'+AJ.esc(chat.title)+'</b><div class="cap">'+AJ.esc(chat.subjectName||'محادثة عامة')+'</div></div>'
    + '<button class="ibtn" onclick="AJ.aiRename(\''+chat.id+'\')">✏️</button>'
    + '<button class="ibtn" onclick="AJ.aiExport(\''+chat.id+'\')">📤</button>'
    + '<button class="ibtn" onclick="AJ.aiDelete(\''+chat.id+'\')">🗑</button></div>';
  h += '<div id="ai-list">';
  if(!msgs.length) h += '<div class="state"><div class="big">🤖</div><p>اسأل أي شيء في دروسك — أشرح خطوة بخطوة ولا أخمّن أبدًا.</p></div>';
  msgs.forEach(function(m){ h += aiMsgHtml(chat, m); });
  h += '</div><div id="ai-thinking"></div>';
  h += '<div class="composer"><button class="ibtn" onclick="AJ.aiAttachFile(\''+chat.id+'\')" title="تحليل ملف">📎</button>'
    + '<input id="ai-in" placeholder="اسأل أي شيء…" onkeydown="if(event.key===\'Enter\')AJ.aiSendNow(\''+chat.id+'\')">'
    + '<button class="ibtn" onclick="AJ.aiMic(\''+chat.id+'\')" title="إملاء صوتي">🎤</button>'
    + '<button class="ibtn" onclick="AJ.aiSendNow(\''+chat.id+'\')" title="إرسال">📨</button></div>'
    + '<input type="file" id="ai-file" accept=".txt,.md,.csv,.json" class="hidden">';
  view.innerHTML = h;
  var fi = AJ.$('#ai-file');
  if(fi) fi.addEventListener('change', function(){ AJ.aiFileGo(chat.id, fi); });
  var pre = null; try{ pre = sessionStorage.getItem('aj_prefill'); sessionStorage.removeItem('aj_prefill'); }catch(e){}
  if(pre){ var inp = AJ.$('#ai-in'); if(inp){ inp.value = pre; AJ.aiSendNow(chat.id); } }
  window.scrollTo(0, document.body.scrollHeight);
});
function aiMsgHtml(chat, m){
  var h = '';
  if(m.role === 'user'){
    h = '<div class="msg me"><div class="m-b">'+AJ.esc(m.content)+'</div><div class="m-meta"><span>'+AJ.fmtTime(m.timestamp)+'</span></div></div>';
  } else {
    h = '<div class="msg" style="max-width:100%"><div class="m-name">AJ AI 🤖</div><div class="m-b" style="max-width:100%">'+AJ.md(m.content)+'</div>'
      + '<div class="m-meta"><span>'+AJ.fmtTime(m.timestamp)+'</span>'
      + '<button class="ibtn" style="width:auto;height:auto;font-size:12px" onclick="AJ.aiCopy(this)">📋 نسخ</button>'
      + '<button class="ibtn" style="width:auto;height:auto;font-size:12px" onclick="AJ.aiRegen(\''+chat.id+'\')">🔄 إعادة</button>'
      + '<button class="ibtn" style="width:auto;height:auto;font-size:12px" onclick="AJ.aiSaveAns(\''+chat.id+'\',this)">⭐ حفظ</button>'
      + '<button class="ibtn" style="width:auto;height:auto;font-size:12px" onclick="AJ.aiSpeak(this)">🔊 استماع</button>'
      + '</div></div>';
  }
  return h;
}
AJ.aiSendNow = function(chatId){
  var inp = AJ.$('#ai-in');
  var prompt = inp ? inp.value.trim() : '';
  if(!prompt || AJ._aiBusy) return;
  var chat = AJ.find('aiChats', chatId); if(!chat) return;
  var db = AJ.db();
  db.aiMsgs[chatId] = db.aiMsgs[chatId] || [];
  if(!AJ.aiConfigured()){
    AJ.openModal('<h2 class="vt">⚙ AI غير مربوط</h2><div class="card" style="margin-top:10px">لم يضبط Owner عنوان AI API بعد.<br><span class="cap">الإعدادات ← الذكاء الاصطناعي ← AI API URL (عبر Proxy آمن، بدون مفاتيح مكشوفة).</span></div><div class="btnrow"><button class="btn ghost" onclick="AJ.closeModal()">حسنًا</button></div>');
    return;
  }
  AJ._aiBusy = true;
  db.aiMsgs[chatId].push({id:AJ.uid('m'), role:'user', content:prompt, timestamp:Date.now()});
  chat.updatedAt = Date.now();
  if(chat.title === 'محادثة جديدة' || chat.title.indexOf('استفسار')===0) chat.title = prompt.slice(0,42);
  AJ.save(); inp.value = '';
  var th = AJ.$('#ai-thinking'); if(th) th.innerHTML = '<div class="skel"></div><div class="skel" style="width:70%"></div>';
  window.scrollTo(0, document.body.scrollHeight);
  AJ.aiSend(buildHistory(chat, prompt)).then(function(res){
    db.aiMsgs[chatId].push({id:AJ.uid('m'), role:'assistant', content:res.text, timestamp:Date.now(), tokens:res.tokens});
    rollSummary(chat, prompt, res.text);
    chat.updatedAt = Date.now(); AJ.save(); AJ._aiBusy = false;
    location.reload();
  }).catch(function(){
    AJ._aiBusy = false;
    if(th) th.innerHTML = '<div class="err">حدث خطأ. حاول مرة أخرى.</div>';
    AJ.toast('تعذر الاتصال بـ AI — تحقق من الإعدادات');
  });
};
AJ.aiRegen = function(chatId){
  var arr = AJ.db().aiMsgs[chatId] || [];
  for(var i=arr.length-1;i>=0;i--) if(arr[i].role==='user'){ var inp = AJ.$('#ai-in'); if(inp){ inp.value = arr[i].content; } AJ.aiSendNow(chatId); break; }
};
AJ.aiCopy = function(btn){
  var box = btn.closest('.msg').querySelector('.m-b');
  var t = box ? box.innerText : '';
  copyText(t);
};
AJ.aiSaveAns = function(chatId, btn){
  var box = btn.closest('.msg').querySelector('.m-b');
  var t = box ? box.innerText : '';
  var chat = AJ.find('aiChats', chatId);
  AJ.db().saved.unshift({id:AJ.uid('sv'), userId:AJ.me().id, kind:'ai', refId:chatId, title:(chat?chat.title:'إجابة AI'), snippet:t.slice(0,140), createdAt:Date.now(), full:t});
  AJ.save(); AJ.toast('تم الحفظ ⭐');
};
AJ.aiSpeak = function(btn){
  try{
    var box = btn.closest('.msg').querySelector('.m-b');
    var t = box ? box.innerText.slice(0,500) : '';
    var u = new SpeechSynthesisUtterance(t); u.lang = 'ar-SA';
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){ AJ.toast('النطق غير مدعوم'); }
};
function copyText(t){
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ AJ.toast('تم النسخ 📋'); }); }
  else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); AJ.toast('تم النسخ 📋'); }catch(e){} ta.remove(); }
}
AJ.aiMic = function(chatId){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ AJ.toast('الإملاء الصوتي غير مدعوم'); return; }
  try{
    var r = new SR(); r.lang = 'ar-SA';
    r.onresult = function(e){ var i = AJ.$('#ai-in'); if(i) i.value = ((i.value||'') + ' ' + e.results[0][0].transcript).trim(); };
    r.start(); AJ.toast('🎤 تحدث الآن…');
  }catch(e){}
};
AJ.aiRename = function(id){
  var c = AJ.find('aiChats', id); if(!c) return;
  AJ.openModal('<h2 class="vt">إعادة تسمية</h2><input class="in" id="rn-t" value="'+AJ.esc(c.title)+'"><div class="btnrow"><button class="btn" onclick="AJ.aiRenameGo(\''+id+'\')">حفظ</button></div>');
};
AJ.aiRenameGo = function(id){ var c = AJ.find('aiChats', id); c.title = AJ.$('#rn-t').value.slice(0,60) || c.title; AJ.save(); AJ.closeModal(); location.reload(); };
AJ.aiDelete = function(id){
  if(!confirm('حذف المحادثة؟')) return;
  var db = AJ.db();
  db.aiChats = db.aiChats.filter(function(c){ return c.id!==id; });
  delete db.aiMsgs[id]; AJ.save(); AJ.go('ai');
};
AJ.aiExport = function(id){
  var c = AJ.find('aiChats', id); if(!c) return;
  var arr = AJ.db().aiMsgs[id] || [];
  var txt = '# ' + c.title + '\n(' + AJ.fmtDT(c.createdAt) + ')\n\n' + arr.map(function(m){
    return (m.role==='user' ? '🧑 أنت:\n' : '🤖 AI:\n') + m.content + '\n';
  }).join('\n---\n\n');
  var blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'aj-chat.txt'; a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
};
/* file analysis */
AJ.aiAttachFile = function(chatId){ var f = AJ.$('#ai-file'); if(f) f.click(); };
AJ.aiFileGo = function(chatId, input){
  var file = input.files && input.files[0]; if(!file) return;
  var rd = new FileReader();
  rd.onload = function(){
    var text = String(rd.result || '').slice(0,6000);
    var inp = AJ.$('#ai-in');
    if(inp) inp.value = 'حلّل هذا الملف (لخّصه، استخرج القوانين، وحوّله لأسئلة وأجوبة):\n\n' + text;
    AJ.toast('تم إرفاق الملف — اضغط إرسال 📨');
  };
  rd.readAsText(file);
  input.value = '';
};
/* ---------- camera solver ---------- */
AJ.cameraSolver = function(){
  AJ.require('useCameraAI');
  AJ.openModal('<h2 class="vt">📷 حل السؤال</h2><div class="cap">صوّر السؤال بوضوح — لن أخمّن إذا كانت الصورة ضبابية</div>'
    + '<div id="cm-prev" style="margin-top:10px"></div>'
    + '<div class="btnrow"><button class="btn" onclick="AJ.camPick()">📷 تصوير / اختيار</button></div>'
    + '<div class="btnrow"><button class="btn ghost" onclick="AJ.camSolve()">حل السؤال</button></div>'
    + '<div id="cm-ans" style="margin-top:10px"></div>'
    + '<input type="file" id="cam-file" accept="image/*" capture="environment" class="hidden">');
  var fi = AJ.$('#cam-file');
  fi.addEventListener('change', function(){
    var file = fi.files && fi.files[0]; if(!file) return;
    var rd = new FileReader();
    rd.onload = function(){
      var img = new Image();
      img.onload = function(){
        var max = 1280, sc = Math.min(1, max/Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width*sc); c.height = Math.round(img.height*sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        AJ._camB64 = c.toDataURL('image/jpeg', 0.82).split(',')[1];
        AJ.$('#cm-prev').innerHTML = '<img src="'+c.toDataURL('image/jpeg',0.7)+'" style="width:100%;border-radius:14px">';
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
};
AJ.camPick = function(){ AJ.$('#cam-file').click(); };
AJ.camSolve = function(){
  if(!AJ._camB64){ AJ.toast('اختر صورة أولاً'); return; }
  if(!AJ.aiConfigured()){ AJ.$('#cm-ans').innerHTML = '<div class="err">AI غير مربوط — اضبط AI API URL من الإعدادات.</div>'; return; }
  AJ.$('#cm-ans').innerHTML = '<div class="skel"></div><div class="skel" style="width:70%"></div>';
  var prompt = 'حلّل صورة السؤال: استخرج النص، حدّد المادة إن أمكن، ثم حل خطوة بخطوة (المعطيات، القانون، التعويض، النتيجة). إذا كانت الصورة غير واضحة أجب حرفيًا: الصورة غير واضحة، يرجى التقاط صورة أوضح. ولا تخمّن.';
  AJ.aiVision(prompt, AJ._camB64).then(function(txt){
    AJ.$('#cm-ans').innerHTML = '<div class="card">' + AJ.md(txt) + '</div><div class="btnrow"><button class="btn small ghost" onclick="AJ.camSaveAns()">⭐ حفظ الإجابة</button></div>';
    AJ._camAns = txt;
  }).catch(function(){ AJ.$('#cm-ans').innerHTML = '<div class="err">حدث خطأ. حاول مرة أخرى.</div>'; });
};
AJ.camSaveAns = function(){
  AJ.db().saved.unshift({id:AJ.uid('sv'), userId:AJ.me().id, kind:'ai', refId:'', title:'حل بالكاميرا', snippet:(AJ._camAns||'').slice(0,140), createdAt:Date.now(), full:AJ._camAns||''});
  AJ.save(); AJ.toast('تم الحفظ ⭐');
};
})();
