/* Звуки сайта: щелчки при касаниях и тихий «тик» при прокрутке.
   Всё синтезируется на лету, готовых аудиофайлов нет. Настройки берутся из меню «Настройки». */
(function () {
  "use strict";

  var ctx = null, master = null;

  function cfg() {
    return (window.SETTINGS && window.SETTINGS.get()) || { sound: true, vol: 0.5, tap: true, scroll: true, haptic: true };
  }

  function ensure() {
    var c = cfg();
    if (!c.sound) return false;
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { return false; }
      var comp = ctx.createDynamicsCompressor();      // не даёт звуку «трещать» на пиках
      comp.threshold.value = -18;
      comp.knee.value = 20;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.12;
      master = ctx.createGain();
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.setValueAtTime(c.vol, ctx.currentTime);
    return true;
  }

  function vibrate(ms) {
    var c = cfg();
    if (c.haptic && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }

  /* Короткие тактильные щелчки */
  function tap(type) {
    var c = cfg();
    if (!c.sound || !c.tap) return;
    if (!ensure()) return;
    vibrate(14);
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var len = 0.05;

    if (type === "drop") {            // капля росы
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(1050, t + 0.042);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.26, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);
    } else if (type === "bubble") {   // мягкий поп
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.028);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      len = 0.04;
    } else if (type === "bell") {     // нежный тон (успех)
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      len = 0.3;
    } else {                          // тёплое дерево (по умолчанию)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(115, t + 0.035);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      len = 0.045;
    }
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + len);
  }

  /* Тихий тик при прокрутке: выше тон при быстрой прокрутке */
  function tick(intensity) {
    var c = cfg();
    if (!c.sound || !c.scroll) return;
    if (!ctx || ctx.state !== "running") return;   // без первого касания звук не запускаем
    master.gain.setValueAtTime(c.vol, ctx.currentTime);
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var pitch = Math.min(1800, 950 + (intensity || 0) * 12);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.015);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.017);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  /* Какой звук у какого элемента */
  function typeFor(el) {
    if (el.closest("[data-add],.bot-fab,.bot-form button")) return "bubble";
    if (el.closest(".chip,.hero-chips a,summary,.switch,.seg button")) return "drop";
    return "wood";
  }

  document.addEventListener("pointerdown", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("input[type=range],input[type=text],input[type=tel],textarea,select")) return;
    var el = t.closest("button,a,summary,[role=button],[role=switch],.btn");
    if (!el) return;
    tap(typeFor(el));
  }, { passive: true, capture: true });

  /* iOS разрешает звук только после касания/клика: «будим» звук на первом жесте */
  var unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    ensure();
  }
  ["touchend", "click", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, unlock, { once: true, passive: true });
  });

  /* Прокрутка страницы */
  var lastY = window.pageYOffset, lastT = 0;
  window.addEventListener("scroll", function () {
    var y = window.pageYOffset;
    var d = Math.abs(y - lastY);
    var now = Date.now();
    if (d > 55 && now - lastT > 65) {
      tick(d / 5);
      lastY = y;
      lastT = now;
    }
  }, { passive: true });

  window.Sound = { tap: tap, tick: tick, unlock: ensure };
})();
