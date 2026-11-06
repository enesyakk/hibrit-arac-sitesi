(function(){
  // ============================================================================
  // 🔥 FIREBASE YAPILANDIRMASI (Canlı Ortam)
  // Firebase Console'dan (console.firebase.google.com) aldığın proje bilgilerini
  // buraya yapıştırırsan tüm kullanıcılar ortak bulut veritabanını kullanır.
  // Eğer henüz Firebase eklemediysen, site otomatik olarak TARAYICI YEREL MODUNDA
  // sorunsuz çalışır (hiçbir şey çökmez, offline/demo olarak not yükleyip açabilirsin).
  // ============================================================================
  var firebaseConfig = {
    apiKey: "AIzaSyD4CbprEhDTtT37FZ7SOXZa97TSXALYYWc",
    authDomain: "noteshare-7ceeb.firebaseapp.com",
    projectId: "noteshare-7ceeb",
    storageBucket: "noteshare-7ceeb.firebasestorage.app",
    messagingSenderId: "575757413162",
    appId: "1:575757413162:web:10cd033a049ca6d9ac8c53"
  };

  // Yönetici (Admin) Giriş Bilgileri:
  // Not: Şifreni doğrudan buraya yazıp ("enes123" gibi) hemen yönetici olarak girebilirsin.
  // Boş bırakırsan alttaki hash kontrolü devreye girer.
  var ADMIN_EMAIL = "enesyakk@gmail.com";
  var ADMIN_PASSWORD = ""; 
  var ADMIN_SALT = "d8454fbdd189156103408bb1b7a9c2a4";
  var ADMIN_HASH = "da73fce81518492381d42d25673b9ccb91d403a1f0247cc75dda892faefc3f56";

  var UNIS = [
    "İstanbul Teknik Üniversitesi (İTÜ)",
    "Orta Doğu Teknik Üniversitesi (ODTÜ)",
    "Boğaziçi Üniversitesi",
    "Yıldız Teknik Üniversitesi (YTÜ)",
    "İstanbul Üniversitesi",
    "Marmara Üniversitesi",
    "Ankara Üniversitesi",
    "Hacettepe Üniversitesi",
    "Gazi Üniversitesi",
    "Ege Üniversitesi",
    "Dokuz Eylül Üniversitesi",
    "Anadolu Üniversitesi",
    "Akdeniz Üniversitesi",
    "Bursa Uludağ Üniversitesi",
    "Kocaeli Üniversitesi",
    "Sakarya Üniversitesi",
    "Karadeniz Teknik Üniversitesi (KTÜ)",
    "Erciyes Üniversitesi",
    "Çukurova Üniversitesi",
    "Selçuk Üniversitesi",
    "Diğer Üniversiteler"
  ];

  var CATS = [
    "Bilgisayar ve Yazılım",
    "Elektrik - Elektronik",
    "Makine ve Mekatronik",
    "İnşaat ve Mimarlık",
    "Endüstri Mühendisliği",
    "Tıp ve Sağlık Bilimleri",
    "Hukuk",
    "İktisat ve İşletme",
    "Psikoloji ve Sosyoloji",
    "Matematik ve Fizik",
    "Kimya ve Biyoloji",
    "Edebiyat ve Yabancı Diller",
    "İletişim ve Tasarım",
    "Eğitim Bilimleri",
    "Temel Üniversite Dersleri"
  ];

  var PAL=[["#1d5fd1","#12408f"],["#0f8fb8","#0a5a86"],["#4a5bd8","#2a2f9a"],["#2563eb","#1e3a8a"],["#0ea5c6","#1d6fa5"],["#3b82f6","#1d4ed8"],["#8b5cf6","#5b21b6"],["#ec4899","#9d174d"]];
  var AV=["#1d5fd1","#0f8fb8","#4a5bd8","#2a7fd4","#0ea5c6","#5b6fe0","#8b5cf6","#ec4899"];
  var $=function(i){return document.getElementById(i)};
  var db=null,assets=null,user=null,myId=null,canAdmin=false,notes=[],likes=[],bans={},reports=[],grade="",seen={},popId=null,nums={},members={},membersReady=false,authTab="login",sess=null,ITER=100000;
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  
  // Populate Universities dropdown
  if($("uni")){
    UNIS.forEach(function(u){
      var o=el("option",null,u);o.value=u;$("uni").appendChild(o);
    });
  }

  // Populate Categories dropdowns
  CATS.forEach(function(c){
    ["cat","fcat"].forEach(function(id){
      var target=$(id);
      if(target){var o=el("option",null,c);o.value=c;target.appendChild(o)}
    });
  });

  function fmt(b){return b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB"}
  function ago(iso){if(!iso)return"";var s=(Date.now()-new Date(iso))/1000;
    if(s<60)return"az önce";if(s<3600)return Math.floor(s/60)+" dk önce";if(s<86400)return Math.floor(s/3600)+" sa önce";
    if(s<604800)return Math.floor(s/86400)+" gün önce";return new Date(iso).toLocaleDateString("tr-TR")}
  function setNum(id,v){
    var e=$(id);if(!e)return;
    var from=nums[id]||0;nums[id]=v;
    if(from===v||window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.textContent=v;return}
    var t0=performance.now();
    (function step(t){var k=Math.min((t-t0)/600,1);e.textContent=Math.round(from+(v-from)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)})(t0);
  }
  function setMsg(t,c){var m=$("upMsg");if(m){m.textContent=t||"";m.className="msg "+(c||"")}}
  function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}

  function render(){
    var rep={},myRep={};reports.forEach(function(r){rep[r.note]=(rep[r.note]||0)+1;if(r.uid===myId)myRep[r.note]=1});
    var cnt={};likes.forEach(function(l){cnt[l.note]=(cnt[l.note]||0)+1});
    var mine={};likes.forEach(function(l){if(l.uid===myId)mine[l.note]=1});
    
    // Stats update
    setNum("sN",notes.length);
    var uSet={};notes.forEach(function(n){if(n.uni)uSet[n.uni]=1});
    setNum("sU",Math.max(Object.keys(uSet).length, UNIS.length));
    setNum("sC",CATS.length);

    var q=$("q").value.trim().toLocaleLowerCase("tr"),c=$("fcat").value;
    var rows=notes.filter(function(n){
      var matchText=((n.title||"")+" "+(n.by||"")+" "+(n.uni||"")+" "+(n.cat||"")).toLocaleLowerCase("tr");
      return !bans[n.uid]&&(!grade||n.grade===grade)&&(!c||n.cat===c)&&(!q||matchText.indexOf(q)>-1);
    });

    if($("sort").value==="pop")rows.sort(function(a,b){return (cnt[b.id]||0)-(cnt[a.id]||0)||(b.createdAt>a.createdAt?1:-1)});
    var f=$("feed");f.textContent="";
    if(!rows.length){f.appendChild(el("div","empty",notes.length?"Bu filtreye uyan ders notu yok.":"Henüz not paylaşılmadı. İlk notu üniversitenden sen paylaş!"));return}
    
    rows.forEach(function(n){
      var p=el("article","post"),ph=el("div","ph");
      if(!seen[n.id]){seen[n.id]=1;p.classList.add("in");p.style.animationDelay=Math.min(rows.indexOf(n),8)*70+"ms"}
      var nm=n.by||"Anonim";
      var av=el("div","av",nm.trim().charAt(0).toLocaleUpperCase("tr"));av.style.background=AV[hash(nm)%AV.length];
      var sp=el("div","sp");var nmE=el("div","nm lnk",nm);nmE.onclick=function(){openProfile(n.uid,nm)};sp.appendChild(nmE);
      var subText=(n.uni?(n.uni.split("(")[0].trim()+" · "):"")+ago(n.createdAt);
      sp.appendChild(el("div","tm",subText));
      av.classList.add("lnk");av.onclick=function(){openProfile(n.uid,nm)};ph.appendChild(av);ph.appendChild(sp);
      if(n.grade)ph.appendChild(el("span","gr",n.grade));
      
      var g=PAL[hash(n.cat||"")%PAL.length];
      var fileUrl=n.url||"#";
      var cv=el("a","cover");cv.href=fileUrl;cv.target="_blank";cv.rel="noopener";
      cv.style.background="linear-gradient(145deg,"+g[0]+","+g[1]+")";
      cv.appendChild(el("span","pdf","PDF"));
      cv.appendChild(el("div","ct",(n.uni?n.uni+" · ":"")+(n.cat||"Genel")));
      cv.appendChild(el("div","tt",n.title||n.name||"Adsız not"));
      var pf=el("div","pf");
      var lk=el("button","like"+(mine[n.id]?" on":"")+(popId===n.id?" beat":""),(mine[n.id]?"♥ ":"♡ ")+(cnt[n.id]||0));
      lk.disabled=!myId;lk.title=myId?"Beğen":"Beğenmek için giriş yap";lk.onclick=function(){toggle(n.id,!!mine[n.id])};
      pf.appendChild(lk);pf.appendChild(el("span","sp"));
      if(n.size)pf.appendChild(el("span","tm",fmt(n.size)));
      var op=el("a",null,"Aç");op.href=fileUrl;op.target="_blank";op.rel="noopener";pf.appendChild(op);
      if(!n.url&&n.asset&&assets&&assets.getUrl){
        assets.getUrl(n.asset).then(function(u){if(u){cv.href=u;op.href=u}});
      }
      if(canAdmin||(myId&&n.uid===myId)){var d=el("button","del","Sil");d.onclick=function(){remove(n)};pf.appendChild(d)}
      if(myId&&n.uid!==myId&&!myRep[n.id]){var fl=el("button","flag","🚩 Bildir");fl.title="Zararlı veya uygunsuz içerik bildir";fl.onclick=function(){report(n.id)};pf.appendChild(fl)}
      if(canAdmin&&rep[n.id])pf.appendChild(el("span","tm","🚩 "+rep[n.id]));
      if(canAdmin&&n.uid&&n.uid!==myId){var bn=el("button","del","Yasakla");bn.title="Kullanıcıyı yasakla ve notlarını sil";bn.onclick=function(){banUser(n)};pf.appendChild(bn)}
      p.appendChild(ph);p.appendChild(cv);p.appendChild(pf);f.appendChild(p);
    });
  }

  async function toggle(id,has){
    if(!myId)return;if(!has){popId=id;setTimeout(function(){popId=null},700)}var r=db.collection("likes").doc(id+"_"+myId);
    try{if(has)await r.delete();else await r.set({note:id,uid:myId,at:new Date().toISOString()})}catch(e){}
  }
  async function remove(n){
    if(!confirm("“"+(n.title||"Bu not")+"” silinsin mi? Geri alınamaz."))return;
    try{
      await db.collection("notes").doc(n.id).delete();
      if(assets&&(n.asset||n.url)){try{await assets.delete(n.asset||n.url)}catch(e){}}
    }
    catch(e){alert("Silinemedi.")}
  }
  function isMember(){return !!(myId&&(canAdmin||members[myId]))}
  function fillUploader(){
    var m=myId&&members[myId];
    $("by").value=m?m.name:(canAdmin?"Yönetici":"");
    if(m&&m.grade)$("grade").value=m.grade;
    if(m&&m.school&&$("uni")){$("uni").value=m.school}
  }
  function needMember(){
    var mc=$("memberCard");mc.scrollIntoView({behavior:"smooth",block:"center"});
    mc.classList.remove("flash");void mc.offsetWidth;mc.classList.add("flash");
  }

  /* ===== GİRİŞ / ÜYELİK KATMANI ===== */
  function hex(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return ("0"+x.toString(16)).slice(-2)}).join("")}
  function unhex(s){var a=new Uint8Array(s.length/2);for(var i=0;i<a.length;i++)a[i]=parseInt(s.substr(i*2,2),16);return a}
  async function sha(s){return hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))}
  async function pbk(pw,saltHex){var k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveBits"]);
    return hex(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:unhex(saltHex),iterations:ITER},k,256))}
  function normEmail(e){return (e||"").trim().toLowerCase()}
  async function accId(e){return "u_"+(await sha("hv:"+normEmail(e))).slice(0,40)}
  function saveSess(s){try{if(s)localStorage.setItem("hv_sess",JSON.stringify(s));else localStorage.removeItem("hv_sess")}catch(e){}}
  function applySession(s){
    sess=s;myId=s?s.id:null;canAdmin=!!(s&&s.admin);
    renderMember();renderProfile();renderAdmin();fillUploader();updateBan();render();
  }
  function startSession(s){saveSess(s);applySession(s)}
  function logout(){
    saveSess(null);applySession(null);
    $("uploadCard").hidden=true;$("toggleUp").textContent="＋ Not paylaş";
  }
  function loadSession(){try{var s=JSON.parse(localStorage.getItem("hv_sess")||"null");if(s&&s.id)sess=s,myId=s.id,canAdmin=!!s.admin}catch(e){}}
  var EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  async function doLogin(email,pw,say){
    email=normEmail(email);
    if(!EMAIL_RE.test(email)||!pw){say("E-posta ve şifreni yaz.");return false}
    try{
      if(email===ADMIN_EMAIL){
        var isMatch=ADMIN_PASSWORD?(pw===ADMIN_PASSWORD):(await pbk(pw,ADMIN_SALT)===ADMIN_HASH);
        if(!isMatch){say("E-posta veya şifre hatalı.");return false}
        startSession({id:"admin",admin:true,name:"Yönetici"});return true;
      }
      if(!membersReady){say("Yükleniyor, birkaç saniye sonra tekrar dene.");return false}
      var id=await accId(email),a=members[id];
      if(!a||!a.salt||await pbk(pw,a.salt)!==a.hash){say("E-posta veya şifre hatalı.");return false}
      if(bans[id]){say("Hesabın engellendi.");return false}
      startSession({id:id,name:a.name,grade:a.grade,school:a.school});return true;
    }catch(e){say("Giriş yapılamadı, tekrar dene.");return false}
  }
  async function doRegister(name,email,pw,gr,school,say){
    email=normEmail(email);name=name.trim();
    if(name.length<3){say("Lütfen ad ve soyadını yaz.");return false}
    if(!EMAIL_RE.test(email)){say("Geçerli bir e-posta yaz.");return false}
    if(pw.length<6){say("Şifre en az 6 karakter olmalı.");return false}
    if(email===ADMIN_EMAIL){say("Bu e-posta ayrılmış, kullanılamaz.");return false}
    if(!membersReady){say("Yükleniyor, birkaç saniye sonra tekrar dene.");return false}
    try{
      var id=await accId(email);
      if(members[id]){say("Bu e-posta ile zaten üyelik var, giriş yap.");return false}
      var salt=hex(crypto.getRandomValues(new Uint8Array(16))),hash=await pbk(pw,salt);
      await db.collection("accounts").doc(id).set({name:name,grade:gr,school:school||"",salt:salt,hash:hash,at:new Date().toISOString()});
      startSession({id:id,name:name,grade:gr,school:school});return true;
    }catch(e){say("Üyelik oluşturulamadı, tekrar dene.");return false}
  }
  function field(lbl,id,type,ph,ac){
    var d=el("div"),l=el("label","l",lbl);l.htmlFor=id;var i=el("input");i.id=id;i.type=type;i.placeholder=ph||"";if(ac)i.autocomplete=ac;i.maxLength=80;
    d.appendChild(l);d.appendChild(i);return d;
  }
  function renderMember(){
    var b=$("memberBody");b.textContent="";
    if(myId&&bans[myId]){
      b.appendChild(el("p","msg err","Hesabın engellendi, not paylaşamazsın."));
      var o=el("button","ghostb","Çıkış yap");o.onclick=logout;b.appendChild(o);return;
    }
    if(myId){
      var nm=(sess&&sess.name)||"Üye";
      var w=el("div","who"),av=el("div","av",nm.charAt(0).toLocaleUpperCase("tr"));av.style.background=AV[hash(nm)%AV.length];
      var tx=el("div","sp");tx.appendChild(el("div","nm","Hoş geldin, "+nm));
      var infoDetail=canAdmin?"👑 Yönetici":(sess&&sess.school?(sess.school+" · "):"")+((sess&&sess.grade)||"Öğrenci");
      tx.appendChild(el("div","tm","Giriş yapıldı · "+infoDetail));
      var ex=el("button","ghostb","Çıkış yap");ex.onclick=logout;
      w.appendChild(av);w.appendChild(tx);w.appendChild(ex);b.appendChild(w);return;
    }
    var tabs=el("div","tabs");tabs.style.marginBottom="14px";
    [["login","Giriş yap"],["join","Üye ol"]].forEach(function(t){
      var x=el("button",authTab===t[0]?"on":"",t[1]);x.onclick=function(){authTab=t[0];renderMember()};tabs.appendChild(x)});
    b.appendChild(tabs);
    var ms=el("div","msg");function say(t,ok){ms.className="msg "+(ok?"ok":"err");ms.textContent=t}
    if(authTab==="login"){
      b.appendChild(el("p","lead","E-posta ve şifrenle giriş yap. Üye olmayanlar not paylaşamaz."));
      var r=el("div","row");r.appendChild(field("E-posta","le","email","ornek@mail.com","username"));r.appendChild(field("Şifre","lp","password","Şifren","current-password"));b.appendChild(r);
      var bt=el("button",null,"Giriş yap");bt.style.cssText="width:100%;margin-top:12px";
      var go=async function(){bt.disabled=true;say("Kontrol ediliyor…",true);var ok=await doLogin($("le").value,$("lp").value,say);if(!ok)bt.disabled=false};
      bt.onclick=go;b.appendChild(bt);b.appendChild(ms);
      $("lp").addEventListener("keydown",function(e){if(e.key==="Enter")go()});
      var sw=el("p","lead","Hesabın yok mu? ");sw.style.marginTop="12px";var sl=el("a",null,"Üye ol");sl.href="#";sl.style.color="var(--blue)";sl.onclick=function(e){e.preventDefault();authTab="join";renderMember()};sw.appendChild(sl);b.appendChild(sw);
      return;
    }
    b.appendChild(el("p","lead","Üyelik ücretsizdir. Tüm üniversite öğrencileri not paylaşabilir."));
    var r1=el("div","row");r1.appendChild(field("Ad Soyad","rn","text","Örn. Ayşe Yılmaz","name"));
    var d2=el("div"),l2=el("label","l","Sınıf");l2.htmlFor="rg";var mg=el("select");mg.id="rg";["1. Sınıf","2. Sınıf","3. Sınıf","4. Sınıf","Hazırlık / YL"].forEach(function(x){mg.appendChild(el("option",null,x))});d2.appendChild(l2);d2.appendChild(mg);r1.appendChild(d2);b.appendChild(r1);
    
    var dUni=el("div"),lUni=el("label","l","Üniversiten");lUni.htmlFor="ru";var mUni=el("select");mUni.id="ru";
    UNIS.forEach(function(x){mUni.appendChild(el("option",null,x))});dUni.appendChild(lUni);dUni.appendChild(mUni);b.appendChild(dUni);

    var r2=el("div","row");r2.appendChild(field("E-posta","re","email","ornek@mail.com","username"));r2.appendChild(field("Şifre (en az 6 karakter)","rp","password","Şifre belirle","new-password"));b.appendChild(r2);
    var ck=el("label","chk"),cb=el("input");cb.type="checkbox";ck.appendChild(cb);
    ck.appendChild(document.createTextNode(" Virüslü, zararlı veya telif ihlali içeren dosya yüklemeyeceğimi kabul ediyorum."));b.appendChild(ck);
    var bj=el("button",null,"Üye ol");bj.style.cssText="width:100%;margin-top:12px";
    bj.onclick=async function(){
      if(!cb.checked){say("Devam etmek için kuralı kabul etmelisin.");return}
      bj.disabled=true;say("Kaydediliyor…",true);
      var ok=await doRegister($("rn").value,$("re").value,$("rp").value,mg.value,mUni.value,say);if(!ok)bj.disabled=false;
    };
    b.appendChild(bj);b.appendChild(ms);
  }
  function lineP(parent,ico,lbl,val){
    var r=el("div","pline");r.appendChild(el("div","pl",ico+" "+lbl));r.appendChild(el("div","pv",val||"Belirtilmemiş"));parent.appendChild(r);
  }
  function openProfile(uid,fallback){
    var d=$("pDlg"),b=$("pBody");b.textContent="";
    var a=uid==="admin"?{name:"Yönetici"}:members[uid];
    var nm=(a&&a.name)||fallback||"Üye";
    var top=el("div","who"),av=el("div","av",nm.charAt(0).toLocaleUpperCase("tr"));av.style.background=AV[hash(nm)%AV.length];av.style.width=av.style.height="52px";av.style.fontSize="22px";
    var tx=el("div","sp");tx.appendChild(el("div","nm",nm));tx.appendChild(el("div","tm",uid==="admin"?"👑 Yönetici":((a&&a.school?(a.school+" · "):"")+((a&&a.grade)||""))));
    top.appendChild(av);top.appendChild(tx);b.appendChild(top);
    if(uid!=="admin"){
      if(a&&(a.school||a.dept||a.bio)){
        if(a.school)lineP(b,"🎓","Üniversite",a.school);
        if(a.dept)lineP(b,"🏫","Bölüm",a.dept);
        if(a.bio)lineP(b,"📝","Hakkında",a.bio);
      } else b.appendChild(el("p","lead","Bu öğrenci henüz detaylı profil bilgisi eklememiş."));
    }
    if(d.showModal)d.showModal();else alert(nm+(a&&a.school?"\nOkul: "+a.school:""));
  }
  function renderProfile(){
    var card=$("profileCard"),me=myId&&!canAdmin&&members[myId];
    if(!me){card.hidden=true;card.dataset.built="";$("profileBody").textContent="";return}
    card.hidden=false;
    if(card.dataset.built===myId)return;
    card.dataset.built=myId;
    var b=$("profileBody");b.textContent="";
    b.appendChild(el("p","lead","Profil bilgilerini güncelle, paylaştığın notlarda arkadaşların senin hangi üniversite ve bölümde olduğunu görsün."));
    var r1=el("div","row");r1.appendChild(field("Ad Soyad","pn","text","Ad Soyad","name"));
    var d2=el("div"),l2=el("label","l","Sınıf");l2.htmlFor="pg";var pg=el("select");pg.id="pg";["1. Sınıf","2. Sınıf","3. Sınıf","4. Sınıf","Hazırlık / YL"].forEach(function(x){pg.appendChild(el("option",null,x))});d2.appendChild(l2);d2.appendChild(pg);r1.appendChild(d2);b.appendChild(r1);
    
    var dUni=el("div"),lUni=el("label","l","Üniversiten");lUni.htmlFor="ps";var ps=el("select");ps.id="ps";
    UNIS.forEach(function(x){ps.appendChild(el("option",null,x))});dUni.appendChild(lUni);dUni.appendChild(ps);b.appendChild(dUni);

    b.appendChild(field("Bölümün","pd","text","Örn. Bilgisayar Mühendisliği"));
    var d3=el("div"),l3=el("label","l","Hakkımda (isteğe bağlı)");l3.htmlFor="pb";var ta=el("textarea");ta.id="pb";ta.rows=3;ta.maxLength=200;ta.placeholder="Kendini kısaca tanıt";d3.appendChild(l3);d3.appendChild(ta);b.appendChild(d3);
    $("pn").value=me.name||"";pg.value=me.grade||"1. Sınıf";if(me.school)ps.value=me.school;$("pd").value=me.dept||"";ta.value=me.bio||"";
    var bt=el("button",null,"Profilimi kaydet");bt.style.cssText="width:100%;margin-top:12px";
    var ms=el("div","msg");
    bt.onclick=async function(){
      var n=$("pn").value.trim();
      if(n.length<3){ms.className="msg err";ms.textContent="Lütfen ad ve soyadını yaz.";return}
      var cur=members[myId]||{},d={};for(var k in cur)d[k]=cur[k];
      d.name=n;d.grade=pg.value;d.school=ps.value;d.dept=$("pd").value.trim();d.bio=ta.value.trim();
      bt.disabled=true;ms.className="msg";ms.textContent="Kaydediliyor…";
      try{
        await db.collection("accounts").doc(myId).set(d);
        sess.name=d.name;sess.grade=d.grade;sess.school=d.school;saveSess(sess);
        ms.className="msg ok";ms.textContent="Profilin kaydedildi ✓";fillUploader();renderMember();
      }catch(e){ms.className="msg err";ms.textContent="Kaydedilemedi, tekrar dene."}
      bt.disabled=false;
    };
    b.appendChild(bt);b.appendChild(ms);
  }
  function renderAdmin(){
    var card=$("adminCard");card.hidden=!canAdmin;if(!canAdmin)return;
    var ids=Object.keys(members).sort(function(a,b){return (members[b].at||"")>(members[a].at||"")?1:-1});
    $("mCount").textContent="("+ids.length+")";
    var l=$("mList");l.textContent="";
    if(!ids.length){l.appendChild(el("div","empty","Henüz üye yok."));return}
    ids.forEach(function(id){
      var m=members[id],r=el("div","mrow");
      var t=el("div","sp");t.appendChild(el("b",null,m.name||"Adsız"));
      t.appendChild(el("span","tm"," · "+(m.school?(m.school+" · "):"")+(m.grade||"")+" · "+ago(m.at)));
      var x=el("button","del","Çıkar");x.onclick=async function(){if(!confirm((m.name||"Bu üye")+" üyelikten çıkarılsın mı?"))return;try{await db.collection("accounts").doc(id).delete()}catch(e){alert("Başarısız oldu.")}};
      r.appendChild(t);r.appendChild(x);l.appendChild(r);
    });
  }
  async function report(id){
    if(!myId)return;
    try{await db.collection("reports").doc(id+"_"+myId).set({note:id,uid:myId,at:new Date().toISOString()});alert("Bildirimin alındı, teşekkürler.")}catch(e){}
  }
  async function banUser(n){
    if(!confirm("Bu kullanıcı ("+(n.by||"Anonim")+") yasaklansın mı? Paylaşım yapamaz ve tüm notları silinir."))return;
    try{
      await db.collection("bans").doc(n.uid).set({at:new Date().toISOString(),by:myId});
      var mine=notes.filter(function(x){return x.uid===n.uid});
      for(var i=0;i<mine.length;i++){
        await db.collection("notes").doc(mine[i].id).delete();
        if(assets&&(mine[i].asset||mine[i].url)){try{await assets.delete(mine[i].asset||mine[i].url)}catch(e){}}
      }
    }catch(e){alert("Yasaklama başarısız oldu.")}
  }
  function updateBan(){if(myId&&bans[myId]){$("send").disabled=true;setMsg("Paylaşım yetkin kaldırıldı.","err")}}
  
  async function upload(){
    if(myId&&bans[myId]){updateBan();return}
    if(!isMember()){setMsg("Not paylaşmak için önce üye olmalısın.","err");needMember();return}
    var f=$("file").files[0],t=$("title").value.trim();
    if(!f){setMsg("Lütfen bir PDF seç.","err");return}
    if(!/\.pdf$/i.test(f.name)&&f.type!=="application/pdf"){setMsg("Yalnızca PDF yüklenebilir.","err");return}
    if(f.size>20*1048576){setMsg("Dosya 20 MB sınırını aşıyor.","err");return}
    try{var hd=new Uint8Array(await f.slice(0,5).arrayBuffer());if(String.fromCharCode.apply(null,hd)!=="%PDF-"){setMsg("Bu dosya geçerli bir PDF değil.","err");return}}catch(e){setMsg("Dosya okunamadı.","err");return}
    if(!t)t=f.name.replace(/\.pdf$/i,"");
    var b=$("send");b.disabled=true;setMsg("Yükleniyor…");
    try{
      var r=await assets.upload(f,{type:"application/pdf"});
      await db.collection("notes").add({
        title:t,
        uni:$("uni")?$("uni").value:"",
        grade:$("grade").value,
        cat:$("cat").value,
        by:$("by").value.trim(),
        name:f.name,
        asset:r.id,
        url:r.url||"",
        size:r.sizeBytes||f.size,
        uid:myId||null,
        createdAt:new Date().toISOString()
      });
      $("title").value="";$("file").value="";$("dropT").textContent="PDF seç ya da buraya sürükle";setMsg("Paylaşıldı ✓","ok");
      grade=$("grade").value;syncTabs();render();
    }catch(e){
      var c=e&&e.code;setMsg(c==="too_large"?"Dosya çok büyük.":c==="quota_or_state"?"Depolama alanı dolu.":c==="rate_limited"?"Çok sık denedin, biraz bekle.":"Yükleme başarısız oldu.","err");
    }finally{b.disabled=false}
  }

  function syncTabs(){[].forEach.call($("tabs").children,function(b){b.classList.toggle("on",b.dataset.g===grade)})}
  [].forEach.call($("tabs").children,function(b){b.onclick=function(){grade=b.dataset.g;seen={};syncTabs();render()}});
  $("q").oninput=render;$("fcat").onchange=function(){seen={};render()};$("sort").onchange=function(){seen={};render()};$("send").onclick=upload;
  $("toggleUp").onclick=function(){
    var c=$("uploadCard");
    if(c.hidden&&!isMember()){needMember();return}
    c.hidden=!c.hidden;this.textContent=c.hidden?"＋ Not paylaş":"✕ Kapat";if(!c.hidden)c.scrollIntoView({block:"nearest"});
  };
  function picked(){var f=$("file").files[0];$("dropT").textContent=f?f.name:"PDF seç ya da buraya sürükle";if(f&&!$("title").value.trim())$("title").value=f.name.replace(/\.pdf$/i,"")}
  $("file").onchange=picked;
  var dz=$("drop");
  ["dragenter","dragover"].forEach(function(e){dz.addEventListener(e,function(v){v.preventDefault();dz.classList.add("over")})});
  ["dragleave","drop"].forEach(function(e){dz.addEventListener(e,function(v){v.preventDefault();dz.classList.remove("over")})});
  dz.addEventListener("drop",function(v){var f=v.dataTransfer&&v.dataTransfer.files[0];if(f){try{var d=new DataTransfer();d.items.add(f);$("file").files=d.files;picked()}catch(e){}}});

  // ============================================================================
  // VERİTABANI VE DOSYA SİSTEMİ BAŞLATMA
  // ============================================================================
  function initLocalDB(){
    function getCol(c){try{return JSON.parse(localStorage.getItem("hv_col_"+c)||"{}")}catch(e){return {}}}
    function setCol(c,data){
      try{
        localStorage.setItem("hv_col_"+c,JSON.stringify(data));
        window.dispatchEvent(new CustomEvent("hv_db_change",{detail:{col:c}}));
      }catch(e){console.error("Yerel depolama hatası:",e)}
    }
    window.addEventListener("storage",function(e){
      if(e.key&&e.key.indexOf("hv_col_")===0){
        var c=e.key.replace("hv_col_","");
        window.dispatchEvent(new CustomEvent("hv_db_change",{detail:{col:c}}));
      }
    });

    db={
      collection:function(c){
        var colName=c;
        return {
          doc:function(id){
            return {
              set:async function(data){
                var col=getCol(colName);
                col[id]=Object.assign({},data,{id:id});
                setCol(colName,col);
              },
              delete:async function(){
                var col=getCol(colName);
                delete col[id];
                setCol(colName,col);
              }
            };
          },
          add:async function(data){
            var id="n_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);
            var col=getCol(colName);
            col[id]=Object.assign({},data,{id:id});
            setCol(colName,col);
            return {id:id};
          },
          orderBy:function(field,dir){
            return {
              onSnapshot:function(cb,errCb){
                function run(){
                  var col=getCol(colName);
                  var list=Object.keys(col).map(function(k){return col[k]});
                  list.sort(function(a,b){
                    var va=a[field]||"",vb=b[field]||"";
                    return dir==="asc"?(va>vb?1:-1):(va<vb?1:-1);
                  });
                  cb({docs:list.map(function(item){return {id:item.id,data:function(){return item}}})});
                }
                run();
                var handler=function(e){if(!e.detail||e.detail.col===colName)run()};
                window.addEventListener("hv_db_change",handler);
                return function(){window.removeEventListener("hv_db_change",handler)};
              }
            };
          },
          onSnapshot:function(cb,errCb){
            function run(){
              var col=getCol(colName);
              var list=Object.keys(col).map(function(k){return col[k]});
              cb({docs:list.map(function(item){return {id:item.id,data:function(){return item}}})});
            }
            run();
            var handler=function(e){if(!e.detail||e.detail.col===colName)run()};
            window.addEventListener("hv_db_change",handler);
            return function(){window.removeEventListener("hv_db_change",handler)};
          }
        };
      }
    };

    var localAssetMap={};
    var idbPromise=new Promise(function(resolve){
      if(!window.indexedDB)return resolve(null);
      var req=indexedDB.open("HvLocalAssets",1);
      req.onupgradeneeded=function(e){e.target.result.createObjectStore("files")};
      req.onsuccess=function(e){resolve(e.target.result)};
      req.onerror=function(){resolve(null)};
    });

    assets={
      upload:async function(f){
        var assetId="asset_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);
        var objectUrl=URL.createObjectURL(f);
        localAssetMap[assetId]=objectUrl;
        var idb=await idbPromise;
        if(idb){
          try{
            var tx=idb.transaction("files","readwrite");
            tx.objectStore("files").put(f,assetId);
          }catch(e){}
        }
        return {id:assetId,url:objectUrl,sizeBytes:f.size};
      },
      delete:async function(assetId){
        if(localAssetMap[assetId]){
          try{URL.revokeObjectURL(localAssetMap[assetId])}catch(e){}
          delete localAssetMap[assetId];
        }
        var idb=await idbPromise;
        if(idb){
          try{
            var tx=idb.transaction("files","readwrite");
            tx.objectStore("files").delete(assetId);
          }catch(e){}
        }
      },
      getUrl:async function(assetId){
        if(localAssetMap[assetId])return localAssetMap[assetId];
        var idb=await idbPromise;
        if(idb){
          return new Promise(function(resolve){
            var tx=idb.transaction("files","readonly");
            var req=tx.objectStore("files").get(assetId);
            req.onsuccess=function(){
              if(req.result){
                var url=URL.createObjectURL(req.result);
                localAssetMap[assetId]=url;
                resolve(url);
              }else{resolve("")}
            };
            req.onerror=function(){resolve("")};
          });
        }
        return "";
      }
    };
  }

  async function initDB(){
    var hasFirebase=typeof firebase!=="undefined"&&firebaseConfig&&firebaseConfig.projectId&&firebaseConfig.apiKey&&firebaseConfig.apiKey!=="BURAYA_API_KEY";
    if(hasFirebase){
      try{
        if(!firebase.apps.length){
          firebase.initializeApp(firebaseConfig);
        }
        db=firebase.firestore();
        var storage=firebase.storage();
        assets={
          upload:async function(f,opts){
            var cleanName=f.name.replace(/[^a-zA-Z0-9._-]/g,"_");
            var path="notes/"+Date.now()+"_"+cleanName;
            var ref=storage.ref().child(path);
            var snap=await ref.put(f,{contentType:(opts&&opts.type)||"application/pdf"});
            var url=await snap.ref.getDownloadURL();
            return {id:path,url:url,sizeBytes:f.size};
          },
          delete:async function(assetRef){
            if(!assetRef)return;
            try{
              if(assetRef.startsWith("http")){
                await storage.refFromURL(assetRef).delete();
              }else{
                await storage.ref(assetRef).delete();
              }
            }catch(e){console.warn("Storage silme uyarısı:",e)}
          }
        };
        console.log("🔥 Firebase Firestore ve Storage başarıyla bağlandı!");
        return;
      }catch(err){
        console.warn("Firebase bağlantısı başarısız, yerel moda geçiliyor:",err);
      }
    }
    console.log("ℹ️ Firebase yapılandırması girilmediği için yerel tarayıcı modunda çalışılıyor.");
    initLocalDB();
  }

  async function init(){
    await initDB();
    loadSession();
    renderMember();
    if(assets)$("send").disabled=false;
    if(!db){$("feed").innerHTML='<div class="empty">Veritabanı başlatılamadı.</div>';return}
    db.collection("notes").orderBy("createdAt","desc").onSnapshot(function(s){
      notes=s.docs.map(function(d){var x=d.data()||{};x.id=d.id;return x});render()},
      function(){$("feed").innerHTML='<div class="empty">Notlar okunamadı.</div>'});
    db.collection("likes").onSnapshot(function(s){likes=s.docs.map(function(d){return d.data()||{}});render()},function(){});
    db.collection("bans").onSnapshot(function(s){bans={};s.docs.forEach(function(d){bans[d.id]=true});updateBan();renderMember();render()},function(){});
    db.collection("accounts").onSnapshot(function(s){members={};s.docs.forEach(function(d){members[d.id]=d.data()||{}});membersReady=true;
      if(sess&&!sess.admin){if(!members[sess.id]){logout();return}sess.name=members[sess.id].name;sess.grade=members[sess.id].grade;sess.school=members[sess.id].school}
      renderMember();renderProfile();renderAdmin();fillUploader();
      if(!isMember()&&!$("uploadCard").hidden){$("uploadCard").hidden=true;$("toggleUp").textContent="＋ Not paylaş"}
    },function(){membersReady=true;renderMember()});
    db.collection("reports").onSnapshot(function(s){reports=s.docs.map(function(d){return d.data()||{}});render()},function(){});
  }

  CATS.forEach(function(cn){
    var chipsEl=$("chips");
    if(chipsEl){
      var b=el("button","chip",cn);
      b.onclick=function(){
        $("fcat").value=cn;seen={};render();$("feedCard").scrollIntoView({behavior:"smooth",block:"start"})
      };
      chipsEl.appendChild(b);
    }
  });

  function setTheme(t,anim){
    var r=document.documentElement;
    if(anim){r.classList.add("tt");setTimeout(function(){r.classList.remove("tt")},500)}
    if(t==="neon")r.setAttribute("data-theme","neon");else r.removeAttribute("data-theme");
    $("themeBtn").textContent=t==="neon"?"☀️ Açık tema":"🌙 Koyu tema";
    try{localStorage.setItem("hv_theme",t)}catch(e){}
  }
  $("themeBtn").onclick=function(){setTheme(document.documentElement.getAttribute("data-theme")==="neon"?"light":"neon",true)};
  setTheme(document.documentElement.getAttribute("data-theme")==="neon"?"neon":"light",false);
  $("pClose").onclick=function(){$("pDlg").close()};
  $("pDlg").addEventListener("click",function(e){if(e.target===this)this.close()});
  var secs=document.querySelectorAll(".wrap > .card:not(#uploadCard):not(#feedCard)");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("show");io.unobserve(e.target)}})},{threshold:.12});
    [].forEach.call(secs,function(s){s.classList.add("reveal");io.observe(s)});
  }
  init();
})();
