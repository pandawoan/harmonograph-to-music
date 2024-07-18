import * as Tone from "tone";
import { pianoWithEffects } from "./main.js";

const piano = document.getElementById("piano");
const visualizer = document.getElementById("visualizer");
const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const octaves = 6;
const notes = [];
const activeNotes = new Map();

// Create piano keys
for (let octave = 0; octave < octaves; octave++) {
  keys.forEach((key) => {
    const keyElement = document.createElement("div");
    keyElement.className = `key ${key.includes("#") ? "black" : "white"}`;
    keyElement.dataset.note = `${key}${octave - 3}`;
    piano.appendChild(keyElement);
    notes.push(`${key}${octave - 3}`);
  });
}

// Function to play a note and create a visual representation
function playNote(note, duration, time, velocity, reverb, delay) {
  const synthWithEffects = pianoWithEffects.chain(delay, reverb);
  synthWithEffects.triggerAttackRelease(note, duration, time, velocity);

  const key = document.querySelector(`.key[data-note="${note.slice(0, -1)}"]`);
  if (key) {
    key.style.backgroundColor = "cyan";
    setTimeout(() => {
      key.style.backgroundColor = key.classList.contains("white")
        ? "#fff"
        : "#000";
    }, Tone.Time(duration).toMilliseconds());
  }

  const noteVisual = document.createElement("div");
  noteVisual.className = "note";
  noteVisual.style.left = `${scales.C.indexOf(note.slice(0, -1)) * 30}px`;
  noteVisual.style.height = `${Tone.Time(duration).toMilliseconds() * 0.2}px`;

  const hue = Math.floor(velocity * 270);
  noteVisual.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

  visualizer.appendChild(noteVisual);

  activeNotes.set(noteVisual, time + Tone.Time(duration).toSeconds());

  setTimeout(() => {
    visualizer.removeChild(noteVisual);
    activeNotes.delete(noteVisual);
  }, Tone.Time(duration).toMilliseconds());
}

// Animation loop
function animate() {
  const currentTime = Tone.now();
  activeNotes.forEach((endTime, noteVisual) => {
    const elapsedTime = currentTime - (endTime - noteVisual.offsetHeight / 0.2);
    const newBottom = elapsedTime * 200; // Adjust this value to change scroll speed
    noteVisual.style.bottom = `${newBottom}px`;

    if (newBottom > visualizer.offsetHeight) {
      visualizer.removeChild(noteVisual);
      activeNotes.delete(noteVisual);
    }
  });

  requestAnimationFrame(animate);
}

animate();

export { playNote };
