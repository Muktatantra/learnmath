import { createSession, submitAnswer, isSessionOver, getResult, startQuestionTimer } from './game.js';
import { getProgress, recordLevelResult, saveProgress } from './storage.js';
import { mergeProgress } from './progress.js';
import {
  getSyncCode,
  setSyncCode,
  clearSyncCode,
  normalizeCode,
  CODE_PATTERN,
  createSyncCode,
  fetchRemoteProgress,
  pushProgress,
} from './sync.js';
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
  const progress = recordLevelResult(session.operation, session.difficulty, session.levelIndex, result);
  ui.renderResults(result, session.operation, session.difficulty, session.levelIndex);
  ui.showScreen('results');
  syncProgress(progress);
}

async function syncProgress(progress) {
  const merged = await pushProgress(progress);
  if (merged) saveProgress(merged);
}

async function syncOnLoad() {
  const code = getSyncCode();
  if (!code) return;
  const remote = await fetchRemoteProgress(code);
  if (!remote) return;
  const merged = mergeProgress(getProgress(), remote);
  saveProgress(merged);
  pushProgress(merged);
}

function openSyncPanel() {
  ui.renderSyncPanel({ code: getSyncCode() });
  ui.toggleSyncPanel(true);
}

async function generateSyncCode() {
  ui.setSyncMessage('Generating code...');
  const code = await createSyncCode(getProgress());
  if (!code) {
    ui.setSyncMessage('Could not reach server. Try again.', true);
    return;
  }
  ui.renderSyncPanel({ code });
  ui.setSyncMessage('Sync code created! Save it to use on other devices.');
}

async function copySyncCode() {
  const code = getSyncCode();
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    ui.setSyncMessage('Copied to clipboard!');
  } catch {
    ui.setSyncMessage(`Could not copy automatically. Your code is ${code}`, true);
  }
}

function unlinkSync() {
  clearSyncCode();
  ui.renderSyncPanel({ code: null });
  ui.setSyncMessage('Unlinked. Progress on this device stays local.');
}

async function linkSyncCode() {
  const code = normalizeCode(ui.getSyncCodeInput());
  if (!CODE_PATTERN.test(code)) {
    ui.setSyncMessage('Enter a valid code, e.g. AB3D9-K7M2P', true);
    return;
  }
  ui.setSyncMessage('Linking...');
  const remote = await fetchRemoteProgress(code);
  if (!remote) {
    ui.setSyncMessage('Code not found. Check and try again.', true);
    return;
  }
  const merged = mergeProgress(getProgress(), remote);
  saveProgress(merged);
  setSyncCode(code);
  pushProgress(merged);
  ui.renderSyncPanel({ code });
  ui.setSyncMessage('Synced! Your progress is now linked.');
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
  } else if (action === 'toggle-sync') {
    openSyncPanel();
  } else if (action === 'close-sync') {
    ui.toggleSyncPanel(false);
  } else if (action === 'generate-sync-code') {
    generateSyncCode();
  } else if (action === 'copy-sync-code') {
    copySyncCode();
  } else if (action === 'unlink-sync') {
    unlinkSync();
  } else if (action === 'link-sync-code') {
    linkSyncCode();
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
  syncOnLoad();
}

init();
