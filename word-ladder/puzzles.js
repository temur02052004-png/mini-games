// Curated start/end pairs — every pair is verified reachable via one-letter
// steps through words.js (see the BFS check used while building this list).
const PUZZLES = [
  { start: "COLD", end: "WARM" },
  { start: "HEAD", end: "TAIL" },
  { start: "LEAD", end: "GOLD" },
  { start: "FISH", end: "BIRD" },
  { start: "RICH", end: "POOR" },
  { start: "HARD", end: "EASY" },
  { start: "SLOW", end: "FAST" },
  { start: "LOVE", end: "HATE" },
  { start: "SALT", end: "SOUR" },
  { start: "FIRE", end: "COOL" },
  { start: "MOON", end: "STAR" },
  { start: "WEST", end: "EAST" },
  { start: "SHIP", end: "BOAT" },
  { start: "KING", end: "LORD" },
  { start: "WIND", end: "CALM" },
  { start: "SEED", end: "TREE" },
];

if (typeof module !== "undefined") module.exports = PUZZLES;
