/* Эффекты: искры, звёздочки, сердечки, плавное появление блоков, переходы между страницами.
   Сами отключаются, если в телефоне включено «уменьшить движение».
   Чтобы убрать совсем: удалите блок «Подключение эффектов» в конце js/layout.js. */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.requestAnimationFrame) return;

  var root = document.documentElement;
  var isTouch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  var STAR_COLORS = ["#C81E85", "#F06AB0", "#F7A8D0", "#E6B655", "#FFD88A", "#C7A8F0"];
  var HEART_COLORS = ["#C81E85", "#E8479B", "#F58DBE", "#FF9FC4", "#FFB3D1"];

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------- Холст ---------- */
  var canvas = document.createElement("canvas");
  canvas.className = "fx-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  if (!ctx) { canvas.parentNode.removeChild(canvas); return; }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    if (w === W && Math.abs(h - H) < 150) return;
    W = w; H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- Частицы ---------- */
  var parts = [];
  var MAX = isTouch ? 110 : 180;
  var AMBIENT = isTouch ? 10 : 20;

  function add(p) {
    if (parts.length >= MAX) parts.shift();
    parts.push(p);
  }

  function make(type, x, y, o) {
    return {
      type: type, x: x, y: y,
      vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, drag: o.drag || 0.99,
      size: o.size, rot: rnd(0, 6.283), vr: o.vr === undefined ? rnd(-0.08, 0.08) : o.vr,
      color: o.color, life: o.life, age: 0,
      twinkle: !!o.twinkle, sway: o.sway || 0, ph: rnd(0, 6.283), amb: !!o.amb
    };
  }

  function drawStar(r) {
    var k = r * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(k, -k, r, 0);
    ctx.quadraticCurveTo(k, k, 0, r);
    ctx.quadraticCurveTo(-k, k, -r, 0);
    ctx.quadraticCurveTo(-k, -k, 0, -r);
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.9);
    ctx.bezierCurveTo(-s * 1.3, s * 0.1, -s * 0.8, -s * 0.9, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 0.8, -s * 0.9, s * 1.3, s * 0.1, 0, s * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  function spawnAmbient() {
    var heart = Math.random() < 0.15;
    add(make(heart ? "heart" : "star", rnd(0, W), rnd(H * 0.1, H), {
      vx: 0, vy: -rnd(0.1, 0.35), sway: rnd(0.1, 0.4), drag: 1,
      size: heart ? rnd(8, 12) : rnd(4, 9),
      color: heart ? pick(HEART_COLORS) : pick(STAR_COLORS),
      life: rnd(240, 420), twinkle: true, vr: rnd(-0.02, 0.02), amb: true
    }));
  }

  var last = 0, raf = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min(t - last, 50) : 16.67;
    last = t;
    var k = dt / 16.67;

    ctx.clearRect(0, 0, W, H);

    var amb = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.age += k;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g * k;
      p.x += p.vx * k + (p.sway ? Math.sin(p.age * 0.03 + p.ph) * p.sway : 0);
      p.y += p.vy * k;
      p.rot += p.vr * k;

      if (p.age >= p.life || p.y < -40 || p.y > H + 60 || p.x < -40 || p.x > W + 40) {
        parts.splice(i, 1);
        continue;
      }
      if (p.amb) amb++;

      var tt = p.age / p.life;
      var a, scale = 1;
      if (p.twinkle) {
        a = Math.sin(Math.PI * tt) * 0.8;
        scale = 0.7 + 0.3 * Math.sin(p.age * 0.12 + p.ph);
      } else {
        a = tt < 0.1 ? tt / 0.1 : (1 - tt) / 0.9;
      }
      if (a <= 0) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.type === "heart" ? Math.sin(p.age * 0.06 + p.ph) * 0.35 : p.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.type === "heart") drawHeart(p.size * 0.5 * scale);
      else drawStar(p.size * scale);
      ctx.restore();
    }

    if (amb < AMBIENT && Math.random() < 0.05) spawnAmbient();
  }

  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  start();

  /* ---------- Готовые всплески ---------- */
  function stars(x, y, n, power) {
    for (var i = 0; i < n; i++) {
      var a = rnd(0, 6.283), s = rnd(1, power || 4);
      add(make("star", x, y, {
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, g: 0.07, drag: 0.96,
        size: rnd(6, 13), color: pick(STAR_COLORS), life: rnd(40, 70)
      }));
    }
  }

  function hearts(x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = rnd(-2.6, -0.5), s = rnd(2, 7);
      add(make("heart", x, y, {
        vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.1, drag: 0.975,
        size: rnd(14, 26), color: pick(HEART_COLORS), life: rnd(70, 115)
      }));
    }
  }

  function trail(x, y) {
    add(make("star", x + rnd(-6, 6), y + rnd(-6, 6), {
      vx: rnd(-0.4, 0.4), vy: rnd(-0.2, 0.6), g: 0.03, drag: 0.97,
      size: rnd(4, 9), color: pick(STAR_COLORS), life: rnd(26, 44)
    }));
  }

  function fountain(x, y) {
    hearts(x, y, 16);
    stars(x, y, 14, 6);
    var n = 0;
    var iv = setInterval(function () {
      hearts(x, y, 3);
      stars(x, y, 2, 3);
      if (++n >= 14) clearInterval(iv);
    }, 60);
  }

  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ---------- Касания, свайпы, прокрутка ---------- */
  document.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    stars(e.clientX, e.clientY, 6, 3.5);
  }, { passive: true });

  var lx = 0, ly = 0, lt = 0;
  function move(x, y) {
    var now = Date.now();
    if (now - lt < 30) return;
    var dx = x - lx, dy = y - ly;
    if (dx * dx + dy * dy < 64) return;
    lx = x; ly = y; lt = now;
    trail(x, y);
    if (isTouch) trail(x, y);
  }
  document.addEventListener("touchmove", function (e) {
    var t = e.touches && e.touches[0];
    if (t) move(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener("mousemove", function (e) {
    if (!isTouch) move(e.clientX, e.clientY);
  }, { passive: true });

  var sy = window.pageYOffset, st = 0;
  window.addEventListener("scroll", function () {
    var y = window.pageYOffset, d = y - sy;
    if (Math.abs(d) < 50) return;
    var now = Date.now();
    if (now - st < 140) return;
    st = now; sy = y;
    var down = d > 0;
    for (var i = 0; i < 2; i++) {
      add(make("star", rnd(W * 0.08, W * 0.92), down ? H * 0.9 : H * 0.1, {
        vx: rnd(-0.5, 0.5), vy: down ? -rnd(1, 2.5) : rnd(1, 2.5), drag: 0.99,
        size: rnd(6, 12), color: pick(STAR_COLORS), life: rnd(40, 60)
      }));
    }
  }, { passive: true });

  /* ---------- Переход между страницами ---------- */
  var veil = document.createElement("div");
  veil.className = "fx-veil";
  veil.setAttribute("aria-hidden", "true");
  document.body.appendChild(veil);

  try {
    if (sessionStorage.getItem("fx_nav") === "1") {
      sessionStorage.removeItem("fx_nav");
      veil.className = "fx-veil show";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { veil.className = "fx-veil"; });
      });
    }
  } catch (err) {}

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) veil.classList.remove("show");
  });

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download") || a.hasAttribute("data-open-bot")) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    var c = (e.clientX || e.clientY) ? { x: e.clientX, y: e.clientY } : center(a);
    stars(c.x, c.y, 18, 5);
    veil.classList.add("show");
    try { sessionStorage.setItem("fx_nav", "1"); } catch (err2) {}
    setTimeout(function () { location.href = url.href; }, 380);
    setTimeout(function () { veil.classList.remove("show"); }, 3000);
  });

  /* ---------- Плавное появление блоков ---------- */
  var SELECTORS = [
    ".facts li", ".steps li", "main section h2", ".page-head h1", ".page-head p",
    ".price-row", ".faq details", ".review", ".case", ".news-item", ".product",
    ".contact-card", ".note-box", ".contact-list li"
  ].join(",");

  try {
    if (!("IntersectionObserver" in window)) throw new Error("no IO");
    root.classList.add("fx");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        el.classList.add("in");
        var d = parseInt(el.style.getPropertyValue("--d"), 10) || 0;
        setTimeout(function () { el.classList.add("done"); }, d + 900);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    var register = function (el) {
      if (el.__fx) return;
      if (el.closest("header,footer") && !el.closest("main")) return;
      if (el.tagName === "H2" && el.closest(".contact-card,.news-item,.case,.summary")) return;
      el.__fx = true;
      var idx = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty("--d", Math.min(idx, 5) * 80 + "ms");
      el.classList.add("reveal");
      io.observe(el);
    };

    var scan = function () {
      Array.prototype.forEach.call(document.querySelectorAll(SELECTORS), register);
    };
    scan();

    var scheduled = false;
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () { scheduled = false; scan(); });
    }).observe(document.body, { childList: true, subtree: true });
  } catch (err3) {
    root.classList.remove("fx");
  }

  /* ---------- Корзина: всплеск счётчика и искры на кнопке ---------- */
  document.addEventListener("cart:change", function () {
    var b = document.getElementById("cartCount");
    if (!b) return;
    b.classList.remove("pop");
    void b.offsetWidth;
    b.classList.add("pop");
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-add]");
    if (!btn || btn.disabled) return;
    var c = center(btn);
    stars(c.x, c.y, 12, 4.5);
    hearts(c.x, c.y, 3);
  });

  /* ---------- Сердечки при успешной отправке заказа, заявки или отзыва ---------- */
  var okState = typeof WeakMap === "function" ? new WeakMap() : null;
  if (okState && window.MutationObserver) {
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
        }
      });
    }).observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: true });
  }
})();
