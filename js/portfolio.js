(function () {
  var grid = document.getElementById("caseGrid");

  function layer(cls, src, alt, placeholder) {
    var inner = src
      ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy">'
      : '<div class="ph">' + esc(placeholder) + "</div>";
    return '<div class="layer ' + cls + '">' + inner + "</div>";
  }

  grid.innerHTML = window.PORTFOLIO.map(function (c, i) {
    return '<article class="case">' +
      '<div class="ba" data-ba>' +
        layer("before", c.before, c.title + ": до", "Фото «до» — добавьте файл в папку images") +
        layer("after", c.after, c.title + ": после", "Фото «после» — добавьте файл в папку images") +
        '<span class="tag l">До</span><span class="tag r">После</span>' +
        '<div class="handle"></div>' +
        '<input type="range" min="0" max="100" value="50" aria-label="Сравнение до и после: ' + esc(c.title) + '">' +
      "</div>" +
      '<div class="case-body"><h2 style="font-size:1.4rem;margin-bottom:.3rem">' + esc(c.title) + "</h2>" +
      "<p style=\"margin:0\">" + esc(c.text) + "</p>" +
      "<dl><div><dt>Сеансов:</dt><dd>" + esc(c.sessions) + "</dd></div><div><dt>Срок:</dt><dd>" + esc(c.period) + "</dd></div></dl>" +
      "</div></article>";
  }).join("");

  Array.prototype.forEach.call(grid.querySelectorAll("[data-ba]"), function (box) {
    var range = box.querySelector("input[type=range]");
    var after = box.querySelector(".after");
    var handle = box.querySelector(".handle");
    function set() {
      var v = range.value;
      after.style.clipPath = "inset(0 0 0 " + v + "%)";
      handle.style.left = v + "%";
    }
    range.addEventListener("input", set);
    set();
  });
})();
