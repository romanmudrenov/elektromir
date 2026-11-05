/* Премиальный слой: объёмные иконки, реакция на курсор, лёгкий параллакс, волна на кнопках.
   Подключается автоматически из js/layout.js.
   Отключить: удалите блок «Премиальный слой» в конце js/layout.js. */
(function () {
  "use strict";

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var root = document.documentElement;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Волна при нажатии на кнопку ---------- */
  if (!reduce) {
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (!b || b.disabled) return;
      var r = b.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2;
      var s = document.createElement("span");
      s.className = "ripple";
      s.style.width = s.style.height = size + "px";
      s.style.left = (e.clientX - r.left - size / 2) + "px";
      s.style.top = (e.clientY - r.top - size / 2) + "px";
      b.appendChild(s);
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 750);
    }, { passive: true });
  }

  /* ---------- Объёмные иконки ---------- */
  var GLYPHS = {
    drop: '<path d="M12 3c3.2 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.8 7 12 3z"/>',
    infinity: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    list: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15v4M17 17h4"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>'
  };

  function makeGem(name, n, idx) {
    var g = document.createElement("span");
    g.className = "gem";
    g.setAttribute("aria-hidden", "true");
    if (n) g.setAttribute("data-n", n);
    g.style.setProperty("--dl", (-idx * 1.1).toFixed(1) + "s");
    g.style.setProperty("--dur", (6 + (idx % 3) * 0.9).toFixed(1) + "s");
    g.innerHTML =
      '<span class="gem-float"><span class="gem-3d">' +
      '<i class="gem-back"></i><i class="gem-mid"></i><i class="gem-glass"></i>' +
      '<svg class="gem-glyph" viewBox="0 0 24 24">' + GLYPHS[name] + "</svg>" +
      "</span></span>";
    return g;
  }

  var gems = [];
  function addGems(selector, names, numbered) {
    var items = document.querySelectorAll(selector);
    Array.prototype.forEach.call(items, function (li, i) {
      var name = names[i % names.length];
      var g = makeGem(name, numbered ? String(i + 1) : "", gems.length);
      li.insertBefore(g, li.firstChild);
      gems.push(g);
    });
  }

  if (document.querySelector(".facts li, .steps li")) {
    // общий металлический градиент для линий иконок
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    defs.setAttribute("width", "0");
    defs.setAttribute("height", "0");
    defs.setAttribute("aria-hidden", "true");
    defs.style.position = "absolute";
    defs.innerHTML =
      '<defs><linearGradient id="gemMetal" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f48fc3"/><stop offset=".5" stop-color="#d1337f"/><stop offset="1" stop-color="#7a1452"/>' +
      "</linearGradient></defs>";
    document.body.appendChild(defs);

    addGems(".facts li", ["drop", "infinity", "shield", "list"], false);
    addGems(".steps li", ["chat", "list", "spark", "heart"], true);
  }

  /* Реакция иконок на курсор и касание */
  if (gems.length && !reduce) {
    var px = -9999, py = -9999, queued = false;

    var update = function () {
      queued = false;
      var vh = window.innerHeight;
      gems.forEach(function (g) {
        var r = g.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = px - cx, dy = py - cy;
        var R = 260;
        var el = g.querySelector(".gem-3d");
        var rx = 0, ry = 0, mx = 28, my = 18;
        if (Math.sqrt(dx * dx + dy * dy) < R) {
          ry = clamp(dx / R * 30, -30, 30);
          rx = clamp(-dy / R * 30, -30, 30);
          mx = 50 + clamp(dx / R, -1, 1) * 34;
          my = 50 + clamp(dy / R, -1, 1) * 34;
        }
        el.style.setProperty("--rx", rx.toFixed(1) + "deg");
        el.style.setProperty("--ry", ry.toFixed(1) + "deg");
        el.style.setProperty("--mx", mx.toFixed(0) + "%");
        el.style.setProperty("--my", my.toFixed(0) + "%");
      });
    };
    var move = function (x, y) {
      px = x; py = y;
      if (!queued) { queued = true; requestAnimationFrame(update); }
    };

    document.addEventListener("pointermove", function (e) { move(e.clientX, e.clientY); }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      var t = e.touches && e.touches[0];
      if (t) move(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { move(-9999, -9999); });
    document.addEventListener("touchend", function () { setTimeout(function () { move(-9999, -9999); }, 700); }, { passive: true });
  }

  /* ---------- Мягкий параллакс ---------- */
  if (!reduce) {
    var hero = document.querySelector(".hero");
    var art = hero && hero.querySelector(".skin");
    var txt = hero && hero.querySelector(".wrap > div");
    var busy = false;

    var run = function () {
      busy = false;
      var y = window.pageYOffset || 0;
      if (hero && y < hero.offsetHeight + 240) {
        if (art) art.style.translate = "0 " + (y * 0.1).toFixed(1) + "px";
        if (txt) txt.style.translate = "0 " + (y * 0.035).toFixed(1) + "px";
      }
      document.body.style.setProperty("--py", Math.min(y * 0.03, 30).toFixed(1));
    };
    window.addEventListener("scroll", function () {
      if (!busy) { busy = true; requestAnimationFrame(run); }
    }, { passive: true });
    run();
  }
})();
