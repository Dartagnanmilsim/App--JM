// Motor de los juegos para niños pequeños.
// Uso: startGame("colores" | "animales" | "figuras" | "iguales" | "escondite" | "tamanos")
//
// Principios de diseño (desarrollo infantil, 2-3 años):
// - Dificultad adaptativa: empieza fácil (2 opciones) y sube o baja según cómo le va,
//   para que acierte la mayoría de las veces sin aburrirse.
// - Andamiaje: si se equivoca dos veces, el correcto brilla y la voz lo señala (sin castigo).
// - Repetición espaciada: lo que más le cuesta aparece más a menudo.
// - Elogio al esfuerzo y sesiones cortas con pausa sugerida.
(function () {
  "use strict";

  var PARTY = ["🎈", "⭐", "🎉", "🌈", "💖", "✨"];
  var SHAPE_COLORS = ["#e63946", "#1e6fd9", "#ffb703", "#2a9d3f", "#ff8c1a", "#8e44ad", "#ff5d8f", "#00a6a6"];
  var SHAPES = {
    circulo:    '<circle cx="50" cy="50" r="44"/>',
    cuadrado:   '<rect x="10" y="10" width="80" height="80" rx="4"/>',
    triangulo:  '<polygon points="50,8 94,90 6,90"/>',
    estrella:   '<polygon points="50,5 61,38 96,38 68,59 78,93 50,72 22,93 32,59 4,38 39,38"/>',
    corazon:    '<path d="M50 90 C 20 68, 4 50, 4 31 C 4 16, 16 6, 29 6 C 39 6, 46 12, 50 20 C 54 12, 61 6, 71 6 C 84 6, 96 16, 96 31 C 96 50, 80 68, 50 90 Z"/>',
    rectangulo: '<rect x="4" y="25" width="92" height="50" rx="4"/>',
    rombo:      '<polygon points="50,4 92,50 50,96 8,50"/>',
    ovalo:      '<ellipse cx="50" cy="50" rx="30" ry="45"/>'
  };

  // ================= Guardado =================
  var STORE_KEY = "app_progress_v1";
  function loadStore() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    s = s || {};
    s.games = s.games || {};
    s.usage = s.usage || {};
    s.settings = s.settings || { sessionMinutes: 10 };
    return s;
  }
  function saveStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
  function gameState(store, id) {
    var g = store.games[id] = store.games[id] || {};
    g.level = g.level || 1;
    g.streak = g.streak || 0;
    g.recent = g.recent || [];
    g.items = g.items || {};
    g.stars = g.stars || 0;
    return g;
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ================= Voz =================
  // 1) Voz en español del dispositivo (en iPhone, la más parecida a Siri).
  // 2) Si no suena, audios grabados de reserva en audio/clips/.
  var player = new Audio();
  player.preload = "auto";
  var queue = [], queueId = 0, deviceVoice = null, deviceWorks = null;

  function pickDeviceVoice() {
    if (!("speechSynthesis" in window)) return;
    var es = speechSynthesis.getVoices().filter(function (v) { return /^es/i.test(v.lang); });
    function score(v) {
      var n = (v.name + " " + v.voiceURI).toLowerCase(), s = 0;
      if (n.indexOf("siri") >= 0) s += 100;
      if (n.indexOf("premium") >= 0) s += 60;
      if (n.indexOf("enhanced") >= 0 || n.indexOf("mejorad") >= 0) s += 50;
      if (/m[oó]nica|paulina|marisol|isabela|helena/.test(n)) s += 20;
      if (/^es[-_](es|mx)/i.test(v.lang)) s += 10;
      if (v.localService) s += 5;
      if (/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bells|bubbles|jester|organ|trinoids|whisper|zarvox|superstar|bahh|boing|cellos|wobble|bad news|good news|junior|ralph|fred|kathy/.test(n)) s -= 80;
      return s;
    }
    es.sort(function (a, b) { return score(b) - score(a); });
    deviceVoice = es[0] || null;
  }
  if ("speechSynthesis" in window) {
    pickDeviceVoice();
    speechSynthesis.onvoiceschanged = pickDeviceVoice;
  }
  function clipSrc(text) { return "audio/clips/" + clipKey(text) + ".mp3"; }

  function playClips(texts, id) {
    queue = texts.slice();
    function next() {
      if (id !== queueId || !queue.length) return;
      player.muted = false;
      player.src = clipSrc(queue.shift());
      var p = player.play();
      if (p && p.catch) p.catch(function () {});
    }
    player.onended = next;
    next();
  }

  // Dice una o varias frases (en orden)
  function say(texts) {
    if (typeof texts === "string") texts = [texts];
    var id = ++queueId;
    if (!player.muted) player.pause();
    queue = [];
    if (!("speechSynthesis" in window) || deviceWorks === false) { playClips(texts, id); return; }
    var synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) synth.cancel();
    var u = new SpeechSynthesisUtterance(texts.join(" "));
    if (deviceVoice) { u.voice = deviceVoice; u.lang = deviceVoice.lang; } else { u.lang = "es-ES"; }
    u.rate = 0.85; u.pitch = 1.15; u.volume = 1;
    var started = false;
    u.onstart = function () { started = true; deviceWorks = true; };
    u.onerror = function (e) {
      if (e.error === "interrupted" || e.error === "canceled") return;
      if (!started && id === queueId) { deviceWorks = false; playClips(texts, id); }
    };
    synth.resume();
    synth.speak(u);
    if (deviceWorks !== true) {
      setTimeout(function () {
        if (!started && id === queueId) { deviceWorks = false; synth.cancel(); playClips(texts, id); }
      }, 1500);
    }
  }
  function unlockAudio() {
    player.src = clipSrc(PHRASES.hola);
    player.muted = true;
    var p = player.play();
    if (p && p.then) p.then(function () { if (player.muted) { player.pause(); player.muted = false; } })
      .catch(function () { player.muted = false; });
    else player.muted = false;
  }

  // ================= Utilidades =================
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function itemHTML(item, color) {
    if (item.kind === "animal") return '<span class="emoji">' + item.emoji + "</span>";
    if (item.kind === "shape") return '<svg viewBox="0 0 100 100" aria-hidden="true" fill="' + color + '">' + SHAPES[item.shape] + "</svg>";
    return "";
  }
  function choiceButton(item, color, extraClass) {
    var b = el("button", "choice " + (item.kind === "color" ? "color" : "card") + (extraClass ? " " + extraClass : ""));
    b.type = "button";
    if (item.kind === "color") b.style.background = item.hex;
    else b.innerHTML = itemHTML(item, color);
    return b;
  }
  function wiggle(e) { e.classList.remove("wiggle"); void e.offsetWidth; e.classList.add("wiggle"); }

  // ================= Juego =================
  window.startGame = function (gameId) {
    var game = GAMES[gameId];
    var store = loadStore();
    var gs = gameState(store, gameId);
    saveStore(store);

    document.title = game.title;
    document.body.innerHTML =
      '<div id="start">' +
      '  <div class="big">' + game.icon + "</div>" +
      "  <h1>" + game.title + "</h1>" +
      '  <button class="play" id="play">▶️ Jugar</button>' +
      '  <p class="tip">🔈 Sube el volumen. En iPhone, ábrelo en Safari para oír la voz del teléfono.</p>' +
      '  <p class="tip parent">👪 Juega a su lado: repite las palabras con él y celebra su esfuerzo.</p>' +
      '  <a class="back" href="index.html">🏠 Volver al inicio</a>' +
      "</div>" +
      '<div class="top">' +
      '  <a href="index.html" aria-label="Inicio">🏠</a>' +
      '  <div class="stars" id="stars"></div>' +
      '  <button id="repeat" aria-label="Repetir la pregunta">🔊</button>' +
      "</div>" +
      '<h2 id="question"></h2>' +
      '<div id="model"></div>' +
      '<div id="board"></div>';

    var board = document.getElementById("board");
    var model = document.getElementById("model");
    var question = document.getElementById("question");
    var starsEl = document.getElementById("stars");
    var sessionStars = 0, sessionStart = 0, lastTargetKey = null;
    var round = null; // { key, prompt:[texts], errors, done, correctEl }

    // ----- progreso -----
    function chooseTarget(pool) {
      var candidates = pool.filter(function (it) { return it.key !== lastTargetKey; });
      var weights = candidates.map(function (it) {
        var r = gs.items[it.key] || { ok: 0, tries: 0 };
        var acc = (r.ok + 1) / (r.tries + 2);      // con valor inicial de 50 %
        return 1 + 3 * (1 - acc);                  // lo que más cuesta sale más
      });
      var total = weights.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * total;
      for (var i = 0; i < candidates.length; i++) { x -= weights[i]; if (x <= 0) return candidates[i]; }
      return candidates[candidates.length - 1];
    }
    function record(result) { // "ok" a la primera, "err" con errores, "hint" con ayuda
      var r = gs.items[round.key] = gs.items[round.key] || { ok: 0, tries: 0 };
      r.tries++;
      if (result === "ok") r.ok++;
      gs.recent.push(result);
      if (gs.recent.length > 6) gs.recent.shift();
      if (result === "ok") {
        gs.streak++;
        if (gs.streak >= 3 && gs.level < 3) { gs.level++; gs.streak = 0; }
      } else {
        gs.streak = 0;
        var last3 = gs.recent.slice(-3).filter(function (x) { return x === "hint"; }).length;
        if (last3 >= 2 && gs.level > 1) { gs.level--; gs.recent = []; }
      }
      gs.stars++;
      try { localStorage.setItem("stars_" + gameId, String(gs.stars)); } catch (e) {}
      saveStore(store);
    }
    function trackUsage() {
      if (document.hidden || !sessionStart) return;
      var d = today();
      store.usage[d] = (store.usage[d] || 0) + 0.5; // minutos
      saveStore(store);
    }
    setInterval(trackUsage, 30000);

    // ----- respuestas -----
    function correct(chosenEl, okTexts) {
      if (round.done) return;
      round.done = true;
      record(round.errors === 0 ? "ok" : round.errors >= 2 ? "hint" : "err");
      sessionStars++;
      starsEl.textContent = "⭐".repeat(sessionStars % 10 || 10);
      chosenEl.classList.remove("hint");
      chosenEl.classList.add("win");
      Array.prototype.forEach.call(board.querySelectorAll(".choice, .slot"), function (b) { if (b !== chosenEl) b.classList.add("fade"); });
      var praise = pick(PRAISE);
      question.textContent = praise;
      say([praise].concat(okTexts));
      celebrate();
      var wait = 2600 + okTexts.join(" ").length * 45;
      setTimeout(function () {
        var minutes = (Date.now() - sessionStart) / 60000;
        if (minutes >= (store.settings.sessionMinutes || 10)) showRest();
        else newRound();
      }, wait);
    }
    function wrong(chosenEl, wrongTexts) {
      if (round.done) return;
      round.errors++;
      wiggle(chosenEl);
      if (round.errors >= 2 && round.correctEl) {
        round.correctEl.classList.add("hint");
        say([PHRASES.hint]);
      } else {
        say(wrongTexts.concat(round.prompt));
      }
    }
    function celebrate() {
      for (var i = 0; i < 12; i++) {
        var c = el("div", "confetti", pick(PARTY));
        c.style.left = Math.random() * 95 + "vw";
        c.style.animationDelay = Math.random() * 0.6 + "s";
        document.body.appendChild(c);
        setTimeout(c.remove.bind(c), 2600);
      }
    }
    function ask() { question.textContent = round.prompt[round.prompt.length - 1]; say(round.prompt); }

    // ----- modos -----
    var MODES = {
      // ¿Dónde está…?
      find: function () {
        var n = gs.level + 1; // 2, 3 o 4 opciones
        var target = chooseTarget(game.items);
        var others = shuffle(game.items.filter(function (it) { return it !== target; })).slice(0, n - 1);
        var c0 = Math.floor(Math.random() * SHAPE_COLORS.length);
        round = { key: target.key, prompt: [PHRASES.question(target)], errors: 0 };
        shuffle([target].concat(others)).forEach(function (item, i) {
          var b = choiceButton(item, SHAPE_COLORS[(c0 + i) % SHAPE_COLORS.length]);
          b.setAttribute("aria-label", item.name);
          if (item === target) round.correctEl = b;
          b.addEventListener("click", function () {
            if (item === target) correct(b, [PHRASES.name(item)]);
            else wrong(b, [PHRASES.wrong(item)]);
          });
          board.appendChild(b);
        });
        ask();
        question.style.color = target.kind === "color" && target.key !== "blanco" ? target.hex : "";
      },

      // Encuentra el igual
      match: function () {
        var n = gs.level + 1;
        var target = chooseTarget(game.items);
        var sameKind = game.items.filter(function (it) { return it.kind === target.kind && it !== target; });
        var others = shuffle(sameKind).slice(0, n - 1);
        var colors = shuffle(SHAPE_COLORS);
        round = { key: target.key, prompt: [PHRASES.matchQ], errors: 0 };
        model.innerHTML = "";
        var m = choiceButton(target, colors[0], "model");
        m.disabled = true;
        model.appendChild(el("div", "model-label", "👇"));
        model.insertBefore(m, model.firstChild);
        shuffle([target].concat(others)).forEach(function (item, i) {
          var b = choiceButton(item, item === target ? colors[0] : colors[(i + 1) % colors.length]);
          b.setAttribute("aria-label", item.name);
          if (item === target) round.correctEl = b;
          b.addEventListener("click", function () {
            if (item === target) correct(b, [PHRASES.matchOk]);
            else wrong(b, [PHRASES.matchWrong]);
          });
          board.appendChild(b);
        });
        ask();
      },

      // ¿Dónde se escondió? (vasos)
      hide: function () {
        var cups = gs.level === 1 ? 2 : 3;
        var swap = gs.level === 3;
        var target = chooseTarget(game.items);
        var hidingSlot = Math.floor(Math.random() * cups);
        round = { key: target.key, prompt: [PHRASES.hideQ(target)], errors: 0 };
        board.className = "cups cups-" + cups;
        var slots = [];
        var ready = false;
        for (var i = 0; i < cups; i++) {
          var s = el("button", "slot");
          s.type = "button";
          s.style.left = slotLeft(i, cups);
          s.innerHTML = (i === hidingSlot ? '<span class="hidden-item">' + target.emoji + "</span>" : "") + '<span class="cup"></span>';
          s.setAttribute("aria-label", "Vaso " + (i + 1));
          board.appendChild(s);
          slots.push(s);
        }
        round.correctEl = slots[hidingSlot];
        // 1) se ve el animal con los vasos levantados
        slots.forEach(function (s) { s.classList.add("open"); });
        question.textContent = PHRASES.hideLook(target);
        say([PHRASES.hideLook(target)]);
        // 2) bajan los vasos
        setTimeout(function () {
          slots.forEach(function (s) { s.classList.remove("open"); });
          // 3) (nivel 3) dos vasos cambian de lugar, siempre incluido el del animal
          setTimeout(function () {
            if (swap) {
              var other = (hidingSlot + 1 + Math.floor(Math.random() * (cups - 1))) % cups;
              var a = slots[hidingSlot], b = slots[other];
              var la = a.style.left; a.style.left = b.style.left; b.style.left = la;
              setTimeout(go, 1200);
            } else go();
          }, 700);
        }, 2200);
        function go() { ready = true; ask(); }
        slots.forEach(function (s, i) {
          s.addEventListener("click", function () {
            if (!ready || round.done || s.classList.contains("open")) return;
            s.classList.add("open");
            if (i === hidingSlot) correct(s, [PHRASES.hideOk(target)]);
            else {
              wrong(s, [PHRASES.hideWrong]);
              setTimeout(function () { s.classList.remove("open"); }, 1100);
            }
          });
        });
      },

      // Grande y pequeño
      size: function () {
        var target = chooseTarget(game.items);
        var big = Math.random() < 0.5;
        var colors = shuffle(SHAPE_COLORS);
        var options = [{ item: target, big: true, color: colors[0] }, { item: target, big: false, color: colors[0] }];
        if (gs.level >= 2) {
          var other = pick(game.items.filter(function (it) { return it.kind === target.kind && it !== target; }));
          options.push({ item: other, big: true, color: colors[1] }, { item: other, big: false, color: colors[1] });
        }
        round = { key: target.key, prompt: [PHRASES.sizeQ(target, big)], errors: 0 };
        board.className = "sizes";
        shuffle(options).forEach(function (o) {
          var b = choiceButton(o.item, o.color, o.big ? "big" : "small");
          b.setAttribute("aria-label", o.item.name + " " + (o.big ? "grande" : "pequeño"));
          var isTarget = o.item === target && o.big === big;
          if (isTarget) round.correctEl = b;
          b.addEventListener("click", function () {
            if (isTarget) correct(b, [PHRASES.sizeOk(target, big)]);
            else wrong(b, [PHRASES.sizeWrong]);
          });
          board.appendChild(b);
        });
        ask();
      }
    };
    function slotLeft(i, n) { return (n === 2 ? [25, 75] : [17, 50, 83])[i] + "%"; }

    function newRound() {
      board.innerHTML = "";
      board.className = "";
      model.innerHTML = "";
      question.style.color = "";
      MODES[game.mode]();
      lastTargetKey = round.key;
    }

    // ----- descanso -----
    function showRest() {
      var o = el("div", "rest");
      o.innerHTML =
        '<div class="big">🌟</div>' +
        "<h1>¡Muy buen trabajo!</h1>" +
        '<p class="stars-earned">' + "⭐".repeat(Math.min(sessionStars, 15)) + "</p>" +
        '<div class="parent-box"><b>👪 Para papá o mamá:</b> ya jugó ' + (store.settings.sessionMinutes || 10) +
        " minutos. Ahora es buen momento para jugar sin pantalla:<br>" + game.home + "</div>" +
        '<a class="play" href="index.html">🏠 Inicio</a>' +
        '<button class="hold" id="more" type="button">Seguir jugando<br><small>(adulto: mantén pulsado)</small></button>';
      document.body.appendChild(o);
      say(PHRASES.rest);
      var more = o.querySelector("#more"), t = null;
      function down(e) { e.preventDefault(); more.classList.add("holding"); t = setTimeout(function () { o.remove(); sessionStart = Date.now(); newRound(); }, 1500); }
      function up() { more.classList.remove("holding"); clearTimeout(t); }
      more.addEventListener("pointerdown", down);
      more.addEventListener("pointerup", up);
      more.addEventListener("pointerleave", up);
    }

    document.getElementById("repeat").addEventListener("click", function () {
      if (round && !round.done) say(round.prompt);
    });
    document.getElementById("play").addEventListener("click", function () {
      unlockAudio();
      document.getElementById("start").remove();
      sessionStart = Date.now();
      newRound();
    });
  };
})();
