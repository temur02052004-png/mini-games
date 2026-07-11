# Mini Games & Tools

A small static site with two browser games/tools — no build step, no dependencies.

- **Word Ladder** (`word-ladder/`) — change one letter at a time to reach the target word. Daily puzzle + practice mode, hints, and streak tracking.
- **Focus Sprint** (`focus-sprint/`) — a Pomodoro focus timer with a task list and daily streak.

Everything is plain HTML/CSS/JS and stores progress in the browser's `localStorage`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8080
```

then visit http://localhost:8080.

## Hosted

Deployed as a static site via GitHub Pages.
