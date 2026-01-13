function speak(text) {
  window.speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "es-ES";
  msg.rate = 0.8;   // lento para niños
  msg.pitch = 1.1; // tono agradable
  msg.volume = 1;

  window.speechSynthesis.speak(msg);
}
