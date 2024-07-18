import * as Tone from "tone";
import { pianoKeyMapping } from "./utils.js";

// Set up Tone.js
const pianoWithEffects = new Tone.Sampler({
    urls: pianoKeyMapping,
    baseUrl: "/music/",
}).toDestination();

const reverb = new Tone.Reverb({ decay: 5, wet: 0.3 }).toDestination();
const delay = new Tone.FeedbackDelay("8n", 0.25).connect(reverb);
pianoWithEffects.connect(delay);

export { pianoWithEffects };
