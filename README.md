# learnmath

A browser-based **GameBox** for kids: a home screen of game tiles covering
solo math practice and in-person group/party games.

## Games

### 🔢 Math Practice (solo)

Pick an operation, pick a level, and race the clock to answer 10
multiple-choice questions per round.

- **Operations**: Addition, Subtraction, and Multiplication (times tables).
- **5 levels per operation**, unlocked sequentially as you pass each one.
- Each level is **10 questions**, multiple choice, with a **countdown timer**
  per question — answer faster for a bigger score bonus.
- You start each level with **3 lives**. A wrong answer or a timeout costs a
  life; lose all 3 and it's game over for that attempt.
- Build a **streak** of 3+ correct answers in a row for a scoring bonus.
- Pass with **7/10 or more correct** to unlock the next level and earn a
  star rating (⭐ to ⭐⭐⭐) based on your score.
- Progress is saved in your browser (`localStorage`), separately for each
  operation.

### 🕵️ Imposter (group, Spyfall-style)

Everyone picks a name and emoji avatar and joins a shared lobby. Once
everyone is ready, the host starts the game:

- Everyone except one random "imposter" gets the same secret category +
  word on their phone.
- The imposter only sees "YOU ARE THE IMPOSTER!" — no category hint.
- Phones go away and the group discusses out loud, in person, trying to spot
  the imposter without giving the word away.
- When the host starts voting, everyone taps who they think the imposter is.
- The host ends voting to reveal the imposter, the word, and the vote tally.
  "Play Again" re-deals a new round to the same group.

### 🎨 Pictionary

One player at a time is the "drawer":

- The drawer taps "Give me a word!" on their phone to get a random word —
  only they can see it.
- A synced **60-second countdown** starts on everyone's screen. The drawer
  draws it on a real whiteboard/paper while everyone else guesses out loud.
- The host marks the round as "Guessed it!" or lets the timer run out, then
  reveals the word to everyone and moves to the next drawer.
- After a few rounds, "End Game" shows a recap of every word, who drew it,
  and whether it was guessed in time.

## Orchestrator (host) controls

Group games are coordinated by an **orchestrator** — typically the adult
running the session. Tap the 🎛️ icon on the GameBox home screen and enter
the PIN (default `1234`, configurable via the `ORCHESTRATOR_PIN` environment
variable) to pick a game, see who's ready, start the game, and advance each
round.

Everyone shares a single room/session — one group game runs at a time.

## Syncing progress across devices

No account needed — tap the 🔗 button to open the sync panel:

- **Get my sync code** generates a short code (e.g. `AB3D9-K7M2P`) tied to
  your current progress and saves it on the server.
- On another device, open the sync panel and enter that code under **Have a
  code from another device?**. Progress from both devices is merged (the
  higher unlocked level/score wins on each side), so you never lose progress.
- After linking, progress is automatically pushed to the server whenever you
  finish a level, and pulled/merged whenever the app loads.
- **Unlink this device** stops syncing on that device but doesn't delete the
  code's data on the server — you can re-link with the same code later.

Anyone with the code can view/update that progress, so treat it like a
shared PIN rather than a password.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

For development with auto-restart on file changes:

```bash
npm run dev
```

The server listens on port 3000 by default; set the `PORT` environment
variable to use a different port. Set `ORCHESTRATOR_PIN` to change the
orchestrator login PIN (default `1234`).

## Run with Docker

Build the image:

```bash
docker build -t learnmath .
```

Run the container:

```bash
docker run -p 3000:3000 -v $(pwd)/data:/app/data learnmath
```

Then open http://localhost:3000 in your browser.

The `-v $(pwd)/data:/app/data` mount persists sync codes (used for
cross-device progress sync) on the host so they survive container
restarts/recreation. Without it, sync codes are lost when the container is
removed.

To use a different port:

```bash
docker run -p 8080:8080 -e PORT=8080 -v $(pwd)/data:/app/data learnmath
```

To set a custom orchestrator PIN (default `1234`):

```bash
docker run -p 3000:3000 -e ORCHESTRATOR_PIN=1234 -v $(pwd)/data:/app/data learnmath
```
