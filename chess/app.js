// ---------- Chess engine + UI (local two-player) ----------
const GLYPH = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

const START = [
  ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
  ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
  ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
];

const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const messageEl = document.getElementById("message");
const capTopEl = document.getElementById("capturedTop");
const capBotEl = document.getElementById("capturedBottom");
const promoEl = document.getElementById("promo");
const promoChoicesEl = document.getElementById("promoChoices");
const celebration = document.getElementById("celebration");
const celebrationText = document.getElementById("celebrationText");
const celebrationEmoji = document.getElementById("celebrationEmoji");

let board, turn, castling, ep, selected, legalCache, lastMove, flipped, captured, gameOver;

function newGame() {
  board = START.map((row) => row.slice());
  turn = "w";
  castling = { wK: true, wQ: true, bK: true, bQ: true };
  ep = null;              // en-passant target square [r,c] or null
  selected = null;
  legalCache = [];
  lastMove = null;
  flipped = false;
  captured = { w: [], b: [] }; // pieces captured BY white / BY black
  gameOver = false;
  messageEl.textContent = "";
  legalCache = legalMoves("w");
  render();
}

const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const colorOf = (p) => (p ? p[0] : null);
const typeOf = (p) => (p ? p[1] : null);
const enemy = (color) => (color === "w" ? "b" : "w");

const DIRS = {
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  q: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
  n: [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
  k: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};

// Is square (r,c) attacked by `byColor` on the given board?
function isAttacked(brd, r, c, byColor) {
  // pawns
  const pd = byColor === "w" ? 1 : -1; // white pawns sit below and attack upward (row-1); a white pawn at r+1 attacks r
  for (const dc of [-1, 1]) {
    const pr = r + pd, pc = c + dc;
    if (inB(pr, pc) && brd[pr][pc] === byColor + "p") return true;
  }
  // knights
  for (const [dr, dc] of DIRS.n) {
    const nr = r + dr, nc = c + dc;
    if (inB(nr, nc) && brd[nr][nc] === byColor + "n") return true;
  }
  // king
  for (const [dr, dc] of DIRS.k) {
    const kr = r + dr, kc = c + dc;
    if (inB(kr, kc) && brd[kr][kc] === byColor + "k") return true;
  }
  // sliding: rook/queen orthogonal, bishop/queen diagonal
  for (const [dr, dc] of DIRS.r) {
    let nr = r + dr, nc = c + dc;
    while (inB(nr, nc)) {
      const p = brd[nr][nc];
      if (p) { if (colorOf(p) === byColor && (typeOf(p) === "r" || typeOf(p) === "q")) return true; break; }
      nr += dr; nc += dc;
    }
  }
  for (const [dr, dc] of DIRS.b) {
    let nr = r + dr, nc = c + dc;
    while (inB(nr, nc)) {
      const p = brd[nr][nc];
      if (p) { if (colorOf(p) === byColor && (typeOf(p) === "b" || typeOf(p) === "q")) return true; break; }
      nr += dr; nc += dc;
    }
  }
  return false;
}

function findKing(brd, color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (brd[r][c] === color + "k") return [r, c];
  return null;
}

function inCheck(brd, color) {
  const k = findKing(brd, color);
  return k ? isAttacked(brd, k[0], k[1], enemy(color)) : false;
}

// Pseudo-legal moves for the piece at (r,c). Returns move objects.
function pseudoMoves(brd, r, c, castleRights, epSq) {
  const p = brd[r][c];
  if (!p) return [];
  const color = colorOf(p), type = typeOf(p);
  const moves = [];
  const add = (tr, tc, extra = {}) => moves.push({ from: [r, c], to: [tr, tc], ...extra });

  if (type === "p") {
    const fwd = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const promoRow = color === "w" ? 0 : 7;
    // forward one
    if (inB(r + fwd, c) && !brd[r + fwd][c]) {
      add(r + fwd, c, { promo: r + fwd === promoRow });
      // forward two
      if (r === startRow && !brd[r + 2 * fwd][c]) add(r + 2 * fwd, c, { double: true });
    }
    // captures
    for (const dc of [-1, 1]) {
      const tr = r + fwd, tc = c + dc;
      if (!inB(tr, tc)) continue;
      const target = brd[tr][tc];
      if (target && colorOf(target) === enemy(color)) {
        add(tr, tc, { capture: true, promo: tr === promoRow });
      } else if (epSq && epSq[0] === tr && epSq[1] === tc) {
        add(tr, tc, { capture: true, enpassant: true });
      }
    }
  } else if (type === "n" || type === "k") {
    for (const [dr, dc] of DIRS[type]) {
      const tr = r + dr, tc = c + dc;
      if (!inB(tr, tc)) continue;
      const target = brd[tr][tc];
      if (!target || colorOf(target) === enemy(color)) add(tr, tc, { capture: !!target });
    }
    if (type === "k") addCastles(brd, r, c, color, castleRights, moves);
  } else {
    for (const [dr, dc] of DIRS[type]) {
      let tr = r + dr, tc = c + dc;
      while (inB(tr, tc)) {
        const target = brd[tr][tc];
        if (!target) add(tr, tc, {});
        else { if (colorOf(target) === enemy(color)) add(tr, tc, { capture: true }); break; }
        tr += dr; tc += dc;
      }
    }
  }
  return moves;
}

function addCastles(brd, r, c, color, rights, moves) {
  const back = color === "w" ? 7 : 0;
  if (r !== back || c !== 4) return;
  if (inCheck(brd, color)) return;
  const opp = enemy(color);
  const kSide = color === "w" ? rights.wK : rights.bK;
  const qSide = color === "w" ? rights.wQ : rights.bQ;
  // king side: squares f,g empty; e,f,g not attacked; rook on h
  if (kSide && !brd[back][5] && !brd[back][6] && brd[back][7] === color + "r" &&
      !isAttacked(brd, back, 5, opp) && !isAttacked(brd, back, 6, opp)) {
    moves.push({ from: [r, c], to: [back, 6], castle: "K", rookFrom: [back, 7], rookTo: [back, 5] });
  }
  // queen side: b,c,d empty; e,d,c not attacked; rook on a
  if (qSide && !brd[back][1] && !brd[back][2] && !brd[back][3] && brd[back][0] === color + "r" &&
      !isAttacked(brd, back, 3, opp) && !isAttacked(brd, back, 2, opp)) {
    moves.push({ from: [r, c], to: [back, 2], castle: "Q", rookFrom: [back, 0], rookTo: [back, 3] });
  }
}

// Apply a move to a board copy (promo defaults to queen). Returns the new board.
function applyToBoard(brd, move, promoType = "q") {
  const b = brd.map((row) => row.slice());
  const [fr, fc] = move.from, [tr, tc] = move.to;
  const p = b[fr][fc];
  const color = colorOf(p);
  b[fr][fc] = null;
  if (move.enpassant) b[fr][tc] = null; // captured pawn sits on the from-row, to-col
  if (move.promo) b[tr][tc] = color + promoType;
  else b[tr][tc] = p;
  if (move.castle) {
    const [rfr, rfc] = move.rookFrom, [rtr, rtc] = move.rookTo;
    b[rtr][rtc] = b[rfr][rfc];
    b[rfr][rfc] = null;
  }
  return b;
}

// Fully legal moves for a color (filters out self-check).
function legalMoves(color) {
  const out = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (colorOf(board[r][c]) === color) {
        for (const m of pseudoMoves(board, r, c, castling, ep)) {
          const after = applyToBoard(board, m);
          if (!inCheck(after, color)) out.push(m);
        }
      }
  return out;
}

function legalFrom(r, c) {
  return legalCache.filter((m) => m.from[0] === r && m.from[1] === c);
}

// ---------- UI ----------
function render() {
  boardEl.innerHTML = "";
  const rows = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  const cols = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  const checkColor = inCheck(board, turn) ? turn : null;
  const kingSq = checkColor ? findKing(board, checkColor) : null;

  const selMoves = selected ? legalFrom(selected[0], selected[1]) : [];
  const targets = new Map(selMoves.map((m) => [m.to[0] * 8 + m.to[1], m]));

  for (const r of rows) {
    for (const c of cols) {
      const sq = document.createElement("div");
      sq.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
      if (selected && selected[0] === r && selected[1] === c) sq.classList.add("selected");
      if (lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c)))
        sq.classList.add("lastmove");
      if (kingSq && kingSq[0] === r && kingSq[1] === c) sq.classList.add("incheck");
      if (targets.has(r * 8 + c)) sq.classList.add(board[r][c] || targets.get(r * 8 + c).enpassant ? "capture-ring" : "move-dot");

      const p = board[r][c];
      if (p) {
        const pe = document.createElement("div");
        pe.className = "piece " + colorOf(p);
        pe.textContent = GLYPH[p];
        sq.appendChild(pe);
      }
      sq.addEventListener("click", () => onClick(r, c));
      boardEl.appendChild(sq);
    }
  }

  turnEl.textContent = (turn === "w" ? "White" : "Black") + " to move" + (checkColor ? " — check!" : "");
  turnEl.classList.toggle("check", !!checkColor);
  capTopEl.innerHTML = captured.b.map((p) => GLYPH[p]).join("");  // pieces black captured (white pieces)
  capBotEl.innerHTML = captured.w.map((p) => GLYPH[p]).join("");
}

function onClick(r, c) {
  if (gameOver) return;
  const p = board[r][c];

  if (selected) {
    const move = legalFrom(selected[0], selected[1]).find((m) => m.to[0] === r && m.to[1] === c);
    if (move) { doMove(move); return; }
  }
  if (colorOf(p) === turn) {
    selected = [r, c];
    render();
  } else {
    selected = null;
    render();
  }
}

function doMove(move) {
  const mover = board[move.from[0]][move.from[1]];
  const color = colorOf(mover);

  const finish = (promoType) => {
    // record capture
    let capturedPiece = board[move.to[0]][move.to[1]];
    if (move.enpassant) capturedPiece = board[move.from[0]][move.to[1]];
    if (capturedPiece) captured[color].push(capturedPiece);

    board = applyToBoard(board, move, promoType);

    // update castling rights
    if (mover === "wk") { castling.wK = castling.wQ = false; }
    if (mover === "bk") { castling.bK = castling.bQ = false; }
    if (move.from[0] === 7 && move.from[1] === 0) castling.wQ = false;
    if (move.from[0] === 7 && move.from[1] === 7) castling.wK = false;
    if (move.from[0] === 0 && move.from[1] === 0) castling.bQ = false;
    if (move.from[0] === 0 && move.from[1] === 7) castling.bK = false;
    // rook captured on its home square removes rights too
    if (move.to[0] === 7 && move.to[1] === 0) castling.wQ = false;
    if (move.to[0] === 7 && move.to[1] === 7) castling.wK = false;
    if (move.to[0] === 0 && move.to[1] === 0) castling.bQ = false;
    if (move.to[0] === 0 && move.to[1] === 7) castling.bK = false;

    // en-passant target
    ep = move.double ? [(move.from[0] + move.to[0]) / 2, move.from[1]] : null;

    lastMove = move;
    selected = null;
    turn = enemy(turn);
    legalCache = legalMoves(turn);
    render();
    checkEnd();
  };

  if (move.promo) {
    showPromo(color, finish);
  } else {
    finish("q");
  }
}

function showPromo(color, cb) {
  promoChoicesEl.innerHTML = "";
  for (const t of ["q", "r", "b", "n"]) {
    const btn = document.createElement("button");
    btn.className = "piece " + color;
    btn.textContent = GLYPH[color + t];
    btn.addEventListener("click", () => { promoEl.classList.remove("show"); cb(t); }, { once: true });
    promoChoicesEl.appendChild(btn);
  }
  promoEl.classList.add("show");
}

function checkEnd() {
  if (legalCache.length === 0) {
    gameOver = true;
    if (inCheck(board, turn)) {
      const winner = turn === "w" ? "Black" : "White";
      celebrationEmoji.textContent = turn === "w" ? "♚" : "♔";
      celebrationText.textContent = `Checkmate — ${winner} wins!`;
    } else {
      celebrationEmoji.textContent = "🤝";
      celebrationText.textContent = "Stalemate — it's a draw.";
    }
    celebration.classList.add("show");
  }
}

document.getElementById("resetBtn").addEventListener("click", newGame);
document.getElementById("flipBtn").addEventListener("click", () => { flipped = !flipped; render(); });
document.getElementById("celebrationClose").addEventListener("click", () => {
  celebration.classList.remove("show");
  newGame();
});

newGame();
