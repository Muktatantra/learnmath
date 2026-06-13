# learnmath

A browser-based math practice game for kids (and anyone else brushing up on
the basics). Pick an operation, pick a level, and race the clock to answer
10 multiple-choice questions per round.

## Gameplay

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
variable to use a different port.

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
