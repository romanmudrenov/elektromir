(function () {
  /* ---------- Рисунок в hero: кожа, волоски исчезают один за другим ---------- */
  var svg = document.getElementById("skin");
  if (svg) {
    var W = 400, base = 250;
    function skinY(x) { return base + 9 * Math.sin(x / 38) + 4 * Math.sin(x / 15); }

    var pts = [];
    for (var x = 0; x <= W; x += 8) pts.push(x + " " + skinY(x).toFixed(1));
    var line = "M" + pts.join(" L");
    var fill = line + " L" + W + " 380 L0 380 Z";

    var hairs = "";
    var n = 22;
    for (var i = 0; i < n; i++) {
      var hx = 24 + i * ((W - 48) / (n - 1));
      var hy = skinY(hx);
      var len = 70 + ((i * 37) % 55);
      var lean = ((i * 53) % 30) - 15;
      var delay = (0.6 + i * 0.22).toFixed(2);
      hairs += '<line class="hair" x1="' + hx.toFixed(1) + '" y1="' + hy.toFixed(1) +
        '" x2="' + (hx + lean).toFixed(1) + '" y2="' + (hy - len).toFixed(1) +
        '" style="animation-delay:' + delay + 's"/>';
    }

    svg.innerHTML =
      '<path class="skin-fill" d="' + fill + '"/>' +
      '<path class="skin-line" d="' + line + '"/>' +
      hairs +
      '<g class="needle"><line x1="360" y1="20" x2="262" y2="196"/><circle cx="262" cy="196" r="3.5" fill="#1E8C8A" stroke="none"/></g>';
  }

  /* ---------- Прайс ---------- */
  var prices = document.getElementById("priceList");
  if (prices) {
    prices.innerHTML = window.SERVICES.map(function (s) {
      return '<div class="price-row"><div><div class="name">' + esc(s.name) + '</div><div class="note">' + esc(s.note) +
        '</div></div><div class="time">' + esc(s.time) + '</div><div class="sum">от ' + formatPrice(s.price) + "</div></div>";
    }).join("");
  }

  /* ---------- FAQ ---------- */
  var faq = document.getElementById("faqList");
  if (faq) {
    faq.innerHTML = window.FAQ.map(function (f) {
      return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
    }).join("");
  }

  /* ---------- Форма записи ---------- */
  var form = document.getElementById("bookForm");
  if (form) {
    var msg = document.getElementById("bookMsg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var phone = form.phone.value.replace(/[^\d+]/g, "");
      msg.className = "form-msg";
      if (phone.replace(/\D/g, "").length < 10) {
        msg.textContent = "Проверьте номер телефона: нужно минимум 10 цифр.";
        msg.className = "form-msg show error";
        form.phone.focus();
        return;
      }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      sendForm("booking", {
        name: form.elements["name"].value.trim(),
        phone: phone,
        zone: form.zone.value,
        comment: form.comment.value.trim()
      }).then(function () {
        msg.textContent = "Заявка принята. Администратор позвонит вам в рабочее время.";
        msg.className = "form-msg show";
        form.reset();
      }).catch(function () {
        msg.textContent = "Не получилось отправить заявку. Позвоните нам: " + SITE.phone;
        msg.className = "form-msg show error";
      }).then(function () { btn.disabled = false; });
    });

    var sel = form.zone;
    window.SERVICES.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.name;
      o.textContent = s.name;
      sel.appendChild(o);
    });
  }
})();
