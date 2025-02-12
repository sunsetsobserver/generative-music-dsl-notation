// main.js
// This example creates one single-part (melodic line).
// It uses multiple events with diverse parameter arrays and even includes chord-like events
// (by having several events share the same start value).

import { addSinglePart, addDoublePart, getScoreAndReset } from "./scoreDSL.js";
import { renderScore } from "./musicDisplay.js";
// -------------------------
// Define the event arrays for our composition
// -------------------------

// Single-Part (melodic) events – a longer, varied melodic line with many notes and few rests.
const singlePartEvents = [
  {
    // Event 1: Opening motif; mostly notes.
    start: [0.0, 0.1],
    type: ["note", "note", "note", "rest"], // ~75% chance to be a note
    notes: ["C5", "D5", "E5", "F5", "G5"],
    durations: [0.5, 1.0, 1.5],
    loudness: [60, 70, 80]
  },
  {
    // Event 2: To create a chord, we use two separate events with identical start.
    start: [1.0],
    type: ["note"],
    notes: ["G5"],
    durations: [1.0],
    loudness: [75]
  },
  {
    // Event 3: Second voice of the chord.
    start: [1.0],
    type: ["note"],
    notes: ["B5"],
    durations: [1.0],
    loudness: [80]
  },
  {
    // Event 4: A quick melodic run.
    start: [2.0, 2.1, 2.2],
    type: ["note", "note"],
    notes: ["E5", "F5", "G5"],
    durations: [0.5, 1.0],
    loudness: [65, 70, 75]
  },
  {
    // Event 5: A long, sustained note.
    start: [3.0, 3.1],
    type: ["note"],
    notes: ["A5"],
    durations: [2.0],
    loudness: [70, 80]
  },
  {
    // Event 6: A brief passage.
    start: [5.0, 5.1],
    type: ["note", "note", "note"],
    notes: ["G5", "F5", "E5"],
    durations: [0.5, 1.0],
    loudness: [60, 70, 80]
  },
  {
    // Event 7: A brief rest (but its note array is used for placement).
    start: [6.0, 6.1],
    type: ["rest"],
    notes: ["C5", "D5"],  // If "C5" is chosen (pitch 72) the rest will be placed on the upper staff,
                         // if "D5" (74) is chosen, similarly.
    durations: [0.5],
    loudness: [0]
  },
  {
    // Event 8: A concluding phrase.
    start: [7.0, 7.1],
    type: ["note"],
    notes: ["E5", "G5", "C6"],
    durations: [1.0, 1.5],
    loudness: [65, 80]
  },
  {
    // Event 9: A final flourish.
    start: [8.0, 8.5],
    type: ["note"],
    notes: ["E5", "G5", "B5"],
    durations: [1.0, 2.0],
    loudness: [70, 85]
  },
  {
    // Event 10: Ending the phrase.
    start: [9.0, 9.5],
    type: ["note"],
    notes: ["C5", "E5", "G5"],
    durations: [1.0, 1.5],
    loudness: [65, 80]
  }
];

// -------------------------
// Score Generation, Rendering, and Playback Setup
// -------------------------

// We assume that our DSL maintains an internal score. When we call addSinglePart or addDoublePart,
// the events are processed and added to the internal score.
// Then, getScoreAndReset() returns the final score (an array of parts).
function generateScore() {
  // Clear any existing score and add our two parts.
  addSinglePart(singlePartEvents);
  return getScoreAndReset();
}

// Global variable to hold the current score (for both rendering and playback).
let currentScore = [];

// Generate and render score
function generateAndRender() {
  currentScore = generateScore();
  renderScore(currentScore, document.getElementById("scoreContainer"));
}

document.getElementById("generateButton").addEventListener("click", generateAndRender);

// Generate once on initial load.
generateAndRender();
