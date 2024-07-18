import * as Tone from "tone";
import { pianoKeyMapping } from "./utils";
import { playSVGPath } from "./svgMusic.js";

const svgUpload = document.getElementById("svgUpload");
const playButton = document.getElementById("playButton");
const svgContainer = document.getElementById("svgContainer");
const pianoContainer = document.getElementById("piano");

let pathData = null;

// Set up Tone.js
const pianoWithEffects = new Tone.Sampler({
  urls: pianoKeyMapping,
  baseUrl: "/music/",
}).toDestination();

const reverb = new Tone.Reverb({ decay: 5, wet: 0.3 }).toDestination();
const delay = new Tone.FeedbackDelay("8n", 0.25).connect(reverb);
pianoWithEffects.connect(delay);

// Create piano keys
const notes = ["C", "D", "E", "F", "G", "A", "B"];
const octaves = [2, 3, 4, 5, 6];

octaves.forEach((octave) => {
  notes.forEach((note, index) => {
    const whiteKey = document.createElement("div");
    whiteKey.className = "key white";
    whiteKey.dataset.note = `${note}${octave}`;
    pianoContainer.appendChild(whiteKey);

    if (index !== 2 && index !== 6) {
      const blackKey = document.createElement("div");
      blackKey.className = "key black";
      blackKey.dataset.note = `${note}#${octave}`;
      pianoContainer.appendChild(blackKey);
    }
  });
});

// Highlight key function
function highlightKey(note) {
  const key = document.querySelector(`.key[data-note="${note}"]`);
  if (key) {
    key.classList.add("active");
    setTimeout(() => key.classList.remove("active"), 200);
  }
}

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

      // Display the SVG
      svgContainer.innerHTML = svgContent;

      // Adjust SVG size if needed
      const svgElement = svgContainer.querySelector("svg");
      if (svgElement) {
        svgElement.setAttribute("width", "100%");
        svgElement.setAttribute("height", "auto");
      }
    } else {
      console.error("No path found in SVG");
      svgContainer.innerHTML = "<p>No valid SVG path found</p>";
    }
  };

  reader.readAsText(file);
});

playButton.addEventListener("click", async () => {
  if (pathData) {
    await Tone.start();
    playSVGPath(pathData, highlightKey);
  } else {
    alert("Please upload an SVG file first.");
  }
});

export { pianoWithEffects };
