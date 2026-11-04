/* Корзина хранится в браузере (localStorage). Работает на всех страницах. */
(function () {
  var KEY = "cart_v1";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function write(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    updateBadge();
    document.dispatchEvent(new CustomEvent("cart:change"));
  }
  function count() {
    var c = read(), n = 0;
    Object.keys(c).forEach(function (id) { n += c[id]; });
    return n;
  }
  function updateBadge() {
    var el = document.getElementById("cartCount");
    if (!el) return;
    var n = count();
    el.textContent = n;
    el.setAttribute("data-n", n);
  }
  function find(id) {
    return (window.PRODUCTS || []).filter(function (p) { return p.id === id; })[0];
  }

  window.Cart = {
    get: read,
    count: count,
    add: function (id) {
      var p = find(id);
      if (!p || p.soon) return;
      var c = read();
      c[id] = (c[id] || 0) + 1;
      write(c);
    },
    setQty: function (id, q) {
      var c = read();
      if (q <= 0) delete c[id]; else c[id] = Math.min(q, 20);
      write(c);
    },
    remove: function (id) {
      var c = read();
      delete c[id];
      write(c);
    },
    clear: function () { write({}); },
    lines: function () {
      var c = read();
      return Object.keys(c).map(function (id) {
        var p = find(id);
        return p ? { product: p, qty: c[id] } : null;
      }).filter(Boolean);
    },
    total: function () {
      return this.lines().reduce(function (s, l) { return s + l.product.price * l.qty; }, 0);
    }
  };

  updateBadge();
  window.addEventListener("storage", updateBadge);
})();
