import * as Tone from "tone";
import { pianoKeyMapping } from "./utils";

const scales = {
  C: ["C", "D", "E", "F", "G", "A", "B"],
  G: ["G", "A", "B", "C", "D", "E", "F#"],
  D: ["D", "E", "F#", "G", "A", "B", "C#"],
  A: ["A", "B", "C#", "D", "E", "F#", "G#"],
  F: ["F", "G", "A", "Bb", "C", "D", "E"],
  Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
  Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
  B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  Fsharp: ["F#", "G#", "A#", "B", "C#", "D#", "F"],
  Cminor: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
  Aminor: ["A", "B", "C", "D", "E", "F", "G"],
  Eminor: ["E", "F#", "G", "A", "B", "C", "D"],
};

const dreamyProgressions = [
  ["I", "vi", "IV", "V"],
  ["vi", "IV", "I", "V"],
  ["I", "iii", "vi", "IV"],
  ["IV", "V", "iii", "vi"],
];

const chords = {
  C: {
    I: ["C", "E", "G"],
    ii: ["D", "F", "A"],
    iii: ["E", "G", "B"],
    IV: ["F", "A", "C"],
    V: ["G", "B", "D"],
    vi: ["A", "C", "E"],
    vii: ["B", "D", "F"],
  },
  G: {
    I: ["G", "B", "D"],
    ii: ["A", "C", "E"],
    iii: ["B", "D", "F#"],
    IV: ["C", "E", "G"],
    V: ["D", "F#", "A"],
    vi: ["E", "G", "B"],
    vii: ["F#", "A", "C"],
  },
  D: {
    I: ["D", "F#", "A"],
    ii: ["E", "G", "B"],
    iii: ["F#", "A", "C#"],
    IV: ["G", "B", "D"],
    V: ["A", "C#", "E"],
    vi: ["B", "D", "F#"],
    vii: ["C#", "E", "G"],
  },
  A: {
    I: ["A", "C#", "E"],
    ii: ["B", "D", "F#"],
    iii: ["C#", "E", "G#"],
    IV: ["D", "F#", "A"],
    V: ["E", "G#", "B"],
    vi: ["F#", "A", "C#"],
    vii: ["G#", "B", "D"],
  },
  E: {
    I: ["E", "G#", "B"],
    ii: ["F#", "A", "C#"],
    iii: ["G#", "B", "D#"],
    IV: ["A", "C#", "E"],
    V: ["B", "D#", "F#"],
    vi: ["C#", "E", "G#"],
    vii: ["D#", "F#", "A"],
  },
  B: {
    I: ["B", "D#", "F#"],
    ii: ["C#", "E", "G#"],
    iii: ["D#", "F#", "A#"],
    IV: ["E", "G#", "B"],
    V: ["F#", "A#", "C#"],
    vi: ["G#", "B", "D#"],
    vii: ["A#", "C#", "E"],
  },
  F: {
    I: ["F", "A", "C"],
    ii: ["G", "Bb", "D"],
    iii: ["A", "C", "E"],
    IV: ["Bb", "D", "F"],
    V: ["C", "E", "G"],
    vi: ["D", "F", "A"],
    vii: ["E", "G", "Bb"],
  },
  Bb: {
    I: ["Bb", "D", "F"],
    ii: ["C", "Eb", "G"],
    iii: ["D", "F", "A"],
    IV: ["Eb", "G", "Bb"],
    V: ["F", "A", "C"],
    vi: ["G", "Bb", "D"],
    vii: ["A", "C", "Eb"],
  },
  Eb: {
    I: ["Eb", "G", "Bb"],
    ii: ["F", "Ab", "C"],
    iii: ["G", "Bb", "D"],
    IV: ["Ab", "C", "Eb"],
    V: ["Bb", "D", "F"],
    vi: ["C", "Eb", "G"],
    vii: ["D", "F", "Ab"],
  },
  Ab: {
    I: ["Ab", "C", "Eb"],
    ii: ["Bb", "Db", "F"],
    iii: ["C", "Eb", "G"],
    IV: ["Db", "F", "Ab"],
    V: ["Eb", "G", "Bb"],
    vi: ["F", "Ab", "C"],
    vii: ["G", "Bb", "Db"],
  },
  Db: {
    I: ["Db", "F", "Ab"],
    ii: ["Eb", "Gb", "Bb"],
    iii: ["F", "Ab", "C"],
    IV: ["Gb", "Bb", "Db"],
    V: ["Ab", "C", "Eb"],
    vi: ["Bb", "Db", "F"],
    vii: ["C", "Eb", "Gb"],
  },
  Gb: {
    I: ["Gb", "Bb", "Db"],
    ii: ["Ab", "Cb", "Eb"],
    iii: ["Bb", "Db", "F"],
    IV: ["Cb", "Eb", "Gb"],
    V: ["Db", "F", "Ab"],
    vi: ["Eb", "Gb", "Bb"],
    vii: ["F", "Ab", "Cb"],
  },
};

function playSVGPath(path, highlightKeyCallback) {
  const commands = path.match(/[A-Za-z][^A-Za-z]*/g) || [];
  const maxCommands = Math.min(400, commands.length);

  if (maxCommands === 0) {
    console.error("No valid commands found in SVG path");
    return;
  }

  let currentKey = "C";
  let currentScale = scales[currentKey];
  let currentProgression = dreamyProgressions[0];
  let chordIndex = 0;
  let previousNote = null;

  const reverb = new Tone.Reverb({
    decay: 15,
    wet: 0.8,
  }).toDestination();

  const delay = new Tone.FeedbackDelay({
    delayTime: "8n.",
    feedback: 0.4,
    wet: 0.3,
  }).connect(reverb);

  const chorus = new Tone.Chorus({
    frequency: 0.8,
    delayTime: 5,
    depth: 0.7,
    wet: 0.5,
  }).connect(delay);

  const compressor = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.1,
    release: 0.5,
  }).connect(chorus);

  const pianoWithEffects = new Tone.Sampler({
    urls: pianoKeyMapping,
    baseUrl: "/music/",
  }).chain(compressor, chorus, delay, reverb, Tone.Destination);

  const sequence = new Tone.Sequence(
    (time, index) => {
      if (index >= maxCommands) {
        sequence.stop();
        Tone.Transport.stop();
        return;
      }

      const command = commands[index];
      if (!command) return;

      const numbers = command.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
      if (numbers.length < 2) return;

      const [x, y] = numbers;

      if (index % 48 === 0) {
        currentProgression =
          dreamyProgressions[
            Math.floor(Math.random() * dreamyProgressions.length)
          ];
        chordIndex = 0;
        currentKey =
          Object.keys(scales)[
            Math.floor(Math.random() * Object.keys(scales).length)
          ];
        currentScale = scales[currentKey];
      }

      const chordName = currentProgression[chordIndex];
      const chord = chords[currentKey][chordName];

      const noteIndex = Math.floor(Math.abs(x) % currentScale.length);
      const octave = Math.floor(3 + (Math.abs(y) % 3));
      const note = `${currentScale[noteIndex]}${octave}`;

      const velocity = 0.1 + Math.min(0.2, Math.abs(x) / 3000);
      const duration = Tone.Time("4n") + Tone.Time("8n") * (Math.abs(y) % 4);

      // Play chord
      if (index % 6 === 0) {
        chord.forEach((chordNote, i) => {
          const fullNote = `${chordNote}${octave - 1}`;
          pianoWithEffects.triggerAttackRelease(
            fullNote,
            "2n",
            time + i * 0.12,
            velocity * 0.5
          );
          highlightKeyCallback(fullNote);
        });
        chordIndex = (chordIndex + 1) % currentProgression.length;
      }

      // Play melody note
      if (Math.random() < 0.5) {
        pianoWithEffects.triggerAttackRelease(note, duration, time, velocity);
        highlightKeyCallback(note);

        // Add occasional harmonies
        if (Math.random() < 0.3) {
          const harmonyNote =
            currentScale[(noteIndex + 2) % currentScale.length] + octave;
          pianoWithEffects.triggerAttackRelease(
            harmonyNote,
            duration,
            time + Tone.Time("16n"),
            velocity * 0.4
          );
          highlightKeyCallback(harmonyNote);
        }
      }

      // Add occasional bass note
      if (Math.random() < 0.1) {
        const bassNote = chord[0] + (octave - 2);
        pianoWithEffects.triggerAttackRelease(
          bassNote,
          "2n",
          time,
          velocity * 0.3
        );
        highlightKeyCallback(bassNote);
      }

      // Add occasional high sparkling notes
      if (Math.random() < 0.05) {
        const sparkleNote =
          currentScale[Math.floor(Math.random() * currentScale.length)] +
          (octave + 1);
        pianoWithEffects.triggerAttackRelease(
          sparkleNote,
          "8n",
          time,
          velocity * 0.2
        );
        highlightKeyCallback(sparkleNote);
      }

      previousNote = note;
    },
    [...Array(maxCommands).keys()],
    "4n"
  );

  Tone.Transport.bpm.value = 50;
  sequence.start(0);
  Tone.Transport.start();
}

export { playSVGPath };
