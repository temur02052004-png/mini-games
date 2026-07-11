// Curated 5-letter start/end pairs. Every pair is verified reachable through
// words5.js using only common words (checked with BFS). The number is par
// (shortest solution length).
const PUZZLES5 = [
  { start: "BLACK", end: "WHALE" }, // 6
  { start: "WHITE", end: "SHARK" }, // 5
  { start: "SNAKE", end: "PLANT" }, // 5
  { start: "STORM", end: "FLAME" }, // 6
  { start: "STONE", end: "DRIVE" }, // 6
  { start: "BEACH", end: "PLATE" }, // 4
  { start: "SHORE", end: "CLOCK" }, // 6
  { start: "BRAIN", end: "BREAD" }, // 7
  { start: "DREAM", end: "GREEN" }, // 5
  { start: "SHINE", end: "SMART" }, // 6
  { start: "BRAVE", end: "PHONE" }, // 6
  { start: "CHESS", end: "TRUST" }, // 4
  { start: "TRAIN", end: "CROWN" }, // 4
  { start: "TRACK", end: "SPICE" }, // 6
  { start: "GRAPE", end: "PRICE" }, // 4
  { start: "PEACH", end: "STORE" }, // 7
  { start: "PEACE", end: "SCORE" }, // 7
];

if (typeof module !== "undefined") module.exports = PUZZLES5;
