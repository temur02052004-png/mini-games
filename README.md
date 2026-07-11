# Mini Games & Tools

A small static site of browser games — no build step, no dependencies.

### 📚 Learning English
- **Word Ladder** (`word-ladder/`) — change one letter at a time to reach the target word. Daily puzzle + practice mode, 4- and 5-letter modes, hints, undo, shareable results, and stats.
- **Word Bloom** (`word-bloom/`) — build as many words as you can from seven letters against the clock, and find the hidden 7-letter "bloom".
- **Homophone Hero** (`homophone-hero/`) — pick the right word (there/their/they're, your/you're, its/it's…) against a timer, with combos, hearts, and teaching tips.
- **Sentence Scramble** (`sentence-scramble/`) — drag shuffled words back into a grammatical sentence, from warm-ups to trickier clauses.
- **Idiom Match** (`idiom-match/`) — a flip-and-match memory game pairing idioms with their meanings, with an example sentence on every match.
- **Listening Lab** (`listening-lab/`) — hear a word or sentence spoken aloud (Web Speech API) and type what you hear; dictation practice with replay and slow modes.

### 🧠 Mind Games
- **Chess** (`chess/`) — full two-player chess with every rule enforced (check, castling, en passant, promotion, checkmate/stalemate).
- **Checkers** (`checkers/`) — two-player draughts with mandatory captures, multi-jumps, and king promotion.

### 🎨 Creative
- **Generative Doodle Pad** (`doodle/`) — draw and watch strokes bloom into kaleidoscope art with symmetry mirroring, color-shifting brushes, and glowing particle trails.
- **Loop Bloom** (`loop-bloom/`) — a pentatonic tap-grid music sequencer (Web Audio API) with tempo/sound controls, a random generator, and shareable loops encoded in the URL.
- **Mesh** (`mesh/`) — a mesh-gradient wallpaper generator with draggable colour points, palette randomizer, grain, and PNG export at several resolutions.
- **Star Map** (`star-map/`) — tap the sky to place stars that auto-link into a constellation; name it and export a shareable star chart.

Everything is plain HTML/CSS/JS and stores progress in the browser's `localStorage`. The landing page has a **feedback** link that opens a pre-addressed email.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8080
```

then visit http://localhost:8080.

## Hosted

Deployed as a static site via GitHub Pages.
