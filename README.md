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
docker run -p 3000:3000 learnmath
```

Then open http://localhost:3000 in your browser.

To use a different port:

```bash
docker run -p 8080:8080 -e PORT=8080 learnmath
```
