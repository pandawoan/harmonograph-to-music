import * as Tone from "tone";
import { pianoKeyMapping } from "./utils";
import { playSVGPath } from "./svgMusic.js";

const svgUpload = document.getElementById("svgUpload");
const playButton = document.getElementById("playButton");

let pathData = null;

// Set up Tone.js
const pianoWithEffects = new Tone.Sampler({
    urls: pianoKeyMapping,
    baseUrl: "/music/",
}).toDestination();

const reverb = new Tone.Reverb({ decay: 5, wet: 0.3 }).toDestination();
const delay = new Tone.FeedbackDelay("8n", 0.25).connect(reverb);
pianoWithEffects.connect(delay);

svgUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const svgContent = e.target.result;
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
        const pathElement = svgDoc.querySelector("path");
        if (pathElement) {
            pathData = pathElement.getAttribute("d");
        } else {
            console.error("No path found in SVG");
        }
    };

    reader.readAsText(file);
});

playButton.addEventListener("click", async () => {
    if (pathData) {
        await Tone.start();
        playSVGPath(pathData);
    } else {
        alert("Please upload an SVG file first.");
    }
});

export { pianoWithEffects };
