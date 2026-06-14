import * as ui from './ui.js';
import { getPlayerId } from './profile.js';
import { emit } from './socket-client.js';

let latestState = null;
let latestSecret = null;
let timerInterval = null;

function elements() {
  return {
    drawerStatus: document.querySelector('.pictionary-drawer-status'),
    requestWordButton: document.querySelector('.pictionary-request-word-button'),
    timerStatus: document.querySelector('.pictionary-timer-status'),
    wordDisplay: document.querySelector('.pictionary-word-display'),
    timerFill: document.querySelector('.pic-timer-fill'),
    timerLabel: document.querySelector('.pic-timer-label'),
    roundResultText: document.querySelector('.pictionary-round-result-text'),
    roundResultDrawer: document.querySelector('.pictionary-round-result-drawer'),
    recapList: document.querySelector('.recap-list'),
    recapEmpty: document.querySelector('.recap-empty'),
  };
}

export function render(state) {
  latestState = state;
  const subPhase = state.pictionary?.subPhase;

  if (subPhase !== 'timer' && timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (subPhase === 'drawer-turn') {
    renderDrawerTurn();
    ui.showScreen('pictionary-drawer-turn');
  } else if (subPhase === 'timer') {
    renderTimer();
    ui.showScreen('pictionary-timer');
    if (!timerInterval) {
      timerInterval = setInterval(tickTimer, 200);
      tickTimer();
    }
  } else if (subPhase === 'round-result') {
    renderRoundResult();
    ui.showScreen('pictionary-round-result');
  } else if (subPhase === 'recap') {
    renderRecap();
    ui.showScreen('pictionary-recap');
  }
}

function renderDrawerTurn() {
  const els = elements();
  const isDrawer = latestState?.pictionary?.currentDrawerId === getPlayerId();
  const drawerName = latestState?.pictionary?.currentDrawerName || 'someone';

  if (els.drawerStatus) {
    els.drawerStatus.textContent = isDrawer
      ? "🎨 You're up! Tap below to get your word."
      : `🎨 Waiting for ${drawerName} to grab a word...`;
  }
  if (els.requestWordButton) {
    els.requestWordButton.hidden = !isDrawer;
  }
}

function renderTimer() {
  const els = elements();
  const isDrawer = latestState?.pictionary?.currentDrawerId === getPlayerId();
  const drawerName = latestState?.pictionary?.currentDrawerName || 'someone';

  if (els.timerStatus) {
    els.timerStatus.textContent = isDrawer ? 'Draw it!' : `Guess what ${drawerName} is drawing!`;
  }
  if (els.wordDisplay) {
    const word = latestSecret?.pictionary?.word;
    els.wordDisplay.hidden = !(isDrawer && word);
    els.wordDisplay.textContent = word || '';
  }
}

function tickTimer() {
  const els = elements();
  const endsAt = latestState?.pictionary?.timerEndsAt;
  const roundSeconds = latestState?.pictionary?.roundSeconds || 60;
  if (!endsAt || !els.timerFill || !els.timerLabel) return;

  const remainingMs = Math.max(0, endsAt - Date.now());
  const remainingFraction = remainingMs / (roundSeconds * 1000);

  const pct = Math.max(0, Math.min(100, remainingFraction * 100));
  els.timerFill.style.width = `${pct}%`;
  els.timerFill.classList.remove('timer-fill--green', 'timer-fill--yellow', 'timer-fill--red');
  if (remainingFraction > 0.5) {
    els.timerFill.classList.add('timer-fill--green');
  } else if (remainingFraction > 0.2) {
    els.timerFill.classList.add('timer-fill--yellow');
  } else {
    els.timerFill.classList.add('timer-fill--red');
  }
  els.timerLabel.textContent = `${Math.ceil(remainingMs / 1000)}s`;

  if (remainingMs <= 0 && timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function renderRoundResult() {
  const els = elements();
  const rounds = latestState?.pictionary?.rounds || [];
  const last = rounds[rounds.length - 1];
  if (!last) return;

  if (els.roundResultText) {
    const icon = last.result === 'guessed' ? '✅ Guessed it!' : "⏰ Time's up!";
    els.roundResultText.textContent = `${icon} The word was: ${last.word}`;
  }
  if (els.roundResultDrawer) {
    els.roundResultDrawer.textContent = `Drawn by ${last.drawerName}`;
  }
}

function renderRecap() {
  const els = elements();
  if (!els.recapList) return;

  const rounds = latestState?.pictionary?.rounds || [];
  els.recapList.innerHTML = '';

  rounds.forEach((round) => {
    const row = document.createElement('div');
    row.className = 'recap-row';

    const result = document.createElement('span');
    result.className = 'recap-row-result';
    result.textContent = round.result === 'guessed' ? '✅' : '⏰';
    row.appendChild(result);

    const word = document.createElement('span');
    word.className = 'recap-row-word';
    word.textContent = round.word;
    row.appendChild(word);

    const drawer = document.createElement('span');
    drawer.className = 'recap-row-drawer';
    drawer.textContent = round.drawerName;
    row.appendChild(drawer);

    els.recapList.appendChild(row);
  });

  if (els.recapEmpty) els.recapEmpty.hidden = rounds.length > 0;
}

export function onRoomPrivate(payload) {
  if (!payload.pictionary) return;
  latestSecret = payload;
  if (latestState?.pictionary?.subPhase === 'timer') renderTimer();
}

export function handleClick(target, dataset) {
  if (dataset.action === 'pictionary-request-word') {
    emit('pictionary:request-word', { playerId: getPlayerId() });
    return true;
  }
  return false;
}

export function renderOrchestratorControls(state, container) {
  if (!container) return;
  container.innerHTML = '';
  const subPhase = state.pictionary?.subPhase;

  if (subPhase === 'drawer-turn') {
    const hint = document.createElement('div');
    hint.className = 'orchestrator-start-hint';
    hint.textContent = `Waiting for ${state.pictionary.currentDrawerName || 'the drawer'} to grab a word...`;
    container.appendChild(hint);
    addButton(container, 'End Game 🏁', 'btn-secondary', 'orchestrator-end-pictionary-game');
  } else if (subPhase === 'timer') {
    addButton(container, 'Guessed it! ✅', 'btn-primary', 'orchestrator-pictionary-mark-guessed');
    addButton(container, "Time's Up ⏰", 'btn-secondary', 'orchestrator-pictionary-mark-timeout');
  } else if (subPhase === 'round-result') {
    addButton(container, 'Next Round ▶️', 'btn-primary', 'orchestrator-pictionary-next-round');
    addButton(container, 'End Game 🏁', 'btn-secondary', 'orchestrator-end-pictionary-game');
  } else if (subPhase === 'recap') {
    addButton(container, 'Back to GameBox 🏠', 'btn-primary', 'orchestrator-reset');
  }
}

function addButton(container, label, className, action) {
  const btn = document.createElement('button');
  btn.className = `btn ${className}`;
  btn.dataset.action = action;
  btn.textContent = label;
  container.appendChild(btn);
}
