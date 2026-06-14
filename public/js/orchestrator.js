import * as ui from './ui.js';
import { emit, onConnect, onAuthResult } from './socket-client.js';
import { renderPlayerList } from './player-list.js';
import * as imposter from './imposter.js';
import * as pictionary from './pictionary.js';
import { getGroupGames } from './games-registry.js';

const PIN_STORAGE_KEY = 'learnmath_orchestrator_pin';

let isAuthed = false;
let pendingManualAuth = false;
let lastSubmittedPin = null;
let latestState = null;

function elements() {
  return {
    pinInput: document.querySelector('.orchestrator-pin-input'),
    pinError: document.querySelector('.orchestrator-pin-error'),
    gameSelect: document.querySelector('.orchestrator-game-select'),
    playerList: document.querySelector('.orchestrator-player-list'),
    startButton: document.querySelector('.orchestrator-start-button'),
    startHint: document.querySelector('.orchestrator-start-hint'),
    gameControls: document.querySelector('.orchestrator-game-controls'),
  };
}

function getCachedPin() {
  try {
    return sessionStorage.getItem(PIN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setCachedPin(pin) {
  try {
    sessionStorage.setItem(PIN_STORAGE_KEY, pin);
  } catch {
    // pin just won't persist across reloads
  }
}

function clearCachedPin() {
  try {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}

export function init() {
  isAuthed = Boolean(getCachedPin());

  // Re-authenticate silently on (re)connect, since socket.data.isOrchestrator
  // is per-connection and reset on every reconnect/reload.
  onConnect(() => {
    const cachedPin = getCachedPin();
    if (cachedPin) {
      lastSubmittedPin = cachedPin;
      pendingManualAuth = false;
      emit('orchestrator:auth', { pin: cachedPin });
    }
  });

  onAuthResult(({ ok }) => {
    isAuthed = ok;
    if (ok) {
      setCachedPin(lastSubmittedPin);
      if (pendingManualAuth) showPanel();
    } else {
      clearCachedPin();
      if (pendingManualAuth) {
        const els = elements();
        if (els.pinError) els.pinError.textContent = 'Wrong PIN. Try again.';
      }
    }
    pendingManualAuth = false;
  });
}

export function openEntry() {
  if (isAuthed) {
    showPanel();
    return;
  }
  const els = elements();
  if (els.pinInput) els.pinInput.value = '';
  if (els.pinError) els.pinError.textContent = '';
  ui.showScreen('orchestrator-pin');
}

function submitPin() {
  const els = elements();
  const pin = els.pinInput?.value || '';
  lastSubmittedPin = pin;
  pendingManualAuth = true;
  emit('orchestrator:auth', { pin });
}

function showPanel() {
  renderGameSelect();
  renderPanel();
  ui.showScreen('orchestrator-panel');
}

function renderGameSelect() {
  const els = elements();
  if (!els.gameSelect) return;
  els.gameSelect.innerHTML = '';

  getGroupGames().forEach((game) => {
    const btn = document.createElement('button');
    const selected = latestState?.selectedGame === game.id;
    btn.className = 'btn ' + (selected ? 'btn-primary' : 'btn-secondary');
    btn.dataset.action = 'orchestrator-select-game';
    btn.dataset.game = game.id;
    btn.textContent = `${game.emoji} ${game.name}`;
    els.gameSelect.appendChild(btn);
  });
}

function renderPanel() {
  const els = elements();
  const players = latestState?.players || [];
  renderPlayerList(els.playerList, players, { showReady: true });

  const phase = latestState?.phase;
  const gameActive = phase === 'imposter' || phase === 'pictionary';

  if (els.gameSelect) els.gameSelect.hidden = gameActive;
  if (els.startButton) els.startButton.hidden = gameActive;
  if (els.startHint) els.startHint.hidden = gameActive;

  if (!gameActive) {
    const selectedGame = latestState?.selectedGame;
    const readyCount = players.filter((p) => p.ready).length;
    let minPlayers = 1;
    if (selectedGame === 'imposter') minPlayers = latestState?.imposter?.minPlayers || 3;
    if (selectedGame === 'pictionary') minPlayers = latestState?.pictionary?.minPlayers || 2;

    if (els.startButton) {
      els.startButton.disabled = !selectedGame || readyCount < minPlayers;
    }
    if (els.startHint) {
      els.startHint.textContent = selectedGame
        ? `${readyCount}/${minPlayers}+ ready players needed to start.`
        : 'Pick a game above.';
    }
  }

  renderGameControls();
}

function renderGameControls() {
  const els = elements();
  if (!els.gameControls) return;

  if (latestState?.phase === 'imposter') {
    imposter.renderOrchestratorControls(latestState, els.gameControls);
  } else if (latestState?.phase === 'pictionary') {
    pictionary.renderOrchestratorControls(latestState, els.gameControls);
  } else {
    els.gameControls.innerHTML = '';
  }
}

export function onRoomState(state) {
  latestState = state;
  renderGameSelect();
  renderPanel();
}

export function handleClick(target, dataset) {
  const { action, game } = dataset;

  if (action === 'orchestrator-submit-pin') {
    submitPin();
    return true;
  }
  if (action === 'orchestrator-select-game') {
    emit('orchestrator:select-game', { gameId: game });
    return true;
  }
  if (action === 'orchestrator-start-game') {
    emit('orchestrator:start-game', {});
    return true;
  }
  if (action === 'orchestrator-reset') {
    emit('orchestrator:reset', {});
    return true;
  }
  if (action === 'orchestrator-start-voting') {
    emit('orchestrator:start-voting', {});
    return true;
  }
  if (action === 'orchestrator-end-voting') {
    emit('orchestrator:end-voting', {});
    return true;
  }
  if (action === 'orchestrator-imposter-play-again') {
    emit('orchestrator:imposter-play-again', {});
    return true;
  }
  if (action === 'orchestrator-end-imposter-game') {
    emit('orchestrator:end-imposter-game', {});
    return true;
  }
  if (action === 'orchestrator-pictionary-mark-guessed') {
    emit('orchestrator:pictionary-mark-result', { result: 'guessed' });
    return true;
  }
  if (action === 'orchestrator-pictionary-mark-timeout') {
    emit('orchestrator:pictionary-mark-result', { result: 'timeout' });
    return true;
  }
  if (action === 'orchestrator-pictionary-next-round') {
    emit('orchestrator:pictionary-next-round', {});
    return true;
  }
  if (action === 'orchestrator-end-pictionary-game') {
    emit('orchestrator:end-pictionary-game', {});
    return true;
  }

  return false;
}
