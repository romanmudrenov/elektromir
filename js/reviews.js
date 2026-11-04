(function () {
  var list = document.getElementById("reviewList");
  var filters = document.getElementById("filters");
  var summary = document.getElementById("summary");
  var current = "Все";
  var reviews = window.REVIEWS.slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });

  function stars(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= n ? "★" : "☆";
    return s;
  }
  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  function renderSummary() {
    var sum = reviews.reduce(function (s, r) { return s + r.rating; }, 0);
    var avg = reviews.length ? (sum / reviews.length).toFixed(1).replace(".", ",") : "—";
    summary.innerHTML = '<span class="big">' + avg + '</span><span class="stars" aria-hidden="true">★★★★★</span>' +
      '<span class="muted">на основе ' + reviews.length + " отзывов</span>";
  }

  function renderFilters() {
    var sources = ["Все"];
    reviews.forEach(function (r) { if (sources.indexOf(r.source) === -1) sources.push(r.source); });
    filters.innerHTML = "";
    sources.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = s;
      b.setAttribute("aria-pressed", s === current ? "true" : "false");
      b.addEventListener("click", function () { current = s; renderFilters(); renderList(); });
      filters.appendChild(b);
    });
  }

  function renderList() {
    var shown = reviews.filter(function (r) { return current === "Все" || r.source === current; });
    list.innerHTML = shown.map(function (r) {
      return '<article class="review"><header><strong>' + esc(r.name) + '</strong>' +
        '<span class="stars" role="img" aria-label="Оценка ' + r.rating + ' из 5">' + stars(r.rating) + '</span></header>' +
        '<p>' + esc(r.text) + '</p>' +
        '<div class="meta">' + esc(r.zone || "") + (r.zone ? " · " : "") + esc(r.source) + " · " + fmtDate(r.date) + "</div></article>";
    }).join("") || '<div class="empty">Пока нет отзывов из этого источника.</div>';
  }

  renderSummary();
  renderFilters();
  renderList();

  /* Форма: пока отзыв только сохраняется для модерации (в demo-режиме — в браузере).
     Публиковать на сайте автоматически нельзя: сначала проверка. */
  var form = document.getElementById("reviewForm");
  var msg = document.getElementById("reviewMsg");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.className = "form-msg";
    var name = form.elements["name"].value.trim();
    var text = form.elements["text"].value.trim();
    if (!name || text.length < 10) {
      msg.textContent = "Укажите имя и напишите отзыв — хотя бы 10 символов.";
      msg.className = "form-msg show error";
      return;
    }
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    sendForm("review", {
      name: name,
      zone: form.elements["zone"].value.trim(),
      rating: Number(form.elements["rating"].value),
      text: text
    }).then(function () {
      msg.textContent = "Спасибо! Отзыв появится на сайте после проверки.";
      msg.className = "form-msg show";
      form.reset();
    }).catch(function () {
      msg.textContent = "Не получилось отправить отзыв. Попробуйте позже.";
      msg.className = "form-msg show error";
    }).then(function () { btn.disabled = false; });
  });
})();
