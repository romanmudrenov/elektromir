(function () {
  var list = document.getElementById("newsList");
  var filters = document.getElementById("newsFilters");
  var items = window.NEWS.slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });
  var current = "Все";

  function fmtDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  function renderFilters() {
    var tags = ["Все"];
    items.forEach(function (n) { if (tags.indexOf(n.tag) === -1) tags.push(n.tag); });
    filters.innerHTML = "";
    tags.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = t;
      b.setAttribute("aria-pressed", t === current ? "true" : "false");
      b.addEventListener("click", function () { current = t; renderFilters(); renderList(); });
      filters.appendChild(b);
    });
  }

  function renderList() {
    var shown = items.filter(function (n) { return current === "Все" || n.tag === current; });
    list.innerHTML = shown.map(function (n) {
      return '<article class="news-item"><div class="meta"><span class="badge">' + esc(n.tag) + "</span>" +
        '<time datetime="' + esc(n.date) + '">' + fmtDate(n.date) + "</time></div>" +
        "<h2>" + esc(n.title) + "</h2><p>" + esc(n.text) + "</p></article>";
    }).join("") || '<div class="empty">Здесь пока ничего нет.</div>';
  }

  renderFilters();
  renderList();
})();
