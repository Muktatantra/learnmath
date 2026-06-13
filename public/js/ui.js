import { LEVELS, OPERATION_LABELS, QUESTIONS_PER_LEVEL, STARTING_LIVES, starsForScore } from './levels.js';

const screens = {};
let elements = {};

export function init() {
  document.querySelectorAll('.screen').forEach((el) => {
    screens[el.dataset.screen] = el;
  });

  elements = {
    levelSelectTitle: document.querySelector('.level-select-title'),
    levelGrid: document.querySelector('.level-grid'),
    lives: document.querySelector('.lives'),
    progress: document.querySelector('.progress'),
    score: document.querySelector('.score'),
    streak: document.querySelector('.streak'),
    timerFill: document.querySelector('.timer-fill'),
    timerLabel: document.querySelector('.timer-label'),
    question: document.querySelector('.question'),
    choices: document.querySelector('.choices'),
    feedback: document.querySelector('.feedback'),
    resultsStars: document.querySelector('.results-stars'),
    resultsSummary: document.querySelector('.results-summary'),
    resultsActions: document.querySelector('.results-actions'),
  };
}

export function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}

export function renderLevelSelect(operation, opProgress) {
  const label = OPERATION_LABELS[operation];
  elements.levelSelectTitle.textContent = `${label.name} (${label.symbol})`;
  elements.levelGrid.innerHTML = '';

  LEVELS[operation].forEach((config, index) => {
    const levelNum = index + 1;
    const unlocked = levelNum <= opProgress.unlockedLevel;
    const bestScore = opProgress.bestScores[levelNum] || 0;
    const stars = starsForScore(bestScore);

    const card = document.createElement('button');
    card.className = 'level-card' + (unlocked ? '' : ' level-card--locked');
    card.dataset.levelIndex = String(index);
    card.disabled = !unlocked;

    const number = document.createElement('div');
    number.className = 'level-card-number';
    number.textContent = `Level ${levelNum}`;
    card.appendChild(number);

    if (unlocked) {
      const starsEl = document.createElement('div');
      starsEl.className = 'level-card-stars';
      starsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      card.appendChild(starsEl);
    } else {
      const lock = document.createElement('div');
      lock.className = 'level-card-lock';
      lock.textContent = '🔒';
      card.appendChild(lock);
    }

    elements.levelGrid.appendChild(card);
  });
}

export function renderGameHeader(session) {
  elements.lives.textContent = '❤️'.repeat(session.lives) + '🤍'.repeat(STARTING_LIVES - session.lives);
  elements.progress.textContent = `Question ${Math.min(session.currentIndex + 1, QUESTIONS_PER_LEVEL)}/${QUESTIONS_PER_LEVEL}`;
  elements.score.textContent = `Score: ${session.score}`;
  elements.streak.textContent = session.streak >= 2 ? `🔥 Streak: ${session.streak}` : '';
}

export function renderQuestion(question) {
  elements.question.textContent = `${question.text} = ?`;
  elements.feedback.textContent = '';
  elements.feedback.className = 'feedback';
  elements.choices.innerHTML = '';

  question.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = String(choice);
    btn.dataset.value = String(choice);
    elements.choices.appendChild(btn);
  });
}

export function updateTimer(remainingSeconds, remainingFraction) {
  const pct = Math.max(0, Math.min(100, remainingFraction * 100));
  elements.timerFill.style.width = `${pct}%`;
  elements.timerFill.classList.remove('timer-fill--green', 'timer-fill--yellow', 'timer-fill--red');
  if (remainingFraction > 0.5) {
    elements.timerFill.classList.add('timer-fill--green');
  } else if (remainingFraction > 0.2) {
    elements.timerFill.classList.add('timer-fill--yellow');
  } else {
    elements.timerFill.classList.add('timer-fill--red');
  }
  elements.timerLabel.textContent = `${Math.ceil(remainingSeconds)}s`;
}

export function showFeedback(isCorrect, correctAnswer, chosenValue) {
  const buttons = elements.choices.querySelectorAll('.choice-btn');
  buttons.forEach((btn) => {
    btn.disabled = true;
    const value = Number(btn.dataset.value);
    if (value === correctAnswer) {
      btn.classList.add('choice-btn--correct');
    } else if (value === chosenValue) {
      btn.classList.add('choice-btn--incorrect');
    }
  });

  elements.feedback.textContent = isCorrect ? 'Correct! 🎉' : `Oops! The answer was ${correctAnswer}`;
  elements.feedback.className = 'feedback ' + (isCorrect ? 'feedback--correct' : 'feedback--incorrect');
}

export function renderResults(result, operation, levelIndex) {
  const levelNum = levelIndex + 1;
  const maxLevel = LEVELS[operation].length;

  elements.resultsStars.textContent = '⭐'.repeat(result.stars) + '☆'.repeat(3 - result.stars);

  const lines = [
    `${OPERATION_LABELS[operation].name} - Level ${levelNum}`,
    `Score: ${result.score}`,
    `Correct: ${result.correctCount}/${QUESTIONS_PER_LEVEL}`,
    result.passed ? 'Level Passed! 🎉' : 'Try Again!',
  ];
  elements.resultsSummary.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');

  elements.resultsActions.innerHTML = '';
  if (result.passed && levelNum < maxLevel) {
    addActionButton('Next Level ▶', 'next-level', 'btn-primary');
  }
  addActionButton('Retry', 'retry', 'btn-secondary');
  addActionButton('Back to Levels', 'back-to-levels', 'btn-secondary');
}

function addActionButton(label, action, className) {
  const btn = document.createElement('button');
  btn.className = `btn ${className}`;
  btn.dataset.action = action;
  btn.textContent = label;
  elements.resultsActions.appendChild(btn);
}
