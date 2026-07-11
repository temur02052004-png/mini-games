# Mini Games & Tools

A small static site of browser games — no build step, no dependencies.

- **Word Ladder** (`word-ladder/`) — change one letter at a time to reach the target word. Daily puzzle + practice mode, hints, undo, shareable results, and stats.
- **Chess** (`chess/`) — full two-player chess with every rule enforced (check, castling, en passant, promotion, checkmate/stalemate).
- **Checkers** (`checkers/`) — two-player draughts with mandatory captures, multi-jumps, and king promotion.

Everything is plain HTML/CSS/JS and stores progress in the browser's `localStorage`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8080
```

then visit http://localhost:8080.

## Hosted

Deployed as a static site via GitHub Pages.
