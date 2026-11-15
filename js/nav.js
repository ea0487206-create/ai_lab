/* ===== nav.js — شريط التنقل + تحميل الملفات المشتركة (مرة واحدة) ===== */
(function () {
  var PAGES = [
    { file: "home.html", label: "🏠 الرئيسية" },
    { file: "station1.html", label: "1️⃣ علّمني" },
    { file: "station2.html", label: "2️⃣ هل أنت متأكد؟" },
    { file: "station3.html", label: "3️⃣ مولد البرومبت" },
    { file: "station4.html", label: "4️⃣ AI Challenge" },
    { file: "station5.html", label: "5️⃣ استخدمه بأمان" },
    
  ];
  var current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var idx = PAGES.findIndex(function (p) { return p.file === current; });

  var st = document.createElement("style");
  st.textContent =
    "#lab-nav{position:sticky;top:0;z-index:9000;display:flex;gap:6px;overflow-x:auto;padding:8px 10px;background:#0b1530f2;border-bottom:1px solid #3b82f6;direction:rtl;font-family:'Segoe UI',Tahoma,sans-serif}" +
    "#lab-nav a{white-space:nowrap;padding:6px 12px;border-radius:20px;background:#1e2a55;color:#fff;text-decoration:none;font-size:14px;border:1px solid transparent}" +
    "#lab-nav a:hover{border-color:#8b5cf6}" +
    "#lab-nav a.active{background:linear-gradient(135deg,#3b82f6,#8b5cf6);font-weight:bold}" +
    "#lab-pager{display:flex;justify-content:space-between;gap:10px;max-width:620px;margin:20px auto;padding:0 10px;direction:rtl;font-family:'Segoe UI',Tahoma,sans-serif}" +
    "#lab-pager a{flex:1;text-align:center;padding:10px;border-radius:10px;background:#3b82f6;color:#fff;text-decoration:none}" +
    "#lab-pager a.next{background:#8b5cf6}" +
    "@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}";
  document.head.appendChild(st);

  var nav = document.createElement("nav");
  nav.id = "lab-nav";
  nav.setAttribute("aria-label", "التنقل بين صفحات المختبر");
  nav.innerHTML = PAGES.map(function (p, i) {
    return '<a href="' + p.file + '"' + (i === idx ? ' class="active" aria-current="page"' : "") + ">" + p.label + "</a>";
  }).join("");
  document.body.insertBefore(nav, document.body.firstChild);

  var stations = /^station[1-5]\.html$/.test(current);
  if (stations && idx > 0) {
    var pager = document.createElement("div");
    pager.id = "lab-pager";
    var prev = PAGES[idx - 1], next = PAGES[idx + 1];
   
  }

  function load(src, test) {
    if (test && test()) { return; }
    var s = document.createElement("script");
    s.src = src; s.defer = true;
    document.body.appendChild(s);
  }
  load("./js/nova-avatar.js", function () { return window.novaAvatar; });
  load("./js/config.js", function () { return typeof GEMINI_KEY !== "undefined"; });
})();

