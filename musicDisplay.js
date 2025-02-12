// musicDisplay.js
// This module contains all the VexFlow rendering logic.
// It exports renderScore(scoreData, container) that renders the complete score.

const VF = Vex.Flow;
const TOLERANCE = 1e-6;
const QUANT_UNIT = 0.0625; // 64th note (if quarter note equals 1 beat)

function quantize(duration) {
  return Math.round(duration / QUANT_UNIT) * QUANT_UNIT;
}

const multipliers = [
  { dots: 0, multiplier: 1 },
  { dots: 1, multiplier: 1.5 },
  { dots: 2, multiplier: 1.75 },
  { dots: 3, multiplier: 1.875 }
];
const bases = [
  { value: 4, code: "w" },
  { value: 2, code: "h" },
  { value: 1, code: "q" },
  { value: 0.5, code: "8" },
  { value: 0.25, code: "16" },
  { value: 0.125, code: "32" },
  { value: 0.0625, code: "64" }
];
const candidatePool = [];
bases.forEach(base => {
  multipliers.forEach(m => {
    candidatePool.push({
      code: base.code,
      dots: m.dots,
      value: base.value * m.multiplier
    });
  });
});
candidatePool.sort((a, b) => b.value - a.value);

function decomposeDuration(duration) {
  let result = [];
  let remainder = duration;
  while (remainder > TOLERANCE) {
    let found = false;
    for (let cand of candidatePool) {
      if (cand.value <= remainder + TOLERANCE) {
        result.push(cand);
        remainder -= cand.value;
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return Math.abs(remainder) < TOLERANCE ? result : null;
}

function midiToKey(midi) {
  const names = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
  const idx = midi % 12;
  const noteName = names[idx];
  const octave = Math.floor(midi / 12) - 1;
  if (noteName.includes("#")) {
    return { key: noteName.replace("#", "") + "/" + octave, accidental: "#" };
  }
  return { key: noteName + "/" + octave, accidental: null };
}

function buildStaveNotes(noteArray, clefName) {
  // Sort by start time.
  noteArray.sort((a, b) => a.start - b.start);
  // Group notes by start time (i.e., chords).
  let groups = [];
  noteArray.forEach(n => {
    let g = groups.find(x => Math.abs(x.start - n.start) < TOLERANCE);
    if (!g) {
      g = { start: n.start, notes: [] };
      groups.push(g);
    }
    g.notes.push(n);
  });

  let allNotes = [];
  let allTies = [];
  let totalSegments = 0;

  groups.forEach(g => {
    let chord = g.notes;
    let rawDur = chord[0].duration;
    let qdur = quantize(rawDur);
    let segments = decomposeDuration(qdur);
    if (!segments) {
      alert(`Cannot represent duration=${rawDur} (quantized=${qdur}).`);
      return;
    }
    totalSegments += segments.length;
    let allRests = chord.every(n => n.type === "rest");
    let chordKeys = [];
    let chordAccs = [];
    if (!allRests) {
      chord.forEach(n => {
        if (n.type === "note") {
          let { key, accidental } = midiToKey(n.pitch);
          chordKeys.push(key);
          chordAccs.push(accidental);
        }
      });
    }
    let chordSegmentNotes = [];
    segments.forEach(seg => {
      let durCode = seg.code;
      if (allRests) {
        durCode += "r"; // e.g., "qr" for quarter rest.
      }
      let keysArray = chordKeys.length ? chordKeys : ["b/4"];
      let sNote = new VF.StaveNote({
        keys: keysArray,
        clef: clefName,
        duration: durCode
      });
      if (!allRests && chordAccs.length) {
        chordAccs.forEach((acc, i) => {
          if (acc) sNote.addAccidental(i, new VF.Accidental(acc));
        });
      }
      for (let d = 0; d < seg.dots; d++) {
        sNote.addDotToAll();
      }
      chordSegmentNotes.push(sNote);
      allNotes.push(sNote);
    });
    if (chordSegmentNotes.length > 1 && !allRests) {
      for (let i = 0; i < chordSegmentNotes.length - 1; i++) {
        let indices = chordSegmentNotes[i].keys.map((_, idx) => idx);
        let tie = new VF.StaveTie({
          first_note: chordSegmentNotes[i],
          last_note: chordSegmentNotes[i + 1],
          first_indices: indices,
          last_indices: indices
        });
        allTies.push(tie);
      }
    }
  });

  return { notes: allNotes, ties: allTies, totalSegments };
}

function splitNotesByPitch(noteArray, threshold = 60) {
  // Use the stored pitch (even for rests) to determine placement.
  let upper = [];
  let lower = [];
  noteArray.forEach(n => {
    if (n.pitch >= threshold) {
      upper.push(n);
    } else {
      lower.push(n);
    }
  });
  return { upper, lower };
}

/**
 * renderScore(scoreData, container)
 *
 * Renders the complete score (an array of parts) into the given container.
 * **Key Change:** We compute a global maximum end time across all parts so that
 * every part (and thus every staff) has the same total duration. This ensures that
 * notes occurring on the same beat in different parts are aligned vertically.
 */
export function renderScore(scoreData, container) {
  container.innerHTML = "";
  const staffHeight = 130;
  let yOffset = 20;
  let totalHeight = 60;
  let widths = [];

  // First, compute the global maximum end time among all parts.
  let globalMaxEnd = 0;
  scoreData.forEach(part => {
    part.notes.forEach(n => {
      let end = n.start + n.duration;
      if (end > globalMaxEnd) globalMaxEnd = end;
    });
  });
  // Use the same total beats for every part.
  const globalTotalBeats = Math.max(4, Math.ceil(globalMaxEnd));

  // Now, for each part, compute its width as before.
  scoreData.forEach(part => {
    let voicesNeeded = part.voicesNeeded || 1;
    let clefs = part.clefs || ["treble"];
    let noteArr = part.notes || [];
    let totalSegments = 0;
    if (voicesNeeded === 2) {
      let { upper, lower } = splitNotesByPitch(noteArr, 60);
      let resU = buildStaveNotes(upper, clefs[0] || "treble");
      let resL = buildStaveNotes(lower, clefs[1] || "bass");
      totalSegments = resU.totalSegments + resL.totalSegments;
    } else {
      let res = buildStaveNotes(noteArr, clefs[0] || "treble");
      totalSegments = res.totalSegments;
    }
    let staffWidth = Math.max(600, totalSegments * 80);
    widths.push(staffWidth);
    totalHeight += (part.voicesNeeded || 1) * staffHeight;
  });
  let maxWidth = Math.max(...widths) + 60;
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize(maxWidth, totalHeight);
  const context = renderer.getContext();

  // Render each part using the same globalTotalBeats value.
  scoreData.forEach((part, idx) => {
    let voicesNeeded = part.voicesNeeded || 1;
    let clefs = part.clefs || ["treble"];
    let noteArr = part.notes || [];
    let staffWidth = widths[idx];

    if (voicesNeeded === 2) {
      let { upper, lower } = splitNotesByPitch(noteArr, 60);
      let uRes = buildStaveNotes(upper, clefs[0] || "treble");
      let lRes = buildStaveNotes(lower, clefs[1] || "bass");

      let stave1 = new VF.Stave(20, yOffset, staffWidth);
      stave1.addClef(clefs[0] || "treble").setContext(context).draw();
      let voice1 = new VF.Voice({ num_beats: globalTotalBeats, beat_value: 4 });
      voice1.setStrict(false);
      voice1.addTickables(uRes.notes);

      let stave2 = new VF.Stave(20, yOffset + staffHeight, staffWidth);
      stave2.addClef(clefs[1] || "bass").setContext(context).draw();
      let voice2 = new VF.Voice({ num_beats: globalTotalBeats, beat_value: 4 });
      voice2.setStrict(false);
      voice2.addTickables(lRes.notes);

      let formatter = new VF.Formatter();
      formatter.joinVoices([voice1, voice2]).format([voice1, voice2], staffWidth - 50);
      voice1.draw(context, stave1);
      voice2.draw(context, stave2);

      uRes.ties.forEach(t => t.setContext(context).draw());
      lRes.ties.forEach(t => t.setContext(context).draw());

      let brace = new VF.StaveConnector(stave1, stave2).setType(VF.StaveConnector.type.BRACE);
      brace.setContext(context).draw();
      let lineLeft = new VF.StaveConnector(stave1, stave2).setType(VF.StaveConnector.type.SINGLE_LEFT);
      lineLeft.setContext(context).draw();
      let lineRight = new VF.StaveConnector(stave1, stave2).setType(VF.StaveConnector.type.SINGLE_RIGHT);
      lineRight.setContext(context).draw();

      yOffset += 2 * staffHeight;
    } else {
      let res = buildStaveNotes(noteArr, clefs[0] || "treble");
      let stave = new VF.Stave(20, yOffset, staffWidth);
      stave.addClef(clefs[0] || "treble").setContext(context).draw();
      let voice = new VF.Voice({ num_beats: globalTotalBeats, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables(res.notes);
      let formatter = new VF.Formatter();
      formatter.joinVoices([voice]).format([voice], staffWidth - 50);
      voice.draw(context, stave);
      res.ties.forEach(t => t.setContext(context).draw());
      yOffset += staffHeight;
    }
  });
}



