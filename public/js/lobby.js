import { AVATARS } from './avatars.js';
import * as ui from './ui.js';
import { getPlayerId, getProfile, saveProfile, hasProfile } from './profile.js';
import { emit } from './socket-client.js';
import { renderPlayerList } from './player-list.js';
import { getGroupGames } from './games-registry.js';

let selectedAvatarKey = AVATARS[0].key;
let latestState = null;

function elements() {
  return {
    nameInput: document.querySelector('.profile-name-input'),
    avatarGrid: document.querySelector('.avatar-grid'),
    profileError: document.querySelector('.profile-error'),
    lobbyBanner: document.querySelector('.lobby-banner'),
    lobbyPlayerList: document.querySelector('.lobby-player-list'),
    readyButton: document.querySelector('.lobby-ready-button'),
  };
}

export function enterGroupLobby() {
  if (hasProfile()) {
    showLobbyWaiting();
  } else {
    showProfilePicker();
  }
}

export function showProfilePicker() {
  const els = elements();
  const profile = getProfile();
  selectedAvatarKey = (profile && profile.avatar) || AVATARS[0].key;
  if (els.nameInput) els.nameInput.value = (profile && profile.name) || '';
  if (els.profileError) els.profileError.textContent = '';
  renderAvatarGrid();
  ui.showScreen('profile-picker');
}

function renderAvatarGrid() {
  const els = elements();
  if (!els.avatarGrid) return;
  els.avatarGrid.innerHTML = '';

  AVATARS.forEach((avatar) => {
    const card = document.createElement('button');
    card.className = 'avatar-card' + (avatar.key === selectedAvatarKey ? ' avatar-card--selected' : '');
    card.dataset.action = 'select-avatar';
    card.dataset.avatarKey = avatar.key;

    const emoji = document.createElement('span');
    emoji.className = 'avatar-card-emoji';
    emoji.textContent = avatar.emoji;
    card.appendChild(emoji);

    const label = document.createElement('span');
    label.className = 'avatar-card-label';
    label.textContent = avatar.label;
    card.appendChild(label);

    els.avatarGrid.appendChild(card);
  });
}

function selectAvatar(key) {
  selectedAvatarKey = key;
  renderAvatarGrid();
}

function saveProfileAndContinue() {
  const els = elements();
  const name = (els.nameInput?.value || '').trim();
  if (!name) {
    if (els.profileError) els.profileError.textContent = 'Please enter a name.';
    return;
  }
  const profile = { name, avatar: selectedAvatarKey };
  saveProfile(profile);
  emit('profile:set', { playerId: getPlayerId(), name: profile.name, avatar: profile.avatar });
  showLobbyWaiting();
}

export function showLobbyWaiting() {
  renderLobbyWaiting();
  ui.showScreen('lobby-waiting');
}

function renderLobbyWaiting() {
  const els = elements();
  if (!els.lobbyBanner) return;

  const selectedGame = latestState?.selectedGame;
  const game = getGroupGames().find((g) => g.id === selectedGame);
  if (game) {
    els.lobbyBanner.textContent = `${game.emoji} ${game.name} — waiting for the host to start`;
  } else {
    els.lobbyBanner.textContent = 'Waiting for the host to choose a game...';
  }

  const players = latestState?.players || [];
  renderPlayerList(els.lobbyPlayerList, players, { showReady: true });

  if (els.readyButton) {
    const me = players.find((p) => p.id === getPlayerId());
    const ready = Boolean(me?.ready);
    els.readyButton.textContent = ready ? "I'm Ready! ✅" : "I'm Ready!";
    els.readyButton.classList.toggle('btn-primary', !ready);
    els.readyButton.classList.toggle('btn-secondary', ready);
  }
}

export function onRoomState(state) {
  latestState = state;
  renderLobbyWaiting();
}

export function handleClick(target, dataset) {
  const { action, avatarKey } = dataset;

  if (action === 'select-avatar' && avatarKey) {
    selectAvatar(avatarKey);
    return true;
  }
  if (action === 'save-profile') {
    saveProfileAndContinue();
    return true;
  }
  if (action === 'change-character') {
    showProfilePicker();
    return true;
  }
  if (action === 'profile-back') {
    if (hasProfile()) showLobbyWaiting();
    else ui.showScreen('gamebox-home');
    return true;
  }
  if (action === 'toggle-ready') {
    const playerId = getPlayerId();
    const me = latestState?.players.find((p) => p.id === playerId);
    emit('ready:toggle', { playerId, ready: !me?.ready });
    return true;
  }

  return false;
}
