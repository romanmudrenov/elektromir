(function () {
  var linesEl = document.getElementById("cartLines");
  var totalEl = document.getElementById("cartTotal");
  var shop = document.getElementById("shopGrid");
  var form = document.getElementById("orderForm");
  var msg = document.getElementById("orderMsg");
  var btn = document.getElementById("orderBtn");

  var typeLabel = { service: "Услуга", gift: "Подарок", goods: "Товар" };

  /* ---------- каталог ---------- */
  shop.innerHTML = window.PRODUCTS.map(function (p) {
    return '<article class="product"><div><span class="badge' + (p.soon ? " soon" : "") + '">' +
      (p.soon ? "Скоро" : typeLabel[p.type] || "") + "</span></div>" +
      "<h3>" + esc(p.name) + '</h3><p class="muted" style="margin:0">' + esc(p.desc) + "</p>" +
      '<div class="price">' + formatPrice(p.price) + "</div>" +
      '<button class="btn small" data-add="' + esc(p.id) + '"' + (p.soon ? " disabled" : "") + ">" +
      (p.soon ? "Скоро в продаже" : "Добавить в корзину") + "</button></article>";
  }).join("");

  shop.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]");
    if (!b) return;
    Cart.add(b.getAttribute("data-add"));
    msg.className = "form-msg";
  });

  /* ---------- корзина ---------- */
  function renderCart() {
    var lines = Cart.lines();
    if (!lines.length) {
      linesEl.innerHTML = '<div class="empty"><p style="margin:0 auto 1rem">В корзине пока пусто. Выберите услугу или сертификат ниже.</p></div>';
    } else {
      linesEl.innerHTML = lines.map(function (l) {
        var p = l.product;
        return '<div class="cart-row" data-id="' + esc(p.id) + '"><div><strong>' + esc(p.name) + "</strong>" +
          '<div class="muted" style="font-size:.95rem">' + formatPrice(p.price) + " за штуку</div>" +
          '<button type="button" class="link-btn" data-remove>Удалить</button></div>' +
          '<div class="qty"><button type="button" data-dec aria-label="Уменьшить количество">−</button>' +
          "<span>" + l.qty + '</span><button type="button" data-inc aria-label="Увеличить количество">+</button></div>' +
          '<div style="font-family:var(--font-head);font-size:1.2rem;text-align:right;min-width:6ch">' + formatPrice(p.price * l.qty) + "</div></div>";
      }).join("");
    }
    totalEl.textContent = formatPrice(Cart.total());
    btn.disabled = !lines.length;
  }

  linesEl.addEventListener("click", function (e) {
    var row = e.target.closest(".cart-row");
    if (!row) return;
    var id = row.getAttribute("data-id");
    var qty = Cart.get()[id] || 0;
    if (e.target.closest("[data-inc]")) Cart.setQty(id, qty + 1);
    else if (e.target.closest("[data-dec]")) Cart.setQty(id, qty - 1);
    else if (e.target.closest("[data-remove]")) Cart.remove(id);
  });

  document.addEventListener("cart:change", renderCart);
  renderCart();

  /* ---------- отправка заказа ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.className = "form-msg";
    var phone = form.phone.value.replace(/[^\d+]/g, "");
    var name = form.elements["name"].value.trim();
    var lines = Cart.lines();
    if (!lines.length) return;
    if (!name || phone.replace(/\D/g, "").length < 10) {
      msg.textContent = "Укажите имя и телефон (минимум 10 цифр).";
      msg.className = "form-msg show error";
      return;
    }
    btn.disabled = true;
    sendForm("order", {
      name: name,
      phone: phone,
      items: lines.map(function (l) { return { id: l.product.id, name: l.product.name, qty: l.qty, price: l.product.price }; }),
      total: Cart.total()
    }).then(function () {
      Cart.clear();
      form.reset();
      msg.textContent = "Заказ принят. Администратор позвонит и подтвердит детали.";
      msg.className = "form-msg show";
    }).catch(function () {
      msg.textContent = "Не получилось отправить заказ. Позвоните нам: " + SITE.phone;
      msg.className = "form-msg show error";
      btn.disabled = false;
    });
  });
})();
