// scoreDSL.js
//
// The DSL: Students only call `addSinglePart(events)`, `addDoublePart(events)`,
// and then `getScoreAndReset()` to retrieve the final score.
//
// Each "events" array element is an object with 5 properties (all arrays of possible values):
// 1) start: possible start times
// 2) type: ["notes"] or ["rests"]
// 3) notes: for pitched events, possible note names (e.g. ["C4", "E4"]); for rests, we also provide note names
//           (e.g. ["F2", "C5"]) to choose from so we can place the rest in the correct staff
// 4) durations: array of possible durations
// 5) loudness: array of possible velocities
//
// The DSL randomly picks one value from each property, forming a single note or rest. We store pitch for rests
// as well so that double-part staff splitting can place them properly. Then we sort by start time and store
// these notes in the part.

let _score = [];

/**
 * addSinglePart(events)
 *
 * Creates a single-staff part (treble clef) from the given event array and
 * adds it to the internal score.
 */
export function addSinglePart(events) {
  const noteObjects = generateNotesFromEvents(events);
  _score.push({
    voicesNeeded: 1,
    clefs: ["treble"],
    notes: noteObjects
  });
}

/**
 * addDoublePart(events)
 *
 * Creates a double-staff part (treble + bass) from the given event array
 * and adds it to the internal score.
 */
export function addDoublePart(events) {
  const noteObjects = generateNotesFromEvents(events);
  _score.push({
    voicesNeeded: 2,
    clefs: ["treble", "bass"],
    notes: noteObjects
  });
}

/**
 * getScoreAndReset()
 *
 * Returns the complete score (array of parts) and clears it for the next iteration.
 */
export function getScoreAndReset() {
  const s = _score;
  _score = [];
  return s;
}

/**
 * generateNotesFromEvents(events)
 *
 * For each event in the array, pick exactly one value from each array
 * (start, type, notes, durations, loudness) to create a single note object.
 * Sort the resulting list by start time and return it.
 */
function generateNotesFromEvents(events) {
  let result = [];
  events.forEach(evt => {
    const start = randomChoice(evt.start);
    const t = randomChoice(evt.type);
    const duration = randomChoice(evt.durations);
    const velocity = randomChoice(evt.loudness);
    // Even for rests, pick a note name to determine pitch placement.
    const chosenNoteName = randomChoice(evt.notes);
    let pitch = chosenNoteName ? noteNameToMidi(chosenNoteName) : 0;
    result.push({
      start: start,
      pitch: pitch, // used for staff splitting, even if type is rest
      duration: duration,
      velocity: velocity,
      type: (t === "note" || t === "notes") ? "note" : "rest"
    });
  });
  result.sort((a, b) => a.start - b.start);
  return result;
}


/**
 * noteNameToMidi(noteStr)
 *
 * Converts note name (e.g. "C4", "Eb3") into MIDI number,
 * with the convention that C4=60.
 */
function noteNameToMidi(noteStr) {
  const noteRegex = /^([A-G])(#|b)?(\d+)$/;
  const match = noteStr.match(noteRegex);
  if (!match) {
    // If there's no match, default to 0 => that would place it in the lower staff
    // or you could throw an error if you want stricter checks
    console.warn(`Invalid note format: ${noteStr}. Defaulting pitch=0`);
    return 0;
  }
  const letter = match[1];
  const accidental = match[2] || "";
  const octave = parseInt(match[3], 10);
  const baseMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let midi = 12 * (octave + 1) + baseMap[letter];
  if (accidental === "#") midi += 1;
  else if (accidental === "b") midi -= 1;
  return midi;
}

/**
 * randomChoice(arr)
 *
 * Returns a random element from the array.
 */
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}