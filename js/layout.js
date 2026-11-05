/* Подставляет шапку и подвал на все страницы.
   Страница сообщает о себе через <body data-page="home|reviews|portfolio|news|cart"> */
(function () {
  var S = window.SITE;
  var page = document.body.getAttribute("data-page");

  /* Стили логотипа и фоновых окон подключаем сразу, чтобы шапка не «прыгала» */
  var winCss = document.createElement("link");
  winCss.rel = "stylesheet";
  winCss.href = "css/windows.css?v=1";
  document.head.appendChild(winCss);

  var links = [
    ["home", "index.html", "Главная"],
    ["reviews", "reviews.html", "Отзывы"],
    ["portfolio", "portfolio.html", "Портфолио"],
    ["news", "news.html", "Новости"]
  ];

  var navHtml = links.map(function (l) {
    return '<a href="' + l[1] + '"' + (l[0] === page ? ' aria-current="page"' : "") + ">" + l[2] + "</a>";
  }).join("");

  var header =
    '<header class="site-header"><div class="wrap">' +
    '<a class="logo" href="index.html" aria-label="' + S.brand + ' — на главную">' +
    '<img src="images/logo.png" alt="' + S.brand + '" width="133" height="104"></a>' +
    '<button class="burger" aria-expanded="false" aria-controls="nav">Меню</button>' +
    '<nav class="nav" id="nav" aria-label="Основное меню">' + navHtml +
    '<a class="cart-link" href="cart.html"' + (page === "cart" ? ' aria-current="page"' : "") + ">Корзина " +
    '<span class="cart-count" data-n="0" id="cartCount">0</span></a>' +
    "</nav></div></header>";

  var footer =
    '<footer class="site-footer"><div class="wrap"><div class="cols">' +
    "<div><h3>" + S.brand + "</h3><p>Электроэпиляция в городе " + S.city + ". Удаляем волосы любого цвета.</p></div>" +
    "<div><h3>Контакты</h3><p><a href=\"tel:" + S.phoneLink + '">' + S.phone + "</a><br>" +
    '<a href="' + S.telegram + '" target="_blank" rel="noopener">Telegram: ' + S.telegramName + "</a><br>" +
    '<a href="mailto:' + S.email + '">' + S.email + "</a><br>" + S.address + "<br>" + S.hours + "</p></div>" +
    '<div><h3>Разделы</h3><p><a href="reviews.html">Отзывы</a><br><a href="portfolio.html">Портфолио</a><br>' +
    '<a href="news.html">Новости</a><br><a href="cart.html">Корзина</a></p></div>' +
    "</div><small>Есть противопоказания. Перед процедурой нужна консультация специалиста. " +
    "© " + new Date().getFullYear() + " " + S.brand + "</small></div></footer>";

  var top = document.getElementById("site-header");
  var bottom = document.getElementById("site-footer");
  if (top) top.outerHTML = header;
  if (bottom) bottom.outerHTML = footer;

  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Шапка уменьшается, когда страницу прокрутили */
  var hdr = document.querySelector(".site-header");
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("scrolled", window.pageYOffset > 30); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Утилита для форматирования цены: 15300 -> "15 300 ₽" */
  window.formatPrice = function (n) {
    return n.toLocaleString("ru-RU") + " ₽";
  };

  /* Утилита экранирования текста, чтобы в HTML не попал чужой код */
  window.esc = function (s) {
    var d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  };

  /* Отправка формы: на endpoint, если он задан; иначе — демо-режим */
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

  /* ---------- Подключение эффектов (искры, сердечки, плавное появление, переходы) ---------- */
  var fxCss = document.createElement("link");
  fxCss.rel = "stylesheet";
  fxCss.href = "css/effects.css?v=1";
  function loadEffects() {
    if (window.__fxLoaded) return;
    window.__fxLoaded = true;
    var s = document.createElement("script");
    s.src = "js/effects.js?v=1";
    document.body.appendChild(s);
  }
  fxCss.onload = loadEffects;
  fxCss.onerror = loadEffects;
  document.head.appendChild(fxCss);
})();
