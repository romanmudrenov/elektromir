/* Чат-бот. Настройки — в js/config.js (объект window.BOT).
   Режим "local": ответы по ключевым словам из data.js (window.BOT_RULES).
   Режим "api": запрос на ваш сервер. Формат:
     POST endpoint  { "messages": [ {"role":"user","content":"..."}, ... ] }
     ответ          { "reply": "текст ответа" }
*/
(function () {
  var B = window.BOT;
  var history = [];

  var fab = document.createElement("button");
  fab.className = "bot-fab";
  fab.setAttribute("aria-label", "Открыть чат с помощником");
  fab.setAttribute("aria-expanded", "false");
  fab.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';

  var panel = document.createElement("div");
  panel.className = "bot-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Чат с помощником");
  panel.innerHTML =
    '<div class="bot-head"><strong></strong><button type="button" aria-label="Закрыть чат">×</button></div>' +
    '<div class="bot-log" aria-live="polite"></div>' +
    '<div class="bot-quick"></div>' +
    '<form class="bot-form"><input type="text" placeholder="Ваш вопрос" aria-label="Сообщение" autocomplete="off" maxlength="500">' +
    '<button class="btn small" type="submit">Отправить</button></form>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var log = panel.querySelector(".bot-log");
  var quick = panel.querySelector(".bot-quick");
  var form = panel.querySelector(".bot-form");
  var input = form.querySelector("input");
  panel.querySelector("strong").textContent = B.name;

  function add(role, text) {
    var d = document.createElement("div");
    d.className = "msg " + role;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function localAnswer(text) {
    var t = text.toLowerCase();
    var rules = window.BOT_RULES || [];
    for (var i = 0; i < rules.length; i++) {
      for (var k = 0; k < rules[i].keys.length; k++) {
        if (t.indexOf(rules[i].keys[k]) !== -1) return rules[i].answer;
      }
    }
    return B.fallback;
  }

  function ask(text) {
    history.push({ role: "user", content: text });
    if (B.mode === "api" && B.endpoint) {
      var wait = add("bot", "…");
      fetch(B.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) })
      })
        .then(function (r) { if (!r.ok) throw new Error("status " + r.status); return r.json(); })
        .then(function (j) {
          wait.textContent = j.reply || B.fallback;
          history.push({ role: "assistant", content: wait.textContent });
        })
        .catch(function () {
          wait.textContent = "Сейчас не получается ответить. Позвоните нам: " + window.SITE.phone;
        });
    } else {
      var ans = localAnswer(text);
      setTimeout(function () {
        add("bot", ans);
        history.push({ role: "assistant", content: ans });
      }, 350);
    }
  }

  function send(text) {
    text = text.trim();
    if (!text) return;
    add("user", text);
    ask(text);
  }

  B.quick.forEach(function (q) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = q;
    b.addEventListener("click", function () { send(q); });
    quick.appendChild(b);
  });

  function toggle(open) {
    var isOpen = open === undefined ? !panel.classList.contains("open") : open;
    panel.classList.toggle("open", isOpen);
    fab.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      if (!log.children.length) add("bot", B.greeting);
      input.focus();
    }
  }

  fab.addEventListener("click", function () { toggle(); });
  panel.querySelector(".bot-head button").addEventListener("click", function () { toggle(false); fab.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    send(input.value);
    input.value = "";
  });

  /* Позволяет открыть чат ссылкой/кнопкой: <a href="#chat" data-open-bot> */
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-open-bot]");
    if (t) { e.preventDefault(); toggle(true); }
  });
})();
