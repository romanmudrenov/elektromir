/* Подставляет шапку и подвал на все страницы, управляет меню и настройками.
   Страница сообщает о себе через <body data-page="home|reviews|portfolio|news|cart"> */
(function () {
  var S = window.SITE;
  var page = document.body.getAttribute("data-page");

  /* Страховка от старого кэша стилей на страницах, где ссылка на стили ещё без новой версии */
  var cacheFix = document.createElement("link");
  cacheFix.rel = "stylesheet";
  cacheFix.href = "css/backgrounds.css?v=11";
  document.head.appendChild(cacheFix);

  /* Логотип: файл лежит в папке images. Если загрузите логотип под другим именем — поменяйте здесь. */
  var LOGO = "images/1000035674.jpg";

  /* ---------------------------------------------------------------
     НАСТРОЙКИ (звук и внешний вид). Хранятся в браузере посетителя.
     --------------------------------------------------------------- */
  var KEY = "elektromir_settings_v1";
  var DEFAULTS = { sound: true, vol: 0.5, tap: true, scroll: true, haptic: true, petals: true, waves: true, float: true, big: false };
  var cfg = {};
  (function () {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    Object.keys(DEFAULTS).forEach(function (k) { cfg[k] = saved.hasOwnProperty(k) ? saved[k] : DEFAULTS[k]; });
  })();

  function applyClasses() {
    var h = document.documentElement.classList;
    h.toggle("no-float", !cfg.float);
    h.toggle("no-petals", !cfg.petals);
    h.toggle("no-waves", !cfg.waves);
    h.toggle("big-text", !!cfg.big);
  }
  applyClasses();

  window.SETTINGS = {
    get: function () { return cfg; },
    set: function (k, v) {
      cfg[k] = v;
      try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
      applyClasses();
      document.dispatchEvent(new CustomEvent("settings:change", { detail: cfg }));
    },
    reset: function () {
      Object.keys(DEFAULTS).forEach(function (k) { cfg[k] = DEFAULTS[k]; });
      try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
      applyClasses();
      document.dispatchEvent(new CustomEvent("settings:change", { detail: cfg }));
    }
  };

  /* ---------------------------------------------------------------
     РАЗМЕТКА
     --------------------------------------------------------------- */
  var links = [
    ["home", "index.html", "Главная"],
    ["reviews", "reviews.html", "Отзывы"],
    ["portfolio", "portfolio.html", "Портфолио"],
    ["news", "news.html", "Новости"]
  ];

  var navLinks = links.map(function (l, i) {
    return '<a class="nav-block" style="--i:' + i + '" href="' + l[1] + '"' + (l[0] === page ? ' aria-current="page"' : "") + ">" + l[2] + "</a>";
  }).join("");

  function folder(id, label, idx, inner) {
    return '<div class="nav-group" style="--i:' + idx + '">' +
      '<button class="nav-block nav-folder" type="button" aria-expanded="false" aria-controls="sub-' + id + '">' + label + '<span class="chev" aria-hidden="true"></span></button>' +
      '<div class="nav-sub" id="sub-' + id + '"><div class="nav-sub-inner">' + inner + "</div></div></div>";
  }
  function sw(key, label, hint) {
    return '<div class="set-row"><span>' + label + (hint ? "<small>" + hint + "</small>" : "") + "</span>" +
      '<button class="switch" type="button" role="switch" aria-checked="false" aria-label="' + label + '" data-set="' + key + '"></button></div>';
  }

  var settingsInner =
    '<div class="set-title">Звук</div>' +
    sw("sound", "Звук на сайте") +
    '<div class="set-row col"><div class="row-top"><span>Громкость</span><span id="volVal">50%</span></div>' +
    '<input class="set-range" type="range" min="0" max="1" step="0.05" data-range="vol" aria-label="Громкость"></div>' +
    sw("tap", "Звук касаний", "щелчки по кнопкам") +
    sw("scroll", "Звук прокрутки", "тихий тик при скролле") +
    '<div id="hapticRow">' + sw("haptic", "Вибрация", "отклик при касании") + "</div>" +
    '<div class="set-title">Внешний вид</div>' +
    '<div class="seg" role="group" aria-label="Режим оформления">' +
    '<button type="button" data-mode="full" aria-pressed="false">Полный</button>' +
    '<button type="button" data-mode="lite" aria-pressed="false">Лёгкий</button></div>' +
    sw("petals", "Лепестки и сердечки") +
    sw("waves", "Волны") +
    sw("float", "Парение блоков") +
    sw("big", "Крупный текст") +
    '<button class="set-reset" type="button" data-reset>Сбросить настройки</button>';

  var navHtml =
    navLinks +
    folder("set", "Настройки", 4, settingsInner);

  var bagIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';

  var brandMark =
    '<span class="brand-badge"><img src="' + LOGO + '" alt="" width="48" height="48"></span>' +
    '<span class="brand-name">' + S.brand + "</span>";

  var header =
    '<header class="site-header"><div class="bar-wrap"><div class="bar">' +
    '<a class="brand" href="index.html" aria-label="' + S.brand + ' — на главную">' + brandMark + "</a>" +
    '<div class="bar-actions">' +
    '<a class="btn small bar-cta" href="index.html#book">Записаться</a>' +
    '<a class="bar-cart" href="cart.html" aria-label="Корзина"' + (page === "cart" ? ' aria-current="page"' : "") + ">" + bagIcon +
    '<span class="cart-count" data-n="0" id="cartCount">0</span></a>' +
    '<button class="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="nav">Меню</button>' +
    "</div></div>" +
    '<nav class="nav" id="nav" aria-label="Основное меню">' + navHtml + "</nav>" +
    "</div></header>";

  var footerLinks = links.map(function (l) {
    return '<li><a href="' + l[1] + '">' + l[2] + "</a></li>";
  }).join("") + '<li><a href="cart.html">Корзина</a></li>';

  var footer =
    '<footer class="site-footer">' +
    '<canvas id="footWaves" class="foot-waves" aria-hidden="true"></canvas>' +
    '<div class="wrap">' +
    '<div class="cta-band"><div><h2>Готовы к гладкой коже?</h2>' +
    "<p>Запишитесь на консультацию: мастер осмотрит зону, ответит на вопросы и составит план.</p></div>" +
    '<div class="cta-actions"><a class="btn" href="index.html#book">Записаться на приём</a>' +
    '<a class="btn ghost" href="' + S.telegram + '" target="_blank" rel="noopener">Написать в Telegram</a></div></div>' +
    '<div class="foot-main">' +
    '<div class="foot-brand"><a class="brand" href="index.html">' + brandMark + "</a>" +
    "<p>Электроэпиляция в городе " + S.city + ". Работаем с волосами любого цвета: светлыми, рыжими и седыми.</p></div>" +
    '<div><h3>Разделы</h3><ul class="foot-links">' + footerLinks + "</ul></div>" +
    '<div><h3>Контакты</h3><ul class="foot-contacts">' +
    '<li><a href="tel:' + S.phoneLink + '">' + S.phone + "</a></li>" +
    '<li><a href="' + S.telegram + '" target="_blank" rel="noopener">Telegram ' + S.telegramName + "</a></li>" +
    '<li><a href="mailto:' + S.email + '">' + S.email + "</a></li>" +
    "<li><span>" + S.address + "</span></li>" +
    "<li><span>" + S.hours + "</span></li></ul></div></div>" +
    '<div class="foot-bottom"><small>Есть противопоказания. Перед процедурой нужна консультация специалиста. ' +
    "© " + new Date().getFullYear() + " " + S.brand + "</small></div>" +
    "</div></footer>";

  var top = document.getElementById("site-header");
  var bottom = document.getElementById("site-footer");
  if (top) top.outerHTML = header;
  if (bottom) bottom.outerHTML = footer;

  /* ---------------------------------------------------------------
     МЕНЮ И НАСТРОЙКИ: поведение
     --------------------------------------------------------------- */
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");

  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle("open", open);
    document.documentElement.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function renderSettings() {
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll("[data-set]"), function (b) {
      b.setAttribute("aria-checked", cfg[b.getAttribute("data-set")] ? "true" : "false");
    });
    var range = nav.querySelector("[data-range=vol]");
    if (range) range.value = cfg.vol;
    var vv = document.getElementById("volVal");
    if (vv) vv.textContent = Math.round(cfg.vol * 100) + "%";
    var full = cfg.petals && cfg.waves && cfg.float;
    var lite = !cfg.petals && !cfg.waves && !cfg.float;
    var mf = nav.querySelector("[data-mode=full]"), ml = nav.querySelector("[data-mode=lite]");
    if (mf) mf.setAttribute("aria-pressed", full ? "true" : "false");
    if (ml) ml.setAttribute("aria-pressed", lite ? "true" : "false");
    var hr = document.getElementById("hapticRow");
    if (hr && !navigator.vibrate) hr.style.display = "none";
  }

  if (burger && nav) {
    renderSettings();

    burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });

    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("open")) return;
      if (e.target.closest && (e.target.closest(".nav") || e.target.closest(".burger"))) return;
      setMenu(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

    nav.addEventListener("click", function (e) {
      var t = e.target;
      var fold = t.closest(".nav-folder");
      if (fold) {
        var group = fold.parentNode;
        var willOpen = !group.classList.contains("open");
        Array.prototype.forEach.call(nav.querySelectorAll(".nav-group"), function (g) {
          g.classList.remove("open");
          g.querySelector(".nav-folder").setAttribute("aria-expanded", "false");
        });
        if (willOpen) {
          group.classList.add("open");
          fold.setAttribute("aria-expanded", "true");
          setTimeout(function () { fold.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 120);
        }
        return;
      }
      var s = t.closest("[data-set]");
      if (s) {
        var key = s.getAttribute("data-set");
        window.SETTINGS.set(key, !cfg[key]);
        renderSettings();
        return;
      }
      var m = t.closest("[data-mode]");
      if (m) {
        var on = m.getAttribute("data-mode") === "full";
        window.SETTINGS.set("petals", on);
        window.SETTINGS.set("waves", on);
        window.SETTINGS.set("float", on);
        renderSettings();
        return;
      }
      if (t.closest("[data-reset]")) {
        window.SETTINGS.reset();
        renderSettings();
      }
    });

    nav.addEventListener("input", function (e) {
      if (e.target.matches("[data-range=vol]")) {
        window.SETTINGS.set("vol", parseFloat(e.target.value));
        var vv = document.getElementById("volVal");
        if (vv) vv.textContent = Math.round(cfg.vol * 100) + "%";
      }
    });
    nav.addEventListener("change", function (e) {
      if (e.target.matches("[data-range=vol]") && window.Sound) window.Sound.tap("bubble");
    });
  }

  /* ---------------------------------------------------------------
     УТИЛИТЫ
     --------------------------------------------------------------- */
  window.formatPrice = function (n) {
    return n.toLocaleString("ru-RU") + " ₽";
  };

  window.esc = function (s) {
    var d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  };

  window.sendForm = function (type, payload) {
    var body = JSON.stringify({ type: type, data: payload, at: new Date().toISOString() });
    if (!S.formEndpoint) {
      try {
        var key = "demo_" + type;
        var list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push(JSON.parse(body));
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {}
      return Promise.resolve({ demo: true });
    }
    return fetch(S.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body })
      .then(function (r) { if (!r.ok) throw new Error("bad status"); return r; });
  };

  /* Звуки и эффекты: два отдельных файла, стили уже в backgrounds.css */
  ["js/sound.js?v=2", "js/effects.js?v=5"].forEach(function (src) {
    var sc = document.createElement("script");
    sc.src = src;
    document.body.appendChild(sc);
  });
})();
