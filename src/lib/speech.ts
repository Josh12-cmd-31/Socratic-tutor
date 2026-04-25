export type VoiceGender = "male" | "female";

export function speak(text: string, gender: VoiceGender, rate: number = 1, pitch: number = 1) {
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

  utterance.rate = rate;
  // Apply a small gender-based skew if pitch is default 1
  const basePitch = pitch === 1 ? (gender === "male" ? 0.9 : 1.1) : pitch;
  utterance.pitch = basePitch;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
