import * as ui from './ui.js';
import * as appMath from './app.js';
import * as lobby from './lobby.js';
import * as orchestrator from './orchestrator.js';
import * as imposter from './imposter.js';
import * as pictionary from './pictionary.js';
import * as socketClient from './socket-client.js';
import { GAMES, getGroupGames } from './games-registry.js';

const GAME_SCREENS = new Set([
  'imposter-reveal',
  'imposter-voting',
  'imposter-results',
  'imposter-recap',
  'pictionary-drawer-turn',
  'pictionary-timer',
  'pictionary-round-result',
  'pictionary-recap',
]);

const NON_GAME_SCREENS = new Set(['orchestrator-pin', 'orchestrator-panel', 'profile-picker']);

let latestState = null;
let suppressGameRouting = false;

function handleClick(event) {
  const target = event.target.closest(
    '[data-action], [data-operation], [data-difficulty], [data-level-index], [data-value], [data-game], [data-avatar-key], [data-target-player-id]'
  );
  if (!target || target.disabled) return;

  const dataset = target.dataset;

  if (appMath.handleMathClick(target, dataset)) return;
  if (lobby.handleClick(target, dataset)) return;
  if (orchestrator.handleClick(target, dataset)) return;
  if (imposter.handleClick(target, dataset)) return;
  if (pictionary.handleClick(target, dataset)) return;

  const { action, game } = dataset;
  if (action === 'open-orchestrator') {
    orchestrator.openEntry();
  } else if (action === 'back-to-gamebox') {
    ui.showScreen('gamebox-home');
  } else if (action === 'go-home') {
    suppressGameRouting = true;
    ui.showScreen('gamebox-home');
    renderTileGrid(latestState);
  } else if (getGroupGames().some((g) => g.id === game)) {
    if (suppressGameRouting && latestState?.phase === game) {
      // Resume the in-progress game right where it left off.
      suppressGameRouting = false;
      routeToGameScreen(latestState);
    } else {
      lobby.enterGroupLobby();
    }
  }
}

function routeToGameScreen(state) {
  const currentScreen = ui.getCurrentScreen();
  if (NON_GAME_SCREENS.has(currentScreen)) return;
  if (currentScreen === 'gamebox-home' && suppressGameRouting) return;

  if (state.phase === 'imposter') {
    suppressGameRouting = false;
    imposter.render(state);
  } else if (state.phase === 'pictionary') {
    suppressGameRouting = false;
    pictionary.render(state);
  } else if (GAME_SCREENS.has(currentScreen)) {
    // Game ended/reset while a player was on a game screen.
    if (state.phase === 'lobby') lobby.showLobbyWaiting();
    else ui.showScreen('gamebox-home');
  }
}

function renderTileGrid(state) {
  const grid = document.querySelector('.tile-grid');
  if (!grid) return;
  grid.innerHTML = '';

  GAMES.forEach((game) => {
    const tile = document.createElement('button');
    tile.className = `game-tile game-tile--${game.id}`;
    if (game.kind === 'solo') {
      tile.dataset.action = 'play';
    } else {
      tile.dataset.game = game.id;
    }

    const resumable = suppressGameRouting && state?.phase === game.id;
    if (resumable) tile.classList.add('game-tile--resumable');

    const emoji = document.createElement('span');
    emoji.className = 'game-tile-emoji';
    emoji.textContent = game.emoji;
    tile.appendChild(emoji);

    const name = document.createElement('span');
    name.className = 'game-tile-name';
    name.textContent = game.name;
    tile.appendChild(name);

    const tag = document.createElement('span');
    tag.className = 'game-tile-tag';
    tag.textContent = resumable ? '▶️ Resume' : game.tag;
    tile.appendChild(tag);

    grid.appendChild(tile);
  });
}

function init() {
  ui.init();
  ui.initTheme();
  renderTileGrid(latestState);
  ui.showScreen('gamebox-home');
  document.addEventListener('click', handleClick);
  appMath.syncMathProgressOnLoad();

  socketClient.connect();
  socketClient.onRoomState((state) => {
    latestState = state;
    lobby.onRoomState(state);
    orchestrator.onRoomState(state);
    renderTileGrid(state);
    routeToGameScreen(state);
  });
  socketClient.onRoomPrivate((payload) => {
    imposter.onRoomPrivate(payload);
    pictionary.onRoomPrivate(payload);
  });
  orchestrator.init();
}

init();
