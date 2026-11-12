// Datos de los juegos. Lo usan las páginas, la página para papás y el script que
// genera los audios de reserva (por eso no depende del navegador).

// ---------- Elementos ----------
var COLORS = [
  { key: "rojo",     art: "el", name: "rojo",     hex: "#e63946", kind: "color" },
  { key: "azul",     art: "el", name: "azul",     hex: "#1e6fd9", kind: "color" },
  { key: "amarillo", art: "el", name: "amarillo", hex: "#ffd60a", kind: "color" },
  { key: "verde",    art: "el", name: "verde",    hex: "#2a9d3f", kind: "color" },
  { key: "naranja",  art: "el", name: "naranja",  hex: "#ff8c1a", kind: "color" },
  { key: "morado",   art: "el", name: "morado",   hex: "#8e44ad", kind: "color" },
  { key: "rosa",     art: "el", name: "rosa",     hex: "#ff7eb6", kind: "color" },
  { key: "negro",    art: "el", name: "negro",    hex: "#222222", kind: "color" },
  { key: "blanco",   art: "el", name: "blanco",   hex: "#ffffff", kind: "color" },
  { key: "marron",   art: "el", name: "marrón",   hex: "#8b5a2b", kind: "color" }
];

var ANIMALS = [
  { key: "perro",   art: "el", name: "perro",   emoji: "🐶", sound: "¡Guau, guau!", kind: "animal" },
  { key: "gato",    art: "el", name: "gato",    emoji: "🐱", sound: "¡Miau!",       kind: "animal" },
  { key: "vaca",    art: "la", name: "vaca",    emoji: "🐮", sound: "¡Muuu!",       kind: "animal" },
  { key: "cerdo",   art: "el", name: "cerdo",   emoji: "🐷", sound: "¡Oink, oink!", kind: "animal" },
  { key: "gallina", art: "la", name: "gallina", emoji: "🐔", sound: "¡Clo, clo!",   kind: "animal" },
  { key: "caballo", art: "el", name: "caballo", emoji: "🐴", sound: "¡Iiiii!",      kind: "animal" },
  { key: "oveja",   art: "la", name: "oveja",   emoji: "🐑", sound: "¡Beee!",       kind: "animal" },
  { key: "pato",    art: "el", name: "pato",    emoji: "🦆", sound: "¡Cuac, cuac!", kind: "animal" },
  { key: "leon",    art: "el", name: "león",    emoji: "🦁", sound: "¡Grrr!",       kind: "animal" },
  { key: "rana",    art: "la", name: "rana",    emoji: "🐸", sound: "¡Croac, croac!", kind: "animal" }
];

var SHAPE_LIST = [
  { key: "circulo",    art: "el", name: "círculo",    shape: "circulo",    kind: "shape" },
  { key: "cuadrado",   art: "el", name: "cuadrado",   shape: "cuadrado",   kind: "shape" },
  { key: "triangulo",  art: "el", name: "triángulo",  shape: "triangulo",  kind: "shape" },
  { key: "estrella",   art: "la", name: "estrella",   shape: "estrella",   kind: "shape" },
  { key: "corazon",    art: "el", name: "corazón",    shape: "corazon",    kind: "shape" },
  { key: "rectangulo", art: "el", name: "rectángulo", shape: "rectangulo", kind: "shape" },
  { key: "rombo",      art: "el", name: "rombo",      shape: "rombo",      kind: "shape" },
  { key: "ovalo",      art: "el", name: "óvalo",      shape: "ovalo",      kind: "shape" }
];

// ---------- Juegos ----------
// mode: find (¿Dónde está…?), match (encuentra el igual), hide (escondite), size (grande/pequeño)
// skill: lo que trabaja, en palabras para papás.
var GAMES = {
  colores: {
    mode: "find", items: COLORS, title: "¿Dónde está el color?", icon: "🎨",
    skill: "Lenguaje y percepción del color",
    why: "Al oír el nombre y buscar el color, une la palabra con lo que ve (vocabulario receptivo) y aprende a separar colores parecidos.",
    home: "Busquen juntos cosas de un color en casa: «¿Dónde hay algo rojo?». Nombra colores al vestirlo o al comer."
  },
  animales: {
    mode: "find", items: ANIMALS, title: "¿Dónde está el animal?", icon: "🐶",
    skill: "Lenguaje y categorías",
    why: "Aprende nombres y sonidos de animales; el sonido le ayuda a recordar la palabra y a imitar, un paso previo para hablar.",
    home: "Lean un cuento con animales y pregúntale «¿Cómo hace la vaca?». Espera su respuesta antes de decirla tú."
  },
  figuras: {
    mode: "find", items: SHAPE_LIST, title: "¿Dónde está la figura?", icon: "🔺",
    skill: "Percepción visual y formas",
    why: "Reconocer formas es la base para más adelante distinguir letras y números.",
    home: "Busquen formas en casa: el plato es un círculo, la ventana un cuadrado. Jueguen con bloques o encajables."
  },
  iguales: {
    mode: "match", items: ANIMALS.concat(SHAPE_LIST), title: "¿Cuál es igual?", icon: "🧩",
    skill: "Discriminación visual y atención",
    why: "Comparar dibujos y encontrar el igual entrena la atención a los detalles y la clasificación, base del razonamiento.",
    home: "Al guardar la ropa, pídele que encuentre el otro calcetín igual. Hagan parejas con juguetes."
  },
  escondite: {
    mode: "hide", items: ANIMALS, title: "¿Dónde se escondió?", icon: "🙈",
    skill: "Memoria y permanencia del objeto",
    why: "Recordar debajo de qué vaso quedó el animal trabaja la memoria de trabajo y la idea de que las cosas existen aunque no se vean.",
    home: "Escondan un juguete debajo de una taza o una manta mientras te mira y pídele que lo encuentre. Luego cambien de lugar."
  },
  tamanos: {
    mode: "size", items: ANIMALS.concat(SHAPE_LIST), title: "Grande y pequeño", icon: "🐘",
    skill: "Conceptos y comparación",
    why: "Comparar tamaños es una de las primeras ideas matemáticas. Más adelante combina dos ideas a la vez: «el perro grande».",
    home: "Comparen cosas de casa: la cuchara grande y la pequeña, los zapatos de papá y los suyos."
  }
};

var GAME_ORDER = ["colores", "animales", "figuras", "iguales", "escondite", "tamanos"];

// ---------- Frases ----------
// Elogios al esfuerzo y la atención (no solo «¡qué listo!»): favorecen la persistencia.
var PRAISE = [
  "¡Muy bien, buscaste con calma!",
  "¡Qué bien miraste!",
  "¡Lo lograste!",
  "¡Bravo, sigue así!",
  "¡Excelente trabajo!"
];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function sizeWord(it, big) {
  if (big) return "grande";
  return it.art === "la" ? "pequeña" : "pequeño";
}

var PHRASES = {
  hola: "¡Hola! Vamos a jugar.",
  hint: "¡Mira! Aquí está.",
  rest: "¡Muy buen trabajo! Ahora vamos a descansar y a jugar en casa.",
  // find
  question: function (it) { return "¿Dónde está " + it.art + " " + it.name + "?"; },
  wrong: function (it) { return (it.art === "la" ? "Esa es " : "Ese es ") + it.art + " " + it.name + "."; },
  name: function (it) {
    var n = "¡" + cap(it.name) + "!";
    return it.sound ? n + " " + it.sound : n;
  },
  // match
  matchQ: "¿Cuál es igual a este?",
  matchWrong: "Ese no es igual. Mira otra vez.",
  matchOk: "¡Son iguales!",
  // hide
  hideLook: function (it) { return "Mira " + it.art + " " + it.name + "."; },
  hideQ: function (it) { return "¿Dónde se escondió " + it.art + " " + it.name + "?"; },
  hideWrong: "Aquí no está. Busca otra vez.",
  hideOk: function (it) { return "¡Aquí está " + it.art + " " + it.name + "!"; },
  // size
  sizeQ: function (it, big) { return "¿Dónde está " + it.art + " " + it.name + " " + sizeWord(it, big) + "?"; },
  sizeWrong: "Ese no es. Mira otra vez.",
  sizeOk: function (it, big) { return "¡" + cap(it.art) + " " + it.name + " " + sizeWord(it, big) + "!"; }
};

// Clave de archivo de audio para un texto (la misma en el navegador y al generar audios)
function clipKey(text) {
  var h = 5381;
  for (var i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// Todas las frases que puede decir la app (para generar los audios de reserva)
function allTexts() {
  var t = [PHRASES.hola, PHRASES.hint, PHRASES.rest, PHRASES.matchQ, PHRASES.matchWrong, PHRASES.matchOk, PHRASES.hideWrong, PHRASES.sizeWrong];
  t = t.concat(PRAISE);
  var findItems = COLORS.concat(ANIMALS, SHAPE_LIST);
  findItems.forEach(function (it) { t.push(PHRASES.question(it), PHRASES.wrong(it), PHRASES.name(it)); });
  ANIMALS.forEach(function (it) { t.push(PHRASES.hideLook(it), PHRASES.hideQ(it), PHRASES.hideOk(it)); });
  ANIMALS.concat(SHAPE_LIST).forEach(function (it) {
    [true, false].forEach(function (big) { t.push(PHRASES.sizeQ(it, big), PHRASES.sizeOk(it, big)); });
  });
  return t.filter(function (x, i) { return t.indexOf(x) === i; });
}

if (typeof module !== "undefined") {
  module.exports = { GAMES: GAMES, GAME_ORDER: GAME_ORDER, PRAISE: PRAISE, PHRASES: PHRASES, clipKey: clipKey, allTexts: allTexts };
}
