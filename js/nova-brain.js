/* ===== nova-brain.js — عقل نوفا المشترك =====
   1) بيكلم Gemini ويعرض الرد وهو بيتكتب (سريع).
   2) بيحتفظ بـ «ذاكرة المختبر»: الإجابات اللي الطالب أكدها أو صححها،
      ولما نفس السؤال يتسأل تاني بيجاوب بيها فوراً.
   المفتاح بيتقرأ من js/config.js (GEMINI_KEY / GEMINI_MODEL). */
(function () {
  var KB_KEY = "lab_kb", LAST_KEY = "lab_last";

  var BASE =
    "أنت نوفا، روبوت ودود ومعلمة حاسب لطلاب الثانوية في مختبر الذكاء. " +
    "جاوبي بالعامية المصرية المبسطة في 3 إلى 5 جمل قصيرة، ومعاها مثال بسيط لو لازم. " +
    "ابدئي بالإجابة مباشرة. ممنوع العناوين والجداول والنجوم. " +
    "موضوعك: الحاسب الآلي وعلوم الحاسب والذكاء الاصطناعي، ولو السؤال خارج الموضوع رجّعي الطالب بلطف. " +
    "لو مش متأكدة من معلومة قولي إنك مش متأكدة ومتخترعيش، وانصحي بمراجعة مصدر موثوق.";

  var EVAL_SYSTEM =
    "أنت نوفا، معلمة حاسب لطلاب الثانوية. طالب سألك سؤالاً وأجبتِ، ثم راجع إجابتك بره الموقع وجاء يقول لك هل كانت غلط أو ناقصة، وقد يكتب لك الصح أو مصدره. " +
    "قيّمي بصدق وبالأدلة: لو إجابتك فيها خطأ أو نقص فاعترفي وصححيها، ولو الطالب هو المخطئ فوضحي له بلطف، ولا توافقيه مجاملةً. " +
    "التزمي بهذا الشكل بالظبط:\n" +
    "السطر الأول كلمة واحدة بالإنجليزية فقط: STUDENT_RIGHT أو STUDENT_WRONG أو PARTIAL\n" +
    "ثم سطر فاضي\n" +
    "ثم ردك للطالب بالعامية المصرية في 3 إلى 5 جمل بدون رموز تنسيق\n" +
    "ثم سطر فاضي\n" +
    "ثم FINAL: وبعدها الإجابة النهائية الصحيحة للسؤال في جملتين إلى أربع جمل، ولا شيء بعدها.";

  var ctrl = null;

  // ---------- تطبيع العربي والمقارنة ----------
  var STOP = ["يعني","ايه","اي","هو","هي","ما","ماذا","ماهو","ماهي","من","في","علي","عن","لو","ده","دي","هل","كيف","ازاي",
              "فرق","بين","انا","عايز","عاوز","اشرح","اشرحلي","قولي","وضح","وضحلي","لي","ان","او","مع","هذا","هذه"];
  function norm(s) {
    return String(s).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^؀-ۿa-z0-9\s]/g, " ");
  }
  function tokens(s) {
    var out = [];
    norm(s).split(/\s+/).forEach(function (w) {
      if (!w) { return; }
      if (w.charAt(0) === "و" && w.length > 3) { w = w.slice(1); }
      if (w.indexOf("ال") === 0 && w.length > 3) { w = w.slice(2); }
      if (w.length > 1 && STOP.indexOf(w) < 0 && out.indexOf(w) < 0) { out.push(w); }
    });
    return out;
  }
  function sim(a, b) {
    var A = tokens(a), B = tokens(b);
    if (!A.length || !B.length) { return 0; }
    var inter = 0;
    A.forEach(function (w) { if (B.indexOf(w) >= 0) { inter++; } });
    return inter / (A.length + B.length - inter);
  }


  // ---------- مكتبة جاهزة من إجابات موثوقة (بتشتغل فوراً بدون إنترنت) ----------
  var SEED = [
    { q: "يعني إيه RAM", a: "الـ RAM هي الذاكرة العشوائية، ذاكرة مؤقتة وسريعة جداً بيحط فيها الجهاز البرامج والبيانات اللي شغال عليها دلوقتي. لما تقفل الجهاز بتتمسح. كل ما كانت أكبر قدر الجهاز يشغّل برامج أكتر مع بعض من غير بطء." },
    { q: "الفرق بين RAM و SSD", a: "الـ RAM ذاكرة مؤقتة سريعة جداً للشغل الحالي وبتتمسح لما الجهاز يفصل، أما الـ SSD فهو وحدة تخزين دائمة بتحفظ ملفاتك وبرامجك حتى والجهاز مقفول. الـ RAM أسرع بكتير لكن حجمها أصغر وأغلى." },
    { q: "الفرق بين نظام التشغيل والتطبيق", a: "نظام التشغيل زي ويندوز أو أندرويد هو البرنامج الأساسي اللي بيدير الجهاز والذاكرة والملفات وبيخلي باقي البرامج تشتغل. التطبيق برنامج بيعمل مهمة معينة زي المتصفح أو الآلة الحاسبة، وبيشتغل فوق نظام التشغيل." },
    { q: "يعني إيه خوارزمية", a: "الخوارزمية هي خطوات مرتبة وواضحة لحل مشكلة أو تنفيذ مهمة. زي وصفة الطبخ: لو اتبعت الخطوات بالترتيب توصل للنتيجة. البرامج كلها مبنية على خوارزميات." },
    { q: "إزاي الإنترنت بيوصل الصفحة لجهازي", a: "جهازك بيبعت طلب لخادم الموقع عن طريق عنوانه، والطلب بيتقسم لحزم صغيرة بتعدّي على راوترات كتير لحد ما توصل للخادم. الخادم يرد بحزم الصفحة وجهازك يجمّعها والمتصفح يعرضها." },
    { q: "يعني إيه الذكاء الاصطناعي", a: "الذكاء الاصطناعي هو جعل الحاسب يتصرف بطريقة تحاكي التفكير البشري، زي فهم الكلام والتعرف على الصور واتخاذ القرارات، وغالباً بيتعلم من كم كبير من البيانات بدل ما نكتب له كل خطوة." },
    { q: "يعني إيه تعلم الآلة", a: "تعلم الآلة فرع من الذكاء الاصطناعي بيخلي الحاسب يتعلم من أمثلة وبيانات سابقة ويحسّن أداءه، من غير ما المبرمج يكتب له قواعد لكل حالة." },
    { q: "يعني إيه ChatGPT وبيشتغل إزاي", a: "ChatGPT نموذج لغوي كبير اتدرّب على كمية ضخمة من النصوص، وبيتوقع الكلمة الأنسب اللي تيجي بعد الكلام اللي قدامه. عشان كده ممكن يغلط أحياناً فلازم نراجع إجاباته." },
    { q: "يعني إيه برومبت", a: "البرومبت هو الأمر أو السؤال اللي بتكتبه للذكاء الاصطناعي. كل ما كان أوضح وفيه دور وهدف وتفاصيل وشكل الإخراج المطلوب، كانت الإجابة أحسن." },
    { q: "يعني إيه نظام التشغيل", a: "نظام التشغيل هو البرنامج الأساسي في الجهاز، بيدير المعالج والذاكرة والملفات والأجهزة الملحقة، وبيوفر واجهة للمستخدم. أمثلة: ويندوز وأندرويد ولينكس وماك." },
    { q: "يعني إيه CPU", a: "الـ CPU هو المعالج، عقل الحاسب. بينفذ التعليمات ويعمل العمليات الحسابية والمنطقية، وسرعته بتتقاس بالجيجاهرتز وعدد أنوية." },
    { q: "يعني إيه شبكة حاسب", a: "الشبكة مجموعة أجهزة متصلة ببعض بتتبادل البيانات والموارد زي الإنترنت والطابعات المشتركة. ممكن تكون سلكية أو لاسلكية." },
    { q: "يعني إيه قاعدة بيانات", a: "قاعدة البيانات مكان منظم لتخزين المعلومات في جداول بحيث نقدر نضيف ونبحث ونعدّل بسرعة، زي بيانات الطلاب في المدرسة." },
    { q: "يعني إيه الأمن السيبراني", a: "الأمن السيبراني هو حماية الأجهزة والشبكات والبيانات من الاختراق والسرقة والتلف، عن طريق كلمات مرور قوية وتحديثات وبرامج حماية ووعي المستخدم." },
    { q: "يعني إيه التصيد الإلكتروني", a: "التصيد رسالة أو موقع مزيف بيتنكر في شكل جهة موثوقة عشان يخدعك وتديله كلمة السر أو بياناتك. متفتحش روابط مشبوهة وراجع عنوان الموقع قبل ما تدخل بياناتك." },
    { q: "يعني إيه بايت وبت", a: "البت هو أصغر وحدة بيانات وقيمته صفر أو واحد. كل 8 بت بيكوّنوا بايت، وبيها بنقيس حجم الملفات: كيلوبايت وميجابايت وجيجابايت." },
    { q: "يعني إيه البرمجة", a: "البرمجة هي كتابة تعليمات بلغة يفهمها الحاسب، زي بايثون أو جافاسكريبت، عشان ينفذ مهمة معينة." }
  ];
  function seedHit(q, min) {
    var b = null, bs = 0;
    SEED.forEach(function (e) { var s = sim(q, e.q); if (s > bs) { bs = s; b = e; } });
    return (b && bs >= min) ? { q: b.q, a: b.a, k: "seed", s: bs } : null;
  }

  // ---------- ذاكرة المختبر ----------
  function load() {
    try { var a = JSON.parse(localStorage.getItem(KB_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(KB_KEY, JSON.stringify(a.slice(-300))); } catch (e) {} }
  function scored(q) {
    return load().map(function (e) { return { e: e, s: sim(q, e.q) }; })
      .sort(function (x, y) { return y.s - x.s; });
  }
  function best(q, min) { var r = scored(q)[0]; return (r && r.s >= min) ? r.e : null; }
  function related(q) {
    return scored(q).filter(function (r) { return r.s >= 0.4 && r.s < 0.75; }).slice(0, 3).map(function (r) { return r.e; });
  }
  // kind: "ok" = الطالب أكد الإجابة، "fixed" = اتصححت
  function learn(q, a, kind) {
    var kb = load(), hit = null;
    for (var i = 0; i < kb.length; i++) { if (sim(q, kb[i].q) >= 0.75) { hit = kb[i]; break; } }
    if (hit) { hit.a = a; hit.k = kind; hit.t = Date.now(); }
    else { kb.push({ q: q, a: a, k: kind, t: Date.now() }); }
    save(kb);
  }
  function count() { return load().length; }
  function clear() { try { localStorage.removeItem(KB_KEY); } catch (e) {} }

  function setLast(q, a, src) { try { localStorage.setItem(LAST_KEY, JSON.stringify({ q: q, a: a, src: src })); } catch (e) {} }
  function getLast() {
    try { var l = JSON.parse(localStorage.getItem(LAST_KEY) || "null"); return (l && l.q && l.a) ? l : null; }
    catch (e) { return null; }
  }

  // ---------- Gemini (بث مباشر) ----------
  function friendly(e) {
    var m = e && e.message;
    if (m === "NO_KEY") { return "مفيش مفتاح Gemini. افتح ملف js/config.js وحط مفتاحك."; }
    if (e && (e.status === 503 || e.status === 429)) { return "الموديل مشغول دلوقتي، جرّب تاني بعد شوية."; }
    if (e && (e.status === 400 || e.status === 401 || e.status === 403)) { return "المفتاح مش شغال أو الموديل مش متاح. رسالة جوجل: " + m; }
    if (e && e.name === "TypeError") { return "في مشكلة في الاتصال بالإنترنت."; }
    if (m === "EMPTY") { return "نوفا ما ردتش المرة دي، جرّب تعيد السؤال."; }
    return "حصلت مشكلة: " + (m || "غير معروفة");
  }

  async function stream(system, contents, maxTokens, onChunk) {
    var hasKey = (typeof GEMINI_KEY !== "undefined") && GEMINI_KEY && GEMINI_KEY.indexOf("ضع_المفتاح") < 0;
    if (!hasKey) { throw new Error("NO_KEY"); }
    var model = (typeof GEMINI_MODEL !== "undefined") ? GEMINI_MODEL : "gemini-3.8-flash";
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + GEMINI_KEY;
    ctrl = new AbortController();
    var body = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: contents,
      generationConfig: { maxOutputTokens: maxTokens }
    });
    var res;
    for (var k = 0; k < 3; k++) {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, signal: ctrl.signal });
      if (res.ok || (res.status !== 503 && res.status !== 429)) { break; }
      await new Promise(function (r) { setTimeout(r, 800); });
    }
    if (!res.ok) {
      var err = await res.json().catch(function () { return {}; });
      var e = new Error((err.error && err.error.message) || ("HTTP " + res.status));
      e.status = res.status;
      throw e;
    }
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = "", full = "";
    while (true) {
      var c = await reader.read();
      if (c.done) { break; }
      buf += dec.decode(c.value, { stream: true });
      var lines = buf.split("\n");
      buf = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("data:") !== 0) { continue; }
        try {
          var j = JSON.parse(lines[i].slice(5));
          var parts = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
          var t = parts ? parts.map(function (p) { return p.text || ""; }).join("") : "";
          if (t) { full += t; if (onChunk) { onChunk(full); } }
        } catch (x) {}
      }
    }
    if (!full) { throw new Error("EMPTY"); }
    return full;
  }

  // ---------- السؤال: الأول الذاكرة، وبعدين Gemini ----------
  // history لازم تكون فيها رسالة الطالب الأخيرة (وعددها فردي)
  async function answer(q, history, onChunk) {
    var hit = best(q, 0.75);
    if (hit) { return { text: hit.a, source: "memory", kind: hit.k }; }
    var sh = seedHit(q, 0.7);
    if (sh) { return { text: sh.a, source: "memory", kind: "seed" }; }
    var sys = BASE, rel = related(q);
    var sr = seedHit(q, 0.4);
    if (sr && rel.length < 3) { rel.push(sr); }
    if (rel.length) {
      sys += "\n\nمعلومات مؤكدة من ذاكرة المختبر (لو ليها علاقة بالسؤال فالتزمي بيها حتى لو اختلفت عن معلوماتك):\n" +
        rel.map(function (e) { return "- سؤال: " + e.q + " | إجابة مؤكدة: " + e.a; }).join("\n");
    }
    var text = await stream(sys, history.slice(-9), 350, onChunk);
    return { text: text, source: "ai" };
  }

  // ---------- محطة 2: تقييم رأي الطالب ----------
  async function evaluate(q, a, verdictText, note, onChunk) {
    var msg = "السؤال: " + q + "\nإجابتك السابقة: " + a + "\nحكم الطالب: " + verdictText +
      "\nملاحظة الطالب (الصح أو المصدر): " + (note || "لا توجد");
    return stream(EVAL_SYSTEM, [{ role: "user", parts: [{ text: msg }] }], 500, onChunk);
  }
  function parseEval(t) {
    var m = t.match(/^\s*(STUDENT_RIGHT|STUDENT_WRONG|PARTIAL)/);
    var start = m ? m[0].length : 0, i = t.indexOf("FINAL:");
    return {
      verdict: m ? m[1] : null,
      msg: (i >= 0 ? t.slice(start, i) : t.slice(start)).trim(),
      fin: i >= 0 ? t.slice(i + 6).trim() : ""
    };
  }

  // توليد عام (للمحطة 3): نظام + رسالة واحدة
  function generate(system, userText, maxTokens, onChunk) {
    return stream(system, [{ role: "user", parts: [{ text: userText }] }], maxTokens || 500, onChunk);
  }

  function cancel() { if (ctrl) { try { ctrl.abort(); } catch (e) {} ctrl = null; } }
  function clean(t) { return String(t).replace(/[*#`_]/g, "").replace(/[ \t]+/g, " "); }

  window.NovaBrain = {
    answer: answer, generate: generate, evaluate: evaluate, parseEval: parseEval, learn: learn, count: count, clear: clear,
    setLast: setLast, getLast: getLast, friendly: friendly, cancel: cancel, clean: clean
  };
})();
