# Generative Music Score Viewer with a DSL

This repository provides a ready-made component for displaying musical scores in the browser using VexFlow. It is designed for non-coder students interested in generative music.

## DSL Overview

You have two functions to create parts:

- **`addSinglePart(events)`**  
  Creates a single-staff (melodic) part using a "treble" clef.

- **`addDoublePart(events)`**  
  Creates a double-staff (piano) part. At render time, notes (and rests) are split by pitch so that higher pitches go to the upper (treble) staff and lower pitches go to the lower (bass) staff.

### Event Objects

Each **event** is an object with five properties (all are arrays of possible values from which the DSL picks at random):

1. **start**: Possible start times, in beats.
2. **type**: Possible event types—`["notes"]` for pitched or `["rests"]` for rests.
3. **notes**: For pitched events, possible note names (e.g. `"C4"`, `"E4"`).
   - For rests, you can also provide note names (e.g. `"F2"`, `"C5"`) so that the DSL uses that pitch to place the rest on an appropriate staff in a double-part scenario.
4. **durations**: Possible durations (in beats).
5. **loudness**: Possible velocity (e.g., `[60, 75, 90]`). For rests, the velocity doesn’t affect the symbol, but is stored anyway.

**Example**:

```js
addSinglePart([
  {
    start: [0.0, 0.5],
    type: ["notes"],
    notes: ["C4", "E4", "G4"],
    durations: [0.5, 1.0],
    loudness: [60, 75, 90],
  },
  {
    start: [1.0, 1.5],
    type: ["rests"],
    notes: ["F2", "C5"], // determines staff placement for the rest
    durations: [1.0],
    loudness: [0],
  },
]);
```
