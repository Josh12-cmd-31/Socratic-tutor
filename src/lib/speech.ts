export type VoiceGender = "male" | "female";

export function speak(text: string, gender: VoiceGender) {
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a suitable voice
  const voices = window.speechSynthesis.getVoices();
  
  // Browsers have different naming conventions
  // We'll look for keywords in the voice names
  let voice;
  if (gender === "male") {
    voice = voices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Daniel") || v.name.includes("Google US English"));
  } else {
    voice = voices.find(v => v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google UK English Female") || v.name.includes("Victoria"));
  }

  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = 1;
  utterance.pitch = gender === "male" ? 0.9 : 1.1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
