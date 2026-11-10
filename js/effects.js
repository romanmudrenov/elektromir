/* Эффекты сайта «Электромир»: лепестки и сердечки, плавные волны (главная и подвал), объёмные иконки,
   плавное появление блоков, раскачивание блоков при прокрутке. Стили лежат в css/backgrounds.css.
   Включается из js/layout.js. Легче для телефона: частицы рисуются готовыми картинками,
   цикл анимации спит, когда на экране пусто. Всё можно отключить в меню «Настройки». */
(function () {
  "use strict";

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var isTouch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var root = document.documentElement;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function allowed(key) {
    var c = window.SETTINGS && window.SETTINGS.get();
    return !c || !!c[key];
  }
  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* =====================================================================
     1. ЛЕПЕСТКИ РОЗ И СЕРДЕЧКИ
     ===================================================================== */
  var burst = function () {}, fountain = function () {}, trailOne = function () {};

  if (!reduce) {
    var PETAL_COLORS = ["#F9A8C9", "#F0629F", "#E04A86", "#FFC3D8", "#F27BA8"];
    var HEART_COLORS = ["#C81E85", "#E8479B", "#F58DBE", "#FF7FB6", "#F25C9C"];

    var petalSprite = function (color) {
      var c = document.createElement("canvas");
      c.width = c.height = 64;
      var x = c.getContext("2d");
      x.translate(32, 32);
      x.beginPath();
      x.moveTo(0, -27);
      x.bezierCurveTo(24, -24, 27, 8, 7, 27);
      x.bezierCurveTo(3, 29, -3, 29, -7, 27);
      x.bezierCurveTo(-27, 8, -24, -24, 0, -27);
      x.closePath();
      x.fillStyle = color;
      x.fill();
      var g = x.createLinearGradient(-16, -24, 16, 26);
      g.addColorStop(0, "rgba(255,255,255,.55)");
      g.addColorStop(0.55, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(90,10,50,.28)");
      x.fillStyle = g;
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.4)";
      x.lineWidth = 1.4;
      x.beginPath();
      x.moveTo(0, -20);
      x.quadraticCurveTo(3, 0, 0, 20);
      x.stroke();
      return c;
    };

    var heartSprite = function (color) {
      var c = document.createElement("canvas");
      c.width = c.height = 64;
      var x = c.getContext("2d");
      x.translate(32, 34);
      x.beginPath();
      x.moveTo(0, 24);
      x.bezierCurveTo(-34, -2, -20, -30, 0, -12);
      x.bezierCurveTo(20, -30, 34, -2, 0, 24);
      x.closePath();
      x.fillStyle = color;
      x.fill();
      x.fillStyle = "rgba(255,255,255,.42)";
      x.beginPath();
      x.ellipse(-10, -12, 7, 4, -0.6, 0, Math.PI * 2);
      x.fill();
      return c;
    };

    var sprites = { petal: PETAL_COLORS.map(petalSprite), heart: HEART_COLORS.map(heartSprite) };

    var canvas = document.createElement("canvas");
    canvas.className = "fx-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    if (ctx) {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var W = 0, H = 0;
      var resize = function () {
        var w = window.innerWidth, h = window.innerHeight;
        if (w === W && Math.abs(h - H) < 150) return;
        W = w; H = h;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      };
      resize();
      window.addEventListener("resize", resize);

      var parts = [];
      var MAX = isTouch ? 40 : 70;
      var raf = 0, last = 0;

      var add = function (p) {
        if (parts.length >= MAX) parts.shift();
        parts.push(p);
        if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
      };

      var make = function (kind, x, y, o) {
        return {
          kind: kind, sp: pick(sprites[kind]), x: x, y: y,
          vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, drag: o.drag || 1,
          size: o.size, rot: rnd(0, 6.283), vr: o.vr === undefined ? rnd(-0.05, 0.05) : o.vr,
          flip: rnd(0, 6.283), fv: o.fv || rnd(0.04, 0.09),
          sway: o.sway || 0, ph: rnd(0, 6.283),
          life: o.life, age: 0, maxA: o.maxA || 1
        };
      };

      var frame = function (t) {
        var dt = last ? Math.min(t - last, 50) : 16.67;
        last = t;
        var k = dt / 16.67;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i];
          p.age += k;
          p.vx *= p.drag;
          p.vy = p.vy * p.drag + p.g * k;
          p.x += p.vx * k + (p.sway ? Math.sin(p.age * 0.03 + p.ph) * p.sway : 0);
          p.y += p.vy * k;
          p.rot += p.vr * k;
          p.flip += p.fv * k;

          if (p.age >= p.life || p.y < -70 || p.y > H + 70 || p.x < -70 || p.x > W + 70) {
            parts.splice(i, 1);
            continue;
          }
          var tt = p.age / p.life;
          var a = tt < 0.08 ? tt / 0.08 : (tt > 0.85 ? (1 - tt) / 0.15 : 1);
          if (a <= 0) continue;

          var sc = p.size / 64;
          var fx = p.kind === "petal" ? Math.max(0.3, Math.abs(Math.cos(p.flip))) : 1;
          var cs = Math.cos(p.rot), sn = Math.sin(p.rot);
          ctx.globalAlpha = a * p.maxA;
          ctx.setTransform(cs * sc * fx * dpr, sn * sc * fx * dpr, -sn * sc * dpr, cs * sc * dpr, p.x * dpr, p.y * dpr);
          ctx.drawImage(p.sp, -32, -32);
        }
        ctx.globalAlpha = 1;

        if (parts.length) raf = requestAnimationFrame(frame);
        else { raf = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
      };

      /* Взрыв из лепестков и сердечек (тап, клик) */
      burst = function (x, y, n) {
        if (!allowed("petals")) return;
        for (var i = 0; i < n; i++) {
          if (i % 2 === 0) {
            add(make("petal", x, y, {
              vx: rnd(-2.2, 2.2), vy: rnd(-3.4, -0.8), g: 0.09, drag: 0.985,
              size: rnd(13, 21), life: rnd(55, 90), sway: 0.25
            }));
          } else {
            add(make("heart", x, y, {
              vx: rnd(-1.6, 1.6), vy: rnd(-3.4, -1.2), g: -0.012, drag: 0.98,
              size: rnd(12, 20), life: rnd(55, 90), vr: rnd(-0.02, 0.02), fv: 0
            }));
          }
        }
      };

      /* Фонтан при успешной отправке заявки */
      fountain = function (x, y) {
        if (!allowed("petals")) return;
        var wave = function (n) {
          for (var i = 0; i < n; i++) {
            add(make("heart", x, y, {
              vx: rnd(-2.6, 2.6), vy: rnd(-6.5, -2.4), g: 0.03, drag: 0.985,
              size: rnd(16, 26), life: rnd(80, 120), vr: rnd(-0.03, 0.03), fv: 0
            }));
            add(make("petal", x, y, {
              vx: rnd(-3.2, 3.2), vy: rnd(-6, -2), g: 0.08, drag: 0.985,
              size: rnd(15, 24), life: rnd(90, 130), sway: 0.3
            }));
          }
        };
        wave(isTouch ? 6 : 9);
        setTimeout(function () { wave(isTouch ? 4 : 6); }, 260);
      };

      /* Лёгкий след при проведении пальцем */
      trailOne = function (x, y) {
        if (!allowed("petals")) return;
        if (Math.random() < 0.5) {
          add(make("petal", x, y, { vx: rnd(-0.5, 0.5), vy: rnd(0.2, 0.9), g: 0.02, drag: 0.98, size: rnd(11, 16), life: rnd(45, 70), sway: 0.3, maxA: 0.9 }));
        } else {
          add(make("heart", x, y, { vx: rnd(-0.4, 0.4), vy: rnd(-0.9, -0.3), g: -0.01, drag: 0.98, size: rnd(10, 15), life: rnd(45, 70), fv: 0, maxA: 0.9 }));
        }
      };

      /* Периодические пролёты: лепестки падают вниз, сердечки поднимаются вверх */
      var fallPetal = function () {
        var vy = rnd(1.0, 1.7);
        add(make("petal", rnd(0, W), -40, {
          vx: rnd(-0.25, 0.25), vy: vy, size: rnd(18, 28), life: (H + 110) / vy,
          sway: rnd(0.4, 0.9), vr: rnd(-0.03, 0.03), maxA: 0.85
        }));
      };
      var riseHeart = function () {
        var vy = rnd(1.0, 1.7);
        add(make("heart", rnd(0, W), H + 40, {
          vx: rnd(-0.2, 0.2), vy: -vy, size: rnd(15, 24), life: (H + 110) / vy,
          sway: rnd(0.3, 0.7), vr: rnd(-0.015, 0.015), fv: 0, maxA: 0.8
        }));
      };
      var tick = function () {
        if (!document.hidden && allowed("petals")) {
          if (Math.random() < 0.55) fallPetal(); else riseHeart();
          if (!isTouch && Math.random() < 0.35) { if (Math.random() < 0.5) fallPetal(); else riseHeart(); }
        }
        setTimeout(tick, isTouch ? rnd(3200, 5600) : rnd(2200, 4200));
      };
      setTimeout(tick, 1800);

      document.addEventListener("visibilitychange", function () {
        if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
        else if (!document.hidden && parts.length && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      });

      /* Тап и клик по экрану */
      document.addEventListener("click", function (e) {
        if (!e.clientX && !e.clientY) return;
        if (e.target.closest && e.target.closest("input,textarea,select")) return;
        burst(e.clientX, e.clientY, isTouch ? 3 : 6);
      }, { passive: true });

      /* След за пальцем (на мышке следа нет, чтобы не нагружать) */
      var tx = 0, ty = 0, tt = 0;
      document.addEventListener("touchmove", function (e) {
        var t = e.touches && e.touches[0];
        if (!t) return;
        var now = Date.now();
        if (now - tt < 170) return;
        var dx = t.clientX - tx, dy = t.clientY - ty;
        if (dx * dx + dy * dy < 1600) return;
        tx = t.clientX; ty = t.clientY; tt = now;
        trailOne(t.clientX, t.clientY);
      }, { passive: true });
    }
  }

  /* =====================================================================
     2. КНОПКИ: волна при нажатии
     ===================================================================== */
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

  /* =====================================================================
     3. ОБЪЁМНЫЕ ИКОНКИ (стекло и металл)
     ===================================================================== */
  var GLYPHS = {
    drop: '<path d="M12 3c3.2 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.8 7 12 3z"/>',
    infinity: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    list: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15v4M17 17h4"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>'
  };

  var gems = [];
  var makeGem = function (name, idx) {
    var g = document.createElement("span");
    g.className = "gem";
    g.setAttribute("aria-hidden", "true");
    g.style.setProperty("--dl", (-idx * 1.1).toFixed(1) + "s");
    g.style.setProperty("--dur", (6 + (idx % 3) * 0.9).toFixed(1) + "s");
    g.innerHTML =
      '<span class="gem-float"><span class="gem-3d">' +
      '<i class="gem-back"></i><i class="gem-glass"><span class="gem-shine"></span></i>' +
      '<svg class="gem-glyph" viewBox="0 0 24 24">' + GLYPHS[name] + "</svg>" +
      "</span></span>";
    return g;
  };
  var addGems = function (selector, names) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (li, i) {
      var g = makeGem(names[i % names.length], gems.length);
      li.insertBefore(g, li.firstChild);
      gems.push(g);
    });
  };

  if (document.querySelector(".facts li, .steps li")) {
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
    addGems(".facts li", ["drop", "infinity", "shield", "list"]);
    addGems(".steps li", ["chat", "list", "spark", "heart"]);
  }

  /* Наклон иконок за курсором и пальцем: меняем только transform, без перерисовки */
  if (gems.length && !reduce && "IntersectionObserver" in window) {
    var gstate = gems.map(function (g) {
      return { g: g, el: g.querySelector(".gem-3d"), shine: g.querySelector(".gem-shine"), rx: 0, ry: 0, sx: 0, sy: 0, vis: false };
    });
    var gio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        gstate.forEach(function (s) { if (s.g === en.target) s.vis = en.isIntersecting; });
      });
    }, { rootMargin: "120px" });
    gstate.forEach(function (s) { gio.observe(s.g); });

    var gp = { x: -9999, y: -9999 }, graf = 0;
    var gemFrame = function () {
      graf = 0;
      var busy = false;
      var rects = gstate.map(function (s) { return s.vis ? s.g.getBoundingClientRect() : null; });
      gstate.forEach(function (s, i) {
        var r = rects[i];
        if (!r) return;
        var dx = gp.x - (r.left + r.width / 2), dy = gp.y - (r.top + r.height / 2);
        var R = 240, near = dx * dx + dy * dy < R * R;
        var trx = near ? clamp(-dy / R * 28, -28, 28) : 0;
        var try_ = near ? clamp(dx / R * 28, -28, 28) : 0;
        var tsx = near ? clamp(dx / R, -1, 1) * 26 : 0;
        var tsy = near ? clamp(dy / R, -1, 1) * 26 : 0;
        s.rx += (trx - s.rx) * 0.18; s.ry += (try_ - s.ry) * 0.18;
        s.sx += (tsx - s.sx) * 0.18; s.sy += (tsy - s.sy) * 0.18;
        if (Math.abs(trx - s.rx) > 0.05 || Math.abs(try_ - s.ry) > 0.05) busy = true;
        s.el.style.transform = "rotateX(" + s.rx.toFixed(1) + "deg) rotateY(" + s.ry.toFixed(1) + "deg)";
        s.shine.style.transform = "translate(" + s.sx.toFixed(1) + "%," + s.sy.toFixed(1) + "%)";
      });
      if (busy) graf = requestAnimationFrame(gemFrame);
    };
    var gemKick = function (x, y) {
      gp.x = x; gp.y = y;
      if (!graf) graf = requestAnimationFrame(gemFrame);
    };
    document.addEventListener("pointermove", function (e) { gemKick(e.clientX, e.clientY); }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      var t = e.touches && e.touches[0];
      if (t) gemKick(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener("touchend", function () { setTimeout(function () { gemKick(-9999, -9999); }, 500); }, { passive: true });
  }

  /* =====================================================================
     5. ПЛАВНОЕ ПОЯВЛЕНИЕ БЛОКОВ
     ===================================================================== */
  var SELECTORS = [
    ".facts li", ".steps li", "main section h2", ".page-head h1", ".page-head p",
    ".price-row", ".faq details", ".review", ".case", ".news-item", ".product",
    ".contact-card", ".note-box", ".contact-list li"
  ].join(",");

  var io = null, register = function () {};
  try {
    if (!reduce && "IntersectionObserver" in window) {
      root.classList.add("fx");
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          io.unobserve(el);
          el.classList.add("in");
          var d = parseInt(el.style.getPropertyValue("--d"), 10) || 0;
          setTimeout(function () { el.classList.add("done"); }, d + 1000);
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });

      register = function (el) {
        if (el.__fx) return;
        if (el.closest(".site-header,.site-footer")) return;
        if (el.tagName === "H2" && el.closest(".contact-card,.news-item,.case,.summary")) return;
        el.__fx = true;
        var idx = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        el.style.setProperty("--d", Math.min(idx, 5) * 80 + "ms");
        el.classList.add("reveal");
        io.observe(el);
      };
    }
  } catch (err) {
    root.classList.remove("fx");
    io = null;
  }

  var scan = function () {
    if (io) Array.prototype.forEach.call(document.querySelectorAll(SELECTORS), register);
  };
  scan();

  var scheduled = false;
  new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });

  /* =====================================================================
     6. КОРЗИНА И УСПЕШНАЯ ОТПРАВКА ФОРМ
     ===================================================================== */
  document.addEventListener("cart:change", function () {
    var b = document.getElementById("cartCount");
    if (!b) return;
    b.classList.remove("pop");
    void b.offsetWidth;
    b.classList.add("pop");
  });

  var okState = typeof WeakMap === "function" ? new WeakMap() : null;
  if (okState) {
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        var el = m.target;
        if (!el.classList || !el.classList.contains("form-msg")) return;
        var ok = el.classList.contains("show") && !el.classList.contains("error");
        var was = okState.get(el) || false;
        okState.set(el, ok);
        if (ok && !was) {
          var form = el.closest("form");
          var btn = form && form.querySelector("button[type=submit]");
          var c = center(btn || el);
          fountain(c.x, c.y);
          if (window.Sound) window.Sound.tap("bell");
        }
      });
    }).observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: true });
  }

  /* =====================================================================
     7. ПЛАВНЫЕ ВОЛНЫ: шёлковые ленты на главной и неон в подвале
     ===================================================================== */
  var TAU = 6.283185;

  /* Плавная кривая через точки (без изломов) */
  function smoothLine(cx, pts, move) {
    if (move) cx.moveTo(pts[0][0], pts[0][1]); else cx.lineTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length - 1; i++) {
      cx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    var l = pts[pts.length - 1];
    cx.lineTo(l[0], l[1]);
  }

  /* Общий движок сцены: размер, 30 кадров/с, пауза вне экрана, настройки */
  function Scene(canvas, draw, minFrameMs) {
    var cx = canvas.getContext("2d");
    if (!cx || !window.requestAnimationFrame) return;
    var sd = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 1, h = 1, raf = 0, last = 0, vis = true;

    function size() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * sd);
      canvas.height = Math.round(h * sd);
    }
    function paint(time) {
      cx.setTransform(sd, 0, 0, sd, 0, 0);
      cx.clearRect(0, 0, w, h);
      draw(cx, w, h, time);
      cx.globalCompositeOperation = "source-over";
      cx.globalAlpha = 1;
    }
    function on() { return !reduce && allowed("waves"); }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < minFrameMs) return;
      last = t;
      paint(t * 0.001);
    }
    function start() { if (!raf && on() && vis && !document.hidden) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    size();
    paint(2);
    start();

    if (window.ResizeObserver) {
      new ResizeObserver(function () { size(); if (!raf) paint(2); }).observe(canvas);
    } else {
      window.addEventListener("resize", function () { size(); if (!raf) paint(2); });
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
    document.addEventListener("settings:change", function () { if (on()) start(); else { stop(); paint(2); } });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { vis = en.isIntersecting; if (vis) start(); else stop(); });
      }, { threshold: 0.01 }).observe(canvas);
    }
  }

  /* --- Главная: 5 шёлковых лент в стиле PlayStation, от края до края --- */
  var HERO_WAVES = [
    { y: 0.50, a: 0.050, f: 0.80, s: 0.42, p: 0.3, th: 0.090, c1: "255,100,180", c2: "190,100,255" },
    { y: 0.62, a: 0.070, f: 1.10, s: -0.36, p: 1.9, th: 0.110, c1: "190,100,255", c2: "255,130,200" },
    { y: 0.74, a: 0.050, f: 0.70, s: 0.30, p: 3.2, th: 0.085, c1: "255,140,205", c2: "140,165,255" },
    { y: 0.84, a: 0.080, f: 1.00, s: -0.48, p: 4.5, th: 0.120, c1: "140,165,255", c2: "255,95,180" },
    { y: 0.93, a: 0.055, f: 1.35, s: 0.34, p: 5.7, th: 0.095, c1: "255,75,170", c2: "200,110,255" }
  ];

  var drawHero = function (cx, w, h, time) {
    var step = w < 520 ? 10 : 7;
    var n = Math.ceil((w + 24) / step);
    HERO_WAVES.forEach(function (wv) {
      var tops = [], bots = [];
      for (var i = 0; i <= n; i++) {
        var u = i / n, x = -12 + (w + 24) * u;
        var yc = wv.y * h + wv.a * h * (Math.sin(u * TAU * wv.f + time * wv.s + wv.p) +
          0.28 * Math.sin(u * TAU * wv.f * 1.9 - time * wv.s * 1.3 + wv.p * 2));
        var tw = wv.th * h * (0.62 + 0.38 * Math.sin(u * TAU * 0.8 + time * 0.5 + wv.p));
        tops.push([x, yc - tw / 2]);
        bots.push([x, yc + tw / 2]);
      }
      var botsRev = bots.slice().reverse();
      var ribbon = function () {
        cx.beginPath();
        smoothLine(cx, tops, true);
        smoothLine(cx, botsRev, false);
        cx.closePath();
      };

      /* тень под лентой: глубина */
      cx.save();
      cx.translate(0, h * 0.022);
      ribbon();
      cx.fillStyle = "rgba(150,40,110,.07)";
      cx.fill();
      cx.restore();

      /* тело ленты: переливается от одного цвета к другому */
      var g = cx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(" + wv.c1 + ",.34)");
      g.addColorStop(0.5, "rgba(" + wv.c2 + ",.46)");
      g.addColorStop(1, "rgba(" + wv.c1 + ",.34)");
      ribbon();
      cx.fillStyle = g;
      cx.fill();

      /* глянцевый блик сверху */
      var top = (wv.y - wv.th * 1.4 - wv.a) * h, bottom = (wv.y + wv.th * 1.2 + wv.a) * h;
      var lg = cx.createLinearGradient(0, top, 0, bottom);
      lg.addColorStop(0, "rgba(255,255,255,.55)");
      lg.addColorStop(0.5, "rgba(255,255,255,.08)");
      lg.addColorStop(1, "rgba(255,255,255,0)");
      ribbon();
      cx.fillStyle = lg;
      cx.fill();

      /* кромки: яркая верхняя и мягкая нижняя */
      var eg = cx.createLinearGradient(0, 0, w, 0);
      eg.addColorStop(0, "rgba(255,255,255,.95)");
      eg.addColorStop(0.5, "rgba(" + wv.c2 + ",.95)");
      eg.addColorStop(1, "rgba(255,255,255,.95)");
      cx.lineCap = "round";
      cx.lineJoin = "round";
      cx.beginPath();
      smoothLine(cx, tops, true);
      cx.strokeStyle = "rgba(" + wv.c2 + ",.16)";
      cx.lineWidth = 9;
      cx.stroke();
      cx.strokeStyle = eg;
      cx.lineWidth = 1.8;
      cx.stroke();
      cx.beginPath();
      smoothLine(cx, bots, true);
      cx.strokeStyle = "rgba(" + wv.c1 + ",.38)";
      cx.lineWidth = 1.1;
      cx.stroke();
    });
  };

  /* --- Подвал: 4 неоновые розовые волны по высоте --- */
  var FOOT_WAVES = [
    { y: 0.16, a: 0.070, f: 0.80, s: 0.50, p: 0.2, c: "255,70,170", d: 0 },
    { y: 0.38, a: 0.100, f: 1.10, s: -0.40, p: 1.8, c: "255,115,205", d: 1 },
    { y: 0.62, a: 0.060, f: 0.70, s: 0.35, p: 3.4, c: "235,85,255", d: 2 },
    { y: 0.86, a: 0.090, f: 1.30, s: -0.55, p: 4.9, c: "255,60,160", d: 3 }
  ];

  var drawFoot = function (cx, w, h, time) {
    var step = w < 520 ? 10 : 7;
    var n = Math.ceil((w + 24) / step);
    cx.globalCompositeOperation = "lighter";
    cx.lineCap = "round";
    cx.lineJoin = "round";
    FOOT_WAVES.forEach(function (wv) {
      var pts = [];
      for (var i = 0; i <= n; i++) {
        var u = i / n, x = -12 + (w + 24) * u;
        var y = wv.y * h + wv.a * h * (Math.sin(u * TAU * wv.f + time * wv.s + wv.p) +
          0.3 * Math.sin(u * TAU * wv.f * 1.8 - time * wv.s * 1.2 + wv.p * 2));
        pts.push([x, y]);
      }
      var k = 0.85 + 0.12 * wv.d;
      cx.beginPath();
      smoothLine(cx, pts, true);
      cx.strokeStyle = "rgba(" + wv.c + ",.10)"; cx.lineWidth = 20 * k; cx.stroke();
      cx.strokeStyle = "rgba(" + wv.c + ",.22)"; cx.lineWidth = 7 * k; cx.stroke();
      cx.strokeStyle = "rgba(255,200,235,.95)"; cx.lineWidth = 1.7 * k; cx.stroke();
    });
  };

  var heroCanvas = document.getElementById("heroWaves");
  if (heroCanvas) Scene(heroCanvas, drawHero, isTouch ? 33 : 20);
  var footCanvas = document.getElementById("footWaves");
  if (footCanvas) Scene(footCanvas, drawFoot, isTouch ? 40 : 24);

  /* =====================================================================
     8. РАСКАЧИВАНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ: сильнее, потом плавно к обычному ритму
     ===================================================================== */
  var SWAY_SEL = ".review,.product,.case,.news-item,.facts li,.steps li";
  var swayEls = [];
  var swayIO = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.__vis = en.isIntersecting; });
  }, { rootMargin: "120px" }) : null;

  var swayScan = function () {
    Array.prototype.forEach.call(document.querySelectorAll(SWAY_SEL), function (el) {
      if (el.__sway) return;
      el.__sway = true;
      el.__vis = !swayIO;
      el.__ph = rnd(0, 6.283);
      swayEls.push(el);
      if (swayIO) swayIO.observe(el);
    });
  };
  swayScan();
  new MutationObserver(function () { swayScan(); }).observe(document.body, { childList: true, subtree: true });

  var sTarget = 0, sBoost = 0, sRaf = 0, sLast = 0, lastY = window.pageYOffset || 0;
  var swayOn = function () { return !reduce && allowed("float"); };

  var swayReset = function () {
    swayEls.forEach(function (el) { el.style.removeProperty("--sway"); el.style.rotate = ""; });
    sBoost = 0; sTarget = 0; sLast = 0;
  };

  var swayFrame = function (t) {
    sRaf = 0;
    var dt = Math.min(50, t - (sLast || t));
    sLast = t;
    var k = dt / 16.7;
    sTarget *= Math.pow(0.986, k);                       // «затухание» раскачки
    sBoost += (sTarget - sBoost) * (1 - Math.pow(0.9, k)); // плавный разгон без рывков
    var amp = 7 + 22 * sBoost;
    swayEls.forEach(function (el) {
      if (!el.__vis) return;
      el.style.setProperty("--sway", amp.toFixed(1) + "px");
      el.style.rotate = (Math.sin(t * 0.0042 + el.__ph) * 2.2 * sBoost).toFixed(2) + "deg";
    });
    if (sTarget > 0.004 || sBoost > 0.006) sRaf = requestAnimationFrame(swayFrame);
    else swayReset();
  };

  window.addEventListener("scroll", function () {
    var y = window.pageYOffset || 0;
    var d = Math.abs(y - lastY);
    lastY = y;
    if (!swayOn()) return;
    sTarget = Math.min(1, sTarget + d / 260);
    if (!sRaf) sRaf = requestAnimationFrame(swayFrame);
  }, { passive: true });

  document.addEventListener("settings:change", function () { if (!swayOn()) swayReset(); });

  /* =====================================================================
     9. ЧАТ НА ТЕЛЕФОНЕ: подгоняем окно под экранную клавиатуру
     ===================================================================== */
  var vv = window.visualViewport;
  var fitChat = function () {
    var p = document.querySelector(".bot-panel.open");
    if (!p) { root.classList.remove("chat-kb"); return; }
    if (!vv || window.innerWidth > 600) {
      p.style.top = p.style.height = p.style.bottom = "";
      p.classList.remove("kb");
      root.classList.remove("chat-kb");
      return;
    }
    var kb = vv.height < window.innerHeight - 120;       // клавиатура открыта
    if (kb) {
      p.style.top = (vv.offsetTop + 8) + "px";
      p.style.bottom = "auto";
      p.style.height = (vv.height - 16) + "px";
    } else {
      p.style.top = p.style.height = p.style.bottom = "";
    }
    p.classList.toggle("kb", kb);
    root.classList.toggle("chat-kb", kb);
  };
  if (vv) {
    vv.addEventListener("resize", fitChat);
    vv.addEventListener("scroll", fitChat);
  }
  document.addEventListener("focusin", function () { setTimeout(fitChat, 60); setTimeout(fitChat, 350); });
  document.addEventListener("focusout", function () { setTimeout(fitChat, 120); });
  document.addEventListener("click", function () { setTimeout(fitChat, 80); }, true);
})();
