// Voz en español. Busca una voz española instalada (es-ES, es-MX, es-US...)
// porque en muchos teléfonos no existe exactamente "es-ES" y entonces no suena.
let spanishVoice = null;

function pickSpanishVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  spanishVoice =
    voices.find(v => /^es[-_]ES/i.test(v.lang)) ||
    voices.find(v => /^es[-_](MX|US|419)/i.test(v.lang)) ||
    voices.find(v => /^es/i.test(v.lang)) ||
    null;
}

if ("speechSynthesis" in window) {
  pickSpanishVoice();
  window.speechSynthesis.onvoiceschanged = pickSpanishVoice;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  const msg = new SpeechSynthesisUtterance(text);
  if (spanishVoice) {
    msg.voice = spanishVoice;
    msg.lang = spanishVoice.lang;
  } else {
    msg.lang = "es-ES";
  }
  msg.rate = 0.8;   // lento para niños
  msg.pitch = 1.1;  // tono agradable
  msg.volume = 1;

  if (synth.speaking || synth.pending) {
    // Chrome a veces ignora un speak() justo después de cancel(): esperar un poco.
    synth.cancel();
    setTimeout(() => { synth.resume(); synth.speak(msg); }, 60);
  } else {
    // Llamada directa: iOS solo permite la primera voz dentro del toque del usuario.
    synth.resume();
    synth.speak(msg);
  }
}
