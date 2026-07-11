// Curated start/end pairs — every pair is verified reachable via one-letter
// steps through words.js (checked with BFS while building this list). The
// number in the comment is the shortest possible solution length (par).
const PUZZLES = [
  { start: "COLD", end: "WARM" }, // 4
  { start: "HEAD", end: "TAIL" }, // 5
  { start: "LEAD", end: "GOLD" }, // 3
  { start: "FISH", end: "BIRD" }, // 6
  { start: "RICH", end: "POOR" }, // 8
  { start: "HARD", end: "EASY" }, // 5
  { start: "SLOW", end: "FAST" }, // 7
  { start: "LOVE", end: "HATE" }, // 4
  { start: "SALT", end: "SOUR" }, // 7
  { start: "FIRE", end: "COOL" }, // 5
  { start: "MOON", end: "STAR" }, // 6
  { start: "WEST", end: "EAST" }, // 3
  { start: "SHIP", end: "BOAT" }, // 6
  { start: "KING", end: "LORD" }, // 5
  { start: "WIND", end: "CALM" }, // 5
  { start: "SEED", end: "TREE" }, // 5
  { start: "WORK", end: "PLAY" }, // 8
  { start: "GIVE", end: "TAKE" }, // 4
  { start: "HEAT", end: "COLD" }, // 4
  { start: "BOOK", end: "WORD" }, // 4
  { start: "LAKE", end: "POND" }, // 5
  { start: "HAND", end: "FOOT" }, // 5
  { start: "CORN", end: "BEAN" }, // 5
  { start: "LOUD", end: "SOFT" }, // 5
  { start: "SAND", end: "DUST" }, // 6
  { start: "COAT", end: "SUIT" }, // 6
  { start: "DUCK", end: "SWAN" }, // 6
  { start: "HOPE", end: "FEAR" }, // 6
  { start: "TIDE", end: "WAVE" }, // 3
  { start: "CARD", end: "GAME" }, // 3
];

if (typeof module !== "undefined") module.exports = PUZZLES;
