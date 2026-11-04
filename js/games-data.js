// Datos de los tres juegos. Lo usan las páginas y el script que genera los audios de reserva.
// Cada elemento: key (archivo de audio), art (el/la), name (nombre), sound (opcional).
var GAMES = {
  colores: {
    title: "¿Dónde está el color?",
    icon: "🎨",
    items: [
      { key: "rojo",     art: "el", name: "rojo",     hex: "#e63946" },
      { key: "azul",     art: "el", name: "azul",     hex: "#1e6fd9" },
      { key: "amarillo", art: "el", name: "amarillo", hex: "#ffd60a" },
      { key: "verde",    art: "el", name: "verde",    hex: "#2a9d3f" },
      { key: "naranja",  art: "el", name: "naranja",  hex: "#ff8c1a" },
      { key: "morado",   art: "el", name: "morado",   hex: "#8e44ad" },
      { key: "rosa",     art: "el", name: "rosa",     hex: "#ff7eb6" },
      { key: "negro",    art: "el", name: "negro",    hex: "#222222" },
      { key: "blanco",   art: "el", name: "blanco",   hex: "#ffffff" },
      { key: "marron",   art: "el", name: "marrón",   hex: "#8b5a2b" }
    ]
  },
  animales: {
    title: "¿Dónde está el animal?",
    icon: "🐶",
    items: [
      { key: "perro",   art: "el", name: "perro",   emoji: "🐶", sound: "¡Guau, guau!" },
      { key: "gato",    art: "el", name: "gato",    emoji: "🐱", sound: "¡Miau!" },
      { key: "vaca",    art: "la", name: "vaca",    emoji: "🐮", sound: "¡Muuu!" },
      { key: "cerdo",   art: "el", name: "cerdo",   emoji: "🐷", sound: "¡Oink, oink!" },
      { key: "gallina", art: "la", name: "gallina", emoji: "🐔", sound: "¡Clo, clo!" },
      { key: "caballo", art: "el", name: "caballo", emoji: "🐴", sound: "¡Iiiii!" },
      { key: "oveja",   art: "la", name: "oveja",   emoji: "🐑", sound: "¡Beee!" },
      { key: "pato",    art: "el", name: "pato",    emoji: "🦆", sound: "¡Cuac, cuac!" },
      { key: "leon",    art: "el", name: "león",    emoji: "🦁", sound: "¡Grrr!" },
      { key: "rana",    art: "la", name: "rana",    emoji: "🐸", sound: "¡Croac, croac!" }
    ]
  },
  figuras: {
    title: "¿Dónde está la figura?",
    icon: "🔺",
    items: [
      { key: "circulo",    art: "el", name: "círculo",    shape: "circulo" },
      { key: "cuadrado",   art: "el", name: "cuadrado",   shape: "cuadrado" },
      { key: "triangulo",  art: "el", name: "triángulo",  shape: "triangulo" },
      { key: "estrella",   art: "la", name: "estrella",   shape: "estrella" },
      { key: "corazon",    art: "el", name: "corazón",    shape: "corazon" },
      { key: "rectangulo", art: "el", name: "rectángulo", shape: "rectangulo" },
      { key: "rombo",      art: "el", name: "rombo",      shape: "rombo" },
      { key: "ovalo",      art: "el", name: "óvalo",      shape: "ovalo" }
    ]
  }
};

var PRAISE = ["¡Muy bien!", "¡Bravo!", "¡Excelente!", "¡Sí, ahí está!", "¡Genial!"];

// Frases (las mismas para la voz del teléfono y para los audios de reserva)
var PHRASES = {
  hola: "¡Hola! Vamos a jugar.",
  question: function (it) { return "¿Dónde está " + it.art + " " + it.name + "?"; },
  wrong: function (it) { return (it.art === "la" ? "Esa es " : "Ese es ") + it.art + " " + it.name + "."; },
  name: function (it) {
    var n = "¡" + it.name.charAt(0).toUpperCase() + it.name.slice(1) + "!";
    return it.sound ? n + " " + it.sound : n;
  }
};

if (typeof module !== "undefined") module.exports = { GAMES: GAMES, PRAISE: PRAISE, PHRASES: PHRASES };
