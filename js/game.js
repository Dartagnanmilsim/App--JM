// Motor común de los juegos "¿Dónde está...?" para niños pequeños.
// Uso: startGame("colores" | "animales" | "figuras")
(function () {
  "use strict";

  var OPTIONS = 4;          // siempre 4 opciones diferentes
  var PARTY = ["🎈", "⭐", "🎉", "🌈", "💖", "✨"];
  var SHAPE_COLORS = ["#e63946", "#1e6fd9", "#ffb703", "#2a9d3f", "#ff8c1a", "#8e44ad", "#ff5d8f", "#00a6a6"];

  // Figuras dibujadas en SVG (viewBox 0 0 100 100)
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

  // ---------------- Voz ----------------
  // 1) Voz en español del propio dispositivo (en iPhone, la más parecida a Siri).
  // 2) Si no empieza a sonar, audios grabados de reserva en audio/<juego>/.
  var player = new Audio();
  player.preload = "auto";
  var queue = [];
  var queueId = 0;
  var deviceVoice = null;
  var deviceWorks = null;
  var audioDir = "";

  function pickDeviceVoice() {
    if (!("speechSynthesis" in window)) return;
    var es = speechSynthesis.getVoices().filter(function (v) { return /^es/i.test(v.lang); });
    function score(v) {
      var n = (v.name + " " + v.voiceURI).toLowerCase();
      var s = 0;
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

  function clipSrc(key) { return audioDir + key + ".mp3"; }

  function playClips(keys, id) {
    queue = keys.slice();
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

  // keys: audios de reserva en orden; text: lo que dice la voz del dispositivo
  function say(keys, text) {
    var id = ++queueId;
    if (!player.muted) player.pause();
    queue = [];
    if (!("speechSynthesis" in window) || deviceWorks === false) { playClips(keys, id); return; }

    var synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    if (deviceVoice) { u.voice = deviceVoice; u.lang = deviceVoice.lang; } else { u.lang = "es-ES"; }
    u.rate = 0.85;
    u.pitch = 1.15;
    u.volume = 1;
    var started = false;
    u.onstart = function () { started = true; deviceWorks = true; };
    u.onerror = function (e) {
      if (e.error === "interrupted" || e.error === "canceled") return;
      if (!started && id === queueId) { deviceWorks = false; playClips(keys, id); }
    };
    synth.resume();
    synth.speak(u);
    if (deviceWorks !== true) {
      setTimeout(function () {
        if (!started && id === queueId) { deviceWorks = false; synth.cancel(); playClips(keys, id); }
      }, 1500);
    }
  }

  // ---------------- Juego ----------------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function buildChoice(gameId, item, colorIndex) {
    var el = document.createElement("button");
    el.type = "button";
    el.setAttribute("aria-label", item.name);
    el.dataset.key = item.key;
    if (gameId === "colores") {
      el.className = "choice color";
      el.style.background = item.hex;
    } else if (gameId === "animales") {
      el.className = "choice card";
      el.innerHTML = '<span class="emoji">' + item.emoji + "</span>";
    } else {
      el.className = "choice card";
      el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" fill="' +
        SHAPE_COLORS[colorIndex % SHAPE_COLORS.length] + '">' + SHAPES[item.shape] + "</svg>";
    }
    return el;
  }

  window.startGame = function (gameId) {
    var game = GAMES[gameId];
    audioDir = "audio/" + gameId + "/";

    document.title = game.title;
    document.body.innerHTML =
      '<div id="start">' +
      '  <div class="big">' + game.icon + "</div>" +
      "  <h1>" + game.title + "</h1>" +
      '  <button class="play" id="play">▶️ Jugar</button>' +
      '  <p class="tip">🔈 Sube el volumen. En iPhone, ábrelo en Safari para oír la voz del teléfono.</p>' +
      '  <a class="back" href="index.html">🏠 Volver al inicio</a>' +
      "</div>" +
      '<div class="top">' +
      '  <a href="index.html" aria-label="Inicio">🏠</a>' +
      '  <div class="stars" id="stars"></div>' +
      '  <button id="repeat" aria-label="Repetir la pregunta">🔊</button>' +
      "</div>" +
      '<h2 id="question"></h2>' +
      '<div id="board"></div>';

    var board = document.getElementById("board");
    var question = document.getElementById("question");
    var starsEl = document.getElementById("stars");
    var target = null, lastTarget = null, wins = 0, busy = false;

    function ask() {
      var text = PHRASES.question(target);
      question.textContent = text;
      question.style.color = gameId === "colores" && target.key !== "blanco" ? target.hex : "#2b2c34";
      say(["q_" + target.key], text);
    }

    function newRound() {
      busy = false;
      var pool = game.items.filter(function (it) { return it !== lastTarget; });
      target = pick(pool);
      lastTarget = target;
      var others = shuffle(game.items.filter(function (it) { return it !== target; })).slice(0, OPTIONS - 1);
      var options = shuffle([target].concat(others));
      var colorStart = Math.floor(Math.random() * SHAPE_COLORS.length);
      board.innerHTML = "";
      options.forEach(function (item, i) {
        var el = buildChoice(gameId, item, colorStart + i);
        el.addEventListener("click", function () { choose(item, el); });
        board.appendChild(el);
      });
      ask();
    }

    function choose(item, el) {
      if (busy) return;
      if (item === target) {
        busy = true;
        wins++;
        starsEl.textContent = "⭐".repeat(wins % 10 || 10);
        el.classList.add("win");
        Array.prototype.forEach.call(board.children, function (b) { if (b !== el) b.classList.add("fade"); });
        var pi = Math.floor(Math.random() * PRAISE.length);
        question.textContent = PRAISE[pi];
        say(["p_" + pi, "c_" + item.key], PRAISE[pi] + " " + PHRASES.name(item));
        celebrate();
        setTimeout(newRound, item.sound ? 3600 : 2800);
      } else {
        el.classList.remove("wiggle");
        void el.offsetWidth;
        el.classList.add("wiggle");
        say(["ese_" + item.key, "q_" + target.key], PHRASES.wrong(item) + " " + PHRASES.question(target));
      }
    }

    function celebrate() {
      for (var i = 0; i < 14; i++) {
        var c = document.createElement("div");
        c.className = "confetti";
        c.textContent = pick(PARTY);
        c.style.left = Math.random() * 95 + "vw";
        c.style.animationDelay = Math.random() * 0.6 + "s";
        document.body.appendChild(c);
        setTimeout(c.remove.bind(c), 2600);
      }
    }

    document.getElementById("repeat").addEventListener("click", function () { if (target) ask(); });

    // El toque en "Jugar" desbloquea la voz y el audio (obligatorio en móviles)
    document.getElementById("play").addEventListener("click", function () {
      player.src = clipSrc("hola");
      player.muted = true;
      var p = player.play();
      if (p && p.then) p.then(function () { if (player.muted) { player.pause(); player.muted = false; } })
        .catch(function () { player.muted = false; });
      else player.muted = false;
      document.getElementById("start").remove();
      newRound();
    });
  };
})();
