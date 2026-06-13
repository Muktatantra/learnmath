import { createSession, submitAnswer, isSessionOver, getResult, startQuestionTimer } from './game.js';
import { getProgress, recordLevelResult } from './storage.js';
import * as ui from './ui.js';

const state = {
  operation: null,
  difficulty: null,
  levelIndex: null,
  session: null,
  cancelTimer: null,
  lastRemainingFraction: 1,
  awaitingAdvance: false,
};

function showDifficultySelect(operation) {
  const progress = getProgress();
  ui.renderDifficultySelect(operation, progress[operation]);
  ui.showScreen('difficulty-select');
}

function showLevelSelect(operation, difficulty) {
  const progress = getProgress();
  ui.renderLevelSelect(operation, difficulty, progress[operation]);
  ui.showScreen('level-select');
}

function startLevel(operation, difficulty, levelIndex) {
  state.operation = operation;
  state.difficulty = difficulty;
  state.levelIndex = levelIndex;
  state.session = createSession(operation, difficulty, levelIndex);
  state.awaitingAdvance = false;
  ui.showScreen('game');
  showQuestion();
}

function showQuestion() {
  const session = state.session;
  const question = session.questions[session.currentIndex];

  state.lastRemainingFraction = 1;
  ui.renderGameHeader(session);
  ui.renderQuestion(question);
  ui.updateTimer(session.config.timeLimit, 1);

  state.cancelTimer = startQuestionTimer(
    session.config.timeLimit,
    (remainingSeconds, remainingFraction) => {
      state.lastRemainingFraction = remainingFraction;
      ui.updateTimer(remainingSeconds, remainingFraction);
    },
    () => handleAnswer(null)
  );
}

function handleAnswer(chosenValue) {
  if (state.awaitingAdvance) return;
  state.awaitingAdvance = true;

  if (state.cancelTimer) {
    state.cancelTimer();
    state.cancelTimer = null;
  }

  const session = state.session;
  const remainingFraction = chosenValue === null ? 0 : state.lastRemainingFraction;
  const { isCorrect, correctAnswer } = submitAnswer(session, chosenValue, remainingFraction);

  ui.showFeedback(isCorrect, correctAnswer, chosenValue);
  ui.renderGameHeader(session);

  const delay = isCorrect ? 1000 : 1200;
  setTimeout(() => {
    session.currentIndex++;
    state.awaitingAdvance = false;
    if (isSessionOver(session)) {
      finishSession();
    } else {
      showQuestion();
    }
  }, delay);
}

function finishSession() {
  const session = state.session;
  const result = getResult(session);
  recordLevelResult(session.operation, session.difficulty, session.levelIndex, result);
  ui.renderResults(result, session.operation, session.difficulty, session.levelIndex);
  ui.showScreen('results');
}

function handleClick(event) {
  const target = event.target.closest(
    '[data-action], [data-operation], [data-difficulty], [data-level-index], [data-value]'
  );
  if (!target || target.disabled) return;

  const { action, operation, difficulty, levelIndex, value } = target.dataset;

  if (action === 'play') {
    ui.showScreen('operation-select');
  } else if (action === 'back-to-start') {
    ui.showScreen('start');
  } else if (action === 'back-to-operations') {
    ui.showScreen('operation-select');
  } else if (action === 'back-to-difficulty') {
    showDifficultySelect(state.operation);
  } else if (action === 'back-to-levels') {
    showLevelSelect(state.operation, state.difficulty);
  } else if (action === 'retry') {
    startLevel(state.operation, state.difficulty, state.levelIndex);
  } else if (action === 'next-level') {
    startLevel(state.operation, state.difficulty, state.levelIndex + 1);
  } else if (action === 'toggle-theme') {
    ui.toggleTheme();
  } else if (operation) {
    state.operation = operation;
    showDifficultySelect(operation);
  } else if (difficulty) {
    state.difficulty = difficulty;
    showLevelSelect(state.operation, difficulty);
  } else if (levelIndex !== undefined) {
    startLevel(state.operation, state.difficulty, Number(levelIndex));
  } else if (value !== undefined) {
    handleAnswer(Number(value));
  }
}

function init() {
  ui.init();
  ui.initTheme();
  ui.showScreen('start');
  document.addEventListener('click', handleClick);
}

init();
