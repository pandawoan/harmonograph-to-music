import * as Tone from "tone";
import { pianoKeyMapping } from "./utils";

const scales = {
  C: ["C", "D", "E", "F", "G", "A", "B"],
  G: ["G", "A", "B", "C", "D", "E", "F#"],
  F: ["F", "G", "A", "Bb", "C", "D", "E"],
  Am: ["A", "B", "C", "D", "E", "F", "G"],
};

const dreamyProgressions = [
  ["I", "IV", "vi", "V"],
  ["vi", "IV", "I", "V"],
  ["I", "V", "vi", "IV"],
  ["IV", "I", "V", "vi"],
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
  F: {
    I: ["F", "A", "C"],
    ii: ["G", "Bb", "D"],
    iii: ["A", "C", "E"],
    IV: ["Bb", "D", "F"],
    V: ["C", "E", "G"],
    vi: ["D", "F", "A"],
    vii: ["E", "G", "Bb"],
  },
  Am: {
    i: ["A", "C", "E"],
    ii: ["B", "D", "F"],
    III: ["C", "E", "G"],
    iv: ["D", "F", "A"],
    v: ["E", "G", "B"],
    VI: ["F", "A", "C"],
    VII: ["G", "B", "D"],
  },
};

function playSVGPath(path, visualize) {
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
    wet: 0.7,
  }).toDestination();

  const delay = new Tone.FeedbackDelay({
    delayTime: "8n.",
    feedback: 0.3,
    wet: 0.25,
  }).connect(reverb);

  const chorus = new Tone.Chorus({
    frequency: 0.8,
    delayTime: 4,
    depth: 0.5,
    wet: 0.4,
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

  function getNearestChordTone(note, chord) {
    const noteIndex = currentScale.indexOf(note.slice(0, -1));
    const chordIndices = chord.map((n) => currentScale.indexOf(n));
    const nearestIndex = chordIndices.reduce((nearest, idx) =>
      Math.abs(idx - noteIndex) < Math.abs(nearest - noteIndex) ? idx : nearest
    );
    return currentScale[nearestIndex] + note.slice(-1);
  }

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

      if (index % 64 === 0) {
        currentProgression =
          dreamyProgressions[
            Math.floor(Math.random() * dreamyProgressions.length)
          ];
        chordIndex = 0;
        currentKey = ["C", "G", "F", "Am"][Math.floor(Math.random() * 4)];
        currentScale = scales[currentKey];
      }

      const chordName = currentProgression[chordIndex];
      const chord = chords[currentKey][chordName];

      const noteIndex = Math.floor(Math.abs(x) % currentScale.length);
      const octave = Math.floor(3 + (Math.abs(y) % 3));
      let note = `${currentScale[noteIndex]}${octave}`;

      const velocity = 0.1 + Math.min(0.2, Math.abs(x) / 3000);
      const duration = Tone.Time("4n") + Tone.Time("8n") * (Math.abs(y) % 4);

      // Play chord
      if (index % 8 === 0) {
        chord.forEach((chordNote, i) => {
          const fullNote = `${chordNote}${octave - 1}`;
          pianoWithEffects.triggerAttackRelease(
            fullNote,
            "2n",
            time + i * 0.12,
            velocity * 0.5
          );
          visualize(fullNote);
        });
        chordIndex = (chordIndex + 1) % currentProgression.length;
      }

      // Play melody note
      if (Math.random() < 0.6) {
        note = getNearestChordTone(note, chord);
        pianoWithEffects.triggerAttackRelease(note, duration, time, velocity);
        visualize(note);

        // Add occasional harmonies
        if (Math.random() < 0.2) {
          const harmonyInterval = [3, 4, 5][Math.floor(Math.random() * 3)];
          const harmonyNote =
            currentScale[(noteIndex + harmonyInterval) % currentScale.length] +
            octave;
          pianoWithEffects.triggerAttackRelease(
            harmonyNote,
            duration,
            time + Tone.Time("32n"),
            velocity * 0.4
          );
          visualize(harmonyNote);
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
        visualize(bassNote);
      }

      previousNote = note;
    },
    [...Array(maxCommands).keys()],
    "4n"
  );

  Tone.Transport.bpm.value = 55;
  sequence.start(0);
  Tone.Transport.start();
}

export { playSVGPath };
