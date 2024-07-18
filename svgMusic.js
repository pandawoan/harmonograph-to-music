import { playNote } from "./visualizer.js";
import { pianoKeyMapping } from "./utils";
import * as Tone from "tone";

const scales = {
    C: ["C", "D", "E", "F", "G", "A", "B"],
    G: ["G", "A", "B", "C", "D", "E", "F#"],
    F: ["F", "G", "A", "Bb", "C", "D", "E"],
    Am: ["A", "B", "C", "D", "E", "F", "G"],
    Em: ["E", "F#", "G", "A", "B", "C", "D"],
};

const chordProgressions = {
    C: [
        ["C", "Am", "F", "G", "Em", "Am", "Dm", "G"],
        ["C", "Em", "Am", "F", "C", "Dm", "G", "C"],
    ],
    G: [
        ["G", "Em", "C", "D", "Bm", "C", "Am", "D"],
        ["G", "Bm", "Em", "C", "G", "Am", "D", "G"],
    ],
    F: [
        ["F", "Dm", "Bb", "C", "Am", "Dm", "Gm", "C"],
        ["F", "Am", "Dm", "Bb", "F", "Gm", "C", "F"],
    ],
    Am: [
        ["Am", "F", "C", "G", "Am", "Em", "F", "G"],
        ["Am", "Dm", "G", "C", "F", "Dm", "E", "Am"],
    ],
    Em: [
        ["Em", "C", "G", "D", "Am", "C", "B", "Em"],
        ["Em", "G", "D", "C", "Am", "B", "Em", "B"],
    ],
};

const chords = {
    C: ["C", "E", "G"],
    F: ["F", "A", "C"],
    G: ["G", "B", "D"],
    Am: ["A", "C", "E"],
    Dm: ["D", "F", "A"],
    E: ["E", "G#", "B"],
    Bb: ["Bb", "D", "F"],
    D: ["D", "F#", "A"],
    Em: ["E", "G", "B"],
    Bm: ["B", "D", "F#"],
    Gm: ["G", "Bb", "D"],
};

function playSVGPath(path) {
    const commands = path.match(/[A-Za-z][^A-Za-z]*/g) || [];
    const maxCommands = Math.min(400, commands.length);

    if (maxCommands === 0) {
        console.error("No valid commands found in SVG path");
        return;
    }

    let currentKey = "C";
    let currentScale = scales[currentKey];
    let currentChordProgression = chordProgressions[currentKey][0];
    let chordIndex = 0;
    let previousNote = null;
    let phraseStart = 0;
    let tempoMultiplier = 1;
    let melodyDensity = 0.5;

    const sequence = new Tone.Sequence(
        (time, index) => {
            if (index >= maxCommands) {
                sequence.stop();
                Tone.getTransport().stop();
                return;
            }

            const command = commands[index];
            if (!command) return;

            const numbers = command.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
            if (numbers.length < 2) return;

            const [x, y] = numbers;

            // Change key and chord progression every 32 steps
            if (index % 32 === 0) {
                const keys = Object.keys(scales);
                currentKey = keys[Math.floor(Math.random() * keys.length)];
                currentScale = scales[currentKey];
                currentChordProgression =
                    chordProgressions[currentKey][
                        Math.floor(
                            Math.random() * chordProgressions[currentKey].length
                        )
                    ];
                chordIndex = 0;
                phraseStart = index;

                tempoMultiplier = 0.8 + Math.random() * 0.4;
                Tone.Transport.bpm.rampTo(60 * tempoMultiplier, 2);

                melodyDensity = 0.3 + Math.random() * 0.5;
            }

            const chordName = currentChordProgression[chordIndex];
            const chord = chords[chordName];

            if (!chord) {
                console.error(`Invalid chord: ${chordName}`);
                return;
            }

            const noteIndex = Math.floor(Math.abs(x) % currentScale.length);
            const octave = Math.floor(Math.abs(y) % 3) + 3;
            const note = `${currentScale[noteIndex]}${octave}`;

            const baseVelocity = Math.min(0.7, Math.abs(x) / 300 + 0.3);
            const velocity = baseVelocity * (0.8 + Math.random() * 0.4);
            const baseDuration =
                (0.5 + (Math.abs(y) % 5) * 0.3) * tempoMultiplier;

            // Harmonic foundation
            if (index % 3 === 0) {
                const patternType = Math.random();
                if (patternType < 0.6) {
                    // Gentle arpeggios
                    chord.forEach((chordNote, i) => {
                        playNote(
                            `${chordNote}${octave - 1}`,
                            "8n",
                            time + i * 0.25 * tempoMultiplier,
                            velocity * 0.3
                        );
                    });
                } else {
                    // Soft sustained chord
                    chord.forEach((chordNote) => {
                        playNote(
                            `${chordNote}${octave - 1}`,
                            "2n",
                            time,
                            velocity * 0.2
                        );
                    });
                }
                chordIndex = (chordIndex + 1) % currentChordProgression.length;
            }

            // Melody logic with variable density
            if (Math.random() < melodyDensity) {
                let melodyNote;
                if (chord.includes(currentScale[noteIndex])) {
                    melodyNote = note;
                } else {
                    const nearestChordTone = chord.reduce(
                        (nearest, chordNote) => {
                            return Math.abs(
                                currentScale.indexOf(chordNote) - noteIndex
                            ) <
                                Math.abs(
                                    currentScale.indexOf(nearest) - noteIndex
                                )
                                ? chordNote
                                : nearest;
                        }
                    );
                    melodyNote =
                        Math.random() < 0.8
                            ? `${nearestChordTone}${octave}`
                            : note;
                }

                // Apply voice leading
                if (previousNote) {
                    const interval = Math.abs(
                        currentScale.indexOf(melodyNote[0]) -
                            currentScale.indexOf(previousNote[0])
                    );
                    if (interval > 3) {
                        const direction = melodyNote > previousNote ? -1 : 1;
                        melodyNote = `${
                            currentScale[
                                (currentScale.indexOf(previousNote[0]) +
                                    direction +
                                    7) %
                                    7
                            ]
                        }${octave}`;
                    }
                }

                const timingVariation = Math.random() * 0.1 * tempoMultiplier;
                const noteDuration = baseDuration * (0.8 + Math.random() * 0.4);

                playNote(
                    melodyNote,
                    noteDuration,
                    time + timingVariation,
                    velocity * 0.9
                );

                previousNote = melodyNote;

                // Occasional soft echo
                if (Math.random() < 0.2) {
                    playNote(
                        melodyNote,
                        noteDuration * 0.5,
                        time + noteDuration * 1.2,
                        velocity * 0.4
                    );
                }

                // Add subtle ornamentation
                if (Math.random() < 0.15) {
                    const graceNote = `${
                        currentScale[(noteIndex + 1) % 7]
                    }${octave}`;
                    playNote(
                        graceNote,
                        "32n",
                        time - 0.05 * tempoMultiplier,
                        velocity * 0.6
                    );
                }
            }

            // Occasional soft background note for texture
            if (Math.random() < 0.08) {
                const textureNote = `${
                    currentScale[
                        Math.floor(Math.random() * currentScale.length)
                    ]
                }${octave - 1}`;
                playNote(
                    textureNote,
                    "2n",
                    time + 0.1 * tempoMultiplier,
                    velocity * 0.15
                );
            }
        },
        [...Array(maxCommands).keys()],
        "8n"
    );

    Tone.Transport.bpm.value = 60;
    sequence.start(0);
    Tone.Transport.start();
}

export { playSVGPath };
