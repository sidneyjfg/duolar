"use client";

let audioContext: AudioContext | undefined;

function getAudioContext() {
  if (typeof window === "undefined") return undefined;
  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return undefined;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

function tone(context: AudioContext, frequency: number, start: number, duration: number, gain: number, type: OscillatorType = "sine") {
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(volume).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.025);
}

export function playEntrySound(kind: "success" | "failure") {
  const context = getAudioContext();
  if (!context) return;
  void context.resume();
  const now = context.currentTime;

  if (kind === "success") {
    tone(context, 392, now, 0.075, 0.035, "triangle");
    tone(context, 620, now + 0.075, 0.105, 0.028, "sine");
    tone(context, 860, now + 0.19, 0.08, 0.018, "sine");
    return;
  }

  tone(context, 220, now, 0.09, 0.03, "sawtooth");
  tone(context, 164, now + 0.095, 0.11, 0.022, "triangle");
}
