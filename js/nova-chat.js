/* ===== nova-chat.js — شات نوفا العائم (بيستخدم نفس عقل المحطات) ===== */
(function () {
  function boot() {
    var root = document.getElementById("nova-chat");
    if (!root) { root = document.createElement("div"); root.id = "nova-chat"; document.body.appendChild(root); }
    var st = document.createElement("style");
    st.textContent =
      "#nova-chat{position:fixed;bottom:16px;left:16px;z-index:9999;font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl}" +
      "#nova-btn{width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;font-size:30px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 16px #3b82f6aa;color:#fff}" +
      "#nova-box{display:none;flex-direction:column;width:320px;max-width:calc(100vw - 32px);height:420px;max-height:70vh;margin-bottom:10px;background:#0b1530;border:1px solid #3b82f6;border-radius:16px;overflow:hidden;color:#fff}" +
      "#nova-box.open{display:flex}" +
      "#nova-head{padding:10px 14px;background:linear-gradient(135deg,#1e3a8a,#6d28d9);font-weight:bold}" +
      "#nova-msgs{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px}" +
      ".nova-m{padding:8px 12px;border-radius:12px;max-width:85%;line-height:1.6;font-size:14px;white-space:pre-wrap}" +
      ".nova-m.bot{background:#1e2a55;align-self:flex-start}.nova-m.me{background:#3b82f6;align-self:flex-end}" +
      "#nova-form{display:flex;border-top:1px solid #3b82f6}" +
      "#nova-input{flex:1;min-width:0;padding:10px;border:none;background:#0f1d40;color:#fff;font-size:14px;outline:none;font-family:inherit}" +
      "#nova-send{padding:0 14px;border:none;background:#8b5cf6;color:#fff;cursor:pointer;font-family:inherit}";
    document.head.appendChild(st);
    root.innerHTML =
      '<div id="nova-box" role="dialog" aria-label="شات نوفا"><div id="nova-head">🤖 نوفا</div><div id="nova-msgs"></div>' +
      '<div id="nova-form"><input id="nova-input" placeholder="اسأل نوفا..." aria-label="اكتب سؤالك"><button id="nova-send">إرسال</button></div></div>' +
      '<button id="nova-btn" title="نوفا" aria-label="افتح شات نوفا">🤖</button>';
    var box = root.querySelector("#nova-box"), msgs = root.querySelector("#nova-msgs"),
        input = root.querySelector("#nova-input"), hist = [], busy = false;
    function add(t, c) {
      var d = document.createElement("div"); d.className = "nova-m " + c; d.textContent = t;
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
    }
    add("أهلاً! أنا نوفا 🤖 اسألني عن الحاسب والذكاء الاصطناعي.", "bot");
    root.querySelector("#nova-btn").onclick = function () { box.classList.toggle("open"); if (box.classList.contains("open")) { input.focus(); } };
    async function send() {
      var q = input.value.trim(); if (!q || busy) { return; }
      busy = true; input.value = ""; add(q, "me");
      var b = add("...", "bot");
      hist.push({ role: "user", parts: [{ text: q }] });
      try {
        var B = window.NovaBrain;
        var r = await B.answer(q, hist, function (t) { b.textContent = B.clean(t); msgs.scrollTop = msgs.scrollHeight; });
        var a = B.clean(r.text).trim(); b.textContent = a;
        hist.push({ role: "model", parts: [{ text: a }] });
      } catch (e) { hist.pop(); b.textContent = window.NovaBrain.friendly(e); }
      busy = false;
    }
    root.querySelector("#nova-send").onclick = send;
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { send(); } });
  }
  if (window.NovaBrain) { boot(); return; }
  var s = document.createElement("script"); s.src = "./js/nova-brain.js"; s.onload = boot; document.body.appendChild(s);
})();

(() => {
  const b = document.createElement("button"); b.id = "nb"; b.textContent = "💬"; b.setAttribute("aria-label","شات نوفا");
  const p = document.createElement("div"); p.id = "np"; p.hidden = true;
  p.innerHTML = '<div id="nm"><p class="bot">أهلاً! أنا نوفا، اسألني أي سؤال 👋</p></div><form id="nf"><input id="ni" placeholder="اكتب سؤالك..." autocomplete="off"><button>إرسال</button></form>';
  document.body.append(b, p);
  b.onclick = () => { p.hidden = !p.hidden; };
  const m = p.querySelector("#nm"), add = (t, c) => { const e = document.createElement("p"); e.className = c; e.textContent = t; m.appendChild(e); m.scrollTop = m.scrollHeight; return e; };
  p.querySelector("#nf").onsubmit = async ev => {
    ev.preventDefault(); const i = p.querySelector("#ni"), q = i.value.trim(); if (!q) return;
    i.value = ""; add(q, "me"); const w = add("...", "bot");
    try { w.textContent = (await NovaBrain.ask(q)).text; } catch (e) { w.textContent = e.message; }
  };
})();