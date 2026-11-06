/* Подставляет шапку и подвал на все страницы.
   Страница сообщает о себе через <body data-page="home|reviews|portfolio|news|cart"> */
(function () {
  var S = window.SITE;
  var page = document.body.getAttribute("data-page");

  /* Страховка от старого кэша стилей на страницах, где ссылка на стили ещё без новой версии */
  var cacheFix = document.createElement("link");
  cacheFix.rel = "stylesheet";
  cacheFix.href = "css/backgrounds.css?v=9";
  document.head.appendChild(cacheFix);

  /* Логотип: файл лежит в папке images. Если загрузите логотип под другим именем — поменяйте здесь. */
  var LOGO = "images/1000035674.jpg";

  var links = [
    ["home", "index.html", "Главная"],
    ["reviews", "reviews.html", "Отзывы"],
    ["portfolio", "portfolio.html", "Портфолио"],
    ["news", "news.html", "Новости"]
  ];

  var navHtml = links.map(function (l) {
    return '<a href="' + l[1] + '"' + (l[0] === page ? ' aria-current="page"' : "") + ">" + l[2] + "</a>";
  }).join("");

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

  /* Меню: открывается по кнопке, закрывается по клику вне меню и по Esc */
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (burger && nav) {
    burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("open")) return;
      if (e.target.closest && (e.target.closest(".nav") || e.target.closest(".burger"))) return;
      setMenu(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
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

  /* Эффекты: лепестки, сердечки, объёмные иконки, наклон окон, видео. Один файл, стили уже в backgrounds.css */
  var fx = document.createElement("script");
  fx.src = "js/effects.js?v=3";
  document.body.appendChild(fx);
})();
