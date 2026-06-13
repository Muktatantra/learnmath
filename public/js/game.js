import { LEVELS, QUESTIONS_PER_LEVEL, STARTING_LIVES, PASS_THRESHOLD, starsForScore } from './levels.js';
import { generateQuestion, generateChoices } from './question-generator.js';

export function createSession(operation, levelIndex) {
  const config = LEVELS[operation][levelIndex];
  const questions = Array.from({ length: QUESTIONS_PER_LEVEL }, () => {
    const q = generateQuestion(operation, config);
    return { ...q, choices: generateChoices(q.answer) };
  });
  return {
    operation,
    levelIndex,
    config,
    questions,
    currentIndex: 0,
    score: 0,
    lives: STARTING_LIVES,
    streak: 0,
    correctCount: 0,
  };
}

export function submitAnswer(session, chosenValue, remainingFraction) {
  const q = session.questions[session.currentIndex];
  const isCorrect = chosenValue === q.answer;
  if (isCorrect) {
    session.correctCount++;
    session.streak++;
    let points = 10 + Math.round(5 * remainingFraction);
    if (session.streak >= 3) points += 5;
    session.score += points;
  } else {
    session.streak = 0;
    session.lives--;
  }
  return { isCorrect, correctAnswer: q.answer };
}

export function isSessionOver(session) {
  return session.lives <= 0 || session.currentIndex >= QUESTIONS_PER_LEVEL;
}

export function getResult(session) {
  const passed = session.correctCount >= PASS_THRESHOLD;
  const stars = starsForScore(session.score);
  return {
    passed,
    stars,
    score: session.score,
    correctCount: session.correctCount,
    lives: session.lives,
  };
}

/**
 * Starts a countdown timer for the current question.
 * onTick(remainingSeconds, remainingFraction) is called every 100ms.
 * onExpire() is called once the timer reaches zero.
 * Returns a cancel function to stop the timer early.
 */
export function startQuestionTimer(timeLimitSeconds, onTick, onExpire) {
  const start = Date.now();
  const totalMs = timeLimitSeconds * 1000;

  const intervalId = setInterval(() => {
    const elapsed = Date.now() - start;
    const remainingMs = Math.max(0, totalMs - elapsed);
    onTick(remainingMs / 1000, remainingMs / totalMs);
    if (remainingMs <= 0) {
      clearInterval(intervalId);
      onExpire();
    }
  }, 100);

  return () => clearInterval(intervalId);
}
