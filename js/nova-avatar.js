// ===== شكل نوفا + الدايرة السحرية (على طريقة دكتور سترينج) =====
(function () {
  var CSS = [
    ".na{position:relative;display:inline-block;line-height:0}",
    ".na svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 8px rgba(255,150,40,.55))}",
    ".na-r1{animation:na-spin 28s linear infinite;transform-origin:150px 150px}",
    ".na-r2{animation:na-rev 20s linear infinite;transform-origin:150px 150px}",
    ".na-r3{animation:na-spin 40s linear infinite;transform-origin:150px 150px}",
    ".na-sp1{animation:na-spin 7s linear infinite;transform-origin:150px 150px}",
    ".na-sp2{animation:na-rev 11s linear infinite;transform-origin:150px 150px}",
    ".na-bot{animation:na-float 3.4s ease-in-out infinite}",
    ".na-eyes{filter:drop-shadow(0 0 5px #22e5ff)}",
    ".na-eye{animation:na-blink 4.6s infinite;transform-box:fill-box;transform-origin:center}",
    ".na-core{animation:na-pulse 2.4s ease-in-out infinite;transform-origin:150px 150px}",
    "@keyframes na-spin{to{transform:rotate(360deg)}}",
    "@keyframes na-rev{to{transform:rotate(-360deg)}}",
    "@keyframes na-float{0%,100%{transform:translateY(-3px)}50%{transform:translateY(4px)}}",
    "@keyframes na-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}",
    "@keyframes na-pulse{0%,100%{opacity:.55}50%{opacity:1}}"
  ].join("");

  function injectCss() {
    if (document.getElementById("na-css")) { return; }
    var st = document.createElement("style");
    st.id = "na-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function ticks(r1, r2, count, color, width) {
    var out = "";
    for (var i = 0; i < count; i++) {
      var a = (i * 360 / count) * Math.PI / 180;
      var x1 = (150 + r1 * Math.cos(a)).toFixed(1);
      var y1 = (150 + r1 * Math.sin(a)).toFixed(1);
      var x2 = (150 + r2 * Math.cos(a)).toFixed(1);
      var y2 = (150 + r2 * Math.sin(a)).toFixed(1);
      out += "<line x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' stroke='" + color + "' stroke-width='" + width + "'/>";
    }
    return out;
  }
  function sparks(r, count, size, color) {
    var out = "";
    for (var i = 0; i < count; i++) {
      var a = (i * 360 / count) * Math.PI / 180;
      var x = (150 + r * Math.cos(a)).toFixed(1);
      var y = (150 + r * Math.sin(a)).toFixed(1);
      var s = (i % 2 === 0) ? size : size * 0.6;
      out += "<circle cx='" + x + "' cy='" + y + "' r='" + s + "' fill='" + color + "'/>";
    }
    return out;
  }

 function build(id) {
  var gold = "#ffa62b";
  var s = "<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'>";
  s += "<defs>";
  s += "<radialGradient id='" + id + "g' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='#1e3a8a' stop-opacity='.55'/><stop offset='100%' stop-color='#1e3a8a' stop-opacity='0'/></radialGradient>";
  s += "<linearGradient id='" + id + "m' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#ffffff'/><stop offset='100%' stop-color='#cfe0ff'/></linearGradient>";
  s += "<filter id='" + id + "f' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='6'/></filter>";
  s += "</defs>";

  // خلفية متوهجة
  s += "<circle cx='150' cy='150' r='112' fill='url(#" + id + "g)'/>";

  // حلقة النار
 
  // الروبوت
  s += "<g transform='translate(150,150)'><g class='na-bot'>";
  s += "<line x1='0' y1='-46' x2='0' y2='-66' stroke='#9fb8d8' stroke-width='3'/>";
  s += "<circle cx='0' cy='-70' r='6' fill='" + gold + "'/>";
  s += "<rect x='-30' y='36' width='60' height='24' rx='11' fill='url(#" + id + "m)'/>";
  s += "<rect x='-62' y='-18' width='12' height='30' rx='6' fill='#3b82f6'/>";
  s += "<rect x='50' y='-18' width='12' height='30' rx='6' fill='#3b82f6'/>";
  s += "<rect x='-50' y='-46' width='100' height='88' rx='28' fill='url(#" + id + "m)'/>";
  s += "<rect x='-37' y='-30' width='74' height='46' rx='18' fill='#06122b'/>";
  s += "<g class='na-eyes'>";
  s += "<ellipse class='na-eye' cx='-17' cy='-8' rx='8.5' ry='11' fill='#22e5ff'/>";
  s += "<ellipse class='na-eye' cx='17' cy='-8' rx='8.5' ry='11' fill='#22e5ff'/>";
  s += "</g>";
  s += "<rect x='-10' y='26' width='20' height='3.5' rx='2' fill='#7a96bd'/>";
  s += "<rect x='-6' y='-46' width='12' height='4' rx='2' fill='" + gold + "'/>";
  s += "</g></g>";

  s += "</svg>";
  return s;
}
window.novaAvatar = function (size) {
  injectCss();
  var id = "na" + Math.floor(Math.random() * 1000000);
  return "<div class='na' style='width:" + size + "px;height:" + size + "px'>" + build(id) + "</div>";
};

function patch() {
  var btn = document.getElementById("nova-btn");
  if (btn && !btn.getAttribute("data-na")) {
    btn.setAttribute("data-na", "1");
    btn.innerHTML = window.novaAvatar(96);
    btn.style.setProperty("background", "transparent", "important");
    btn.style.setProperty("box-shadow", "none", "important");
    btn.style.setProperty("border", "none", "important");
    btn.style.setProperty("padding", "0", "important");
    btn.style.setProperty("width", "96px", "important");
    btn.style.setProperty("height", "96px", "important");
  }
    ["ak-bot", "sf-bot", "tk-bot"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.getAttribute("data-na")) {
        el.setAttribute("data-na", "1");
        el.innerHTML = window.novaAvatar(92);
        el.style.setProperty("background", "transparent", "important");
        el.style.setProperty("width", "92px", "important");
        el.style.setProperty("height", "92px", "important");
      }
    });
  }

  var tries = 0;
  function loop() {
    patch();
    tries++;
    if (tries < 20) { setTimeout(loop, 300); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loop);
  } else {
    loop();
  }
})();