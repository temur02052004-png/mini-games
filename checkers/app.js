const SIZE = 8;
const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const celebration = document.getElementById("celebration");
const celebrationText = document.getElementById("celebrationText");

let board, turn, selected, mustContinue;

function isDark(r, c) { return (r + c) % 2 === 1; }

function newGame() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isDark(r, c)) continue;
      if (r < 3) board[r][c] = { color: "black", king: false };
      else if (r > 4) board[r][c] = { color: "red", king: false };
    }
  }
  turn = "red";
  selected = null;
  mustContinue = null;
  messageEl.textContent = "";
  render();
}

function inBounds(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }

function directions(piece) {
  if (piece.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.color === "red" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

// moves for a single piece. If capturesOnly, only return jumps.
function pieceMoves(r, c, capturesOnly) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  for (const [dr, dc] of directions(piece)) {
    const sr = r + dr, sc = c + dc;      // step
    const jr = r + 2 * dr, jc = c + 2 * dc; // jump landing
    if (inBounds(jr, jc) && board[jr][jc] === null &&
        inBounds(sr, sc) && board[sr][sc] && board[sr][sc].color !== piece.color) {
      moves.push({ to: [jr, jc], captured: [sr, sc] });
    } else if (!capturesOnly && inBounds(sr, sc) && board[sr][sc] === null) {
      moves.push({ to: [sr, sc], captured: null });
    }
  }
  return moves;
}

function allCaptureSquares(color) {
  const squares = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] && board[r][c].color === color &&
          pieceMoves(r, c, true).length > 0)
        squares.push([r, c]);
  return squares;
}

function legalMovesFor(r, c) {
  // If a multi-jump is in progress, only that piece may move, captures only.
  if (mustContinue) {
    if (mustContinue[0] === r && mustContinue[1] === c) return pieceMoves(r, c, true);
    return [];
  }
  const captureSquares = allCaptureSquares(turn);
  if (captureSquares.length > 0) {
    // mandatory capture: only capturing pieces, capture moves only
    if (captureSquares.some(([cr, cc]) => cr === r && cc === c)) return pieceMoves(r, c, true);
    return [];
  }
  return pieceMoves(r, c, false);
}

function countPieces() {
  let red = 0, black = 0;
  for (const row of board) for (const p of row) {
    if (p && p.color === "red") red++;
    if (p && p.color === "black") black++;
  }
  return { red, black };
}

function hasAnyMove(color) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] && board[r][c].color === color) {
        const caps = allCaptureSquares(color);
        const moves = caps.length > 0 ? pieceMoves(r, c, true) : pieceMoves(r, c, false);
        if (moves.length > 0) return true;
      }
  return false;
}

function render() {
  boardEl.innerHTML = "";
  const legal = selected ? legalMovesFor(selected[0], selected[1]) : [];
  const targets = new Set(legal.map((m) => m.to[0] * SIZE + m.to[1]));

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const sq = document.createElement("div");
      sq.className = "square " + (isDark(r, c) ? "dark" : "light");
      if (isDark(r, c)) sq.classList.add("playable");
      if (selected && selected[0] === r && selected[1] === c) sq.classList.add("selected");
      if (targets.has(r * SIZE + c)) sq.classList.add("target");

      const piece = board[r][c];
      if (piece) {
        const pe = document.createElement("div");
        pe.className = "piece " + piece.color;
        if (piece.king) pe.innerHTML = '<span class="crown">♚</span>';
        sq.appendChild(pe);
      }
      sq.addEventListener("click", () => onSquareClick(r, c));
      boardEl.appendChild(sq);
    }
  }

  const { red, black } = countPieces();
  scoreEl.textContent = `Red ${red} · Black ${black}`;
  turnEl.textContent = turn === "red" ? "Red to move" : "Black to move";
}

function onSquareClick(r, c) {
  const piece = board[r][c];

  // clicking a legal target for the currently selected piece
  if (selected) {
    const legal = legalMovesFor(selected[0], selected[1]);
    const move = legal.find((m) => m.to[0] === r && m.to[1] === c);
    if (move) { applyMove(selected[0], selected[1], move); return; }
  }

  // otherwise, try to select one of your own pieces (that can move)
  if (piece && piece.color === turn && !mustContinue) {
    if (legalMovesFor(r, c).length > 0) {
      selected = [r, c];
      messageEl.textContent = "";
    } else {
      selected = null;
      const caps = allCaptureSquares(turn);
      messageEl.textContent = caps.length > 0 ? "You must make a capture this turn." : "That piece has no move.";
    }
    render();
  }
}

function applyMove(r, c, move) {
  const piece = board[r][c];
  board[r][c] = null;
  const [tr, tc] = move.to;
  board[tr][tc] = piece;
  if (move.captured) board[move.captured[0]][move.captured[1]] = null;

  // promotion
  let promoted = false;
  if (!piece.king && ((piece.color === "red" && tr === 0) || (piece.color === "black" && tr === SIZE - 1))) {
    piece.king = true;
    promoted = true;
  }

  // multi-jump: continue if this was a capture, more captures exist, and no promotion just happened
  if (move.captured && !promoted && pieceMoves(tr, tc, true).length > 0) {
    selected = [tr, tc];
    mustContinue = [tr, tc];
    messageEl.textContent = "Keep jumping!";
    render();
    return;
  }

  // end of turn
  selected = null;
  mustContinue = null;
  turn = turn === "red" ? "black" : "red";
  messageEl.textContent = "";
  render();
  checkGameOver();
}

function checkGameOver() {
  const { red, black } = countPieces();
  let winner = null;
  if (red === 0) winner = "Black";
  else if (black === 0) winner = "Red";
  else if (!hasAnyMove(turn)) winner = turn === "red" ? "Black" : "Red";
  if (winner) {
    celebrationText.textContent = `${winner} wins!`;
    celebration.classList.add("show");
  }
}

document.getElementById("resetBtn").addEventListener("click", newGame);
document.getElementById("celebrationClose").addEventListener("click", () => {
  celebration.classList.remove("show");
  newGame();
});

newGame();
