import * as ui from './ui.js';
import { getPlayerId } from './profile.js';
import { emit } from './socket-client.js';
import { renderPlayerList } from './player-list.js';
import { getAvatarByKey } from './avatars.js';

let latestState = null;
let latestSecret = null;
let selectedVoteTarget = null;

function elements() {
  return {
    revealCard: document.querySelector('.reveal-card'),
    revealImposter: document.querySelector('.reveal-card-imposter'),
    revealCategory: document.querySelector('.reveal-card-category'),
    revealWord: document.querySelector('.reveal-card-word'),
    votingList: document.querySelector('.imposter-voting-list'),
    voteStatus: document.querySelector('.imposter-vote-status'),
    resultsImposter: document.querySelector('.imposter-results-imposter'),
    resultsWord: document.querySelector('.imposter-results-word'),
    resultsTally: document.querySelector('.imposter-results-tally'),
  };
}

export function render(state) {
  latestState = state;
  const subPhase = state.imposter?.subPhase;

  if (subPhase === 'reveal') {
    selectedVoteTarget = null;
    renderReveal();
    ui.showScreen('imposter-reveal');
  } else if (subPhase === 'voting') {
    renderVoting();
    ui.showScreen('imposter-voting');
  } else if (subPhase === 'results') {
    renderResults();
    ui.showScreen('imposter-results');
  }
}

function renderReveal() {
  const els = elements();
  if (!els.revealCard) return;

  els.revealCard.classList.remove('reveal-card--flipped', 'reveal-card--imposter');

  const secret = latestSecret?.imposter;
  if (!secret) return;

  if (secret.assignment === 'IMPOSTER') {
    els.revealCard.classList.add('reveal-card--imposter');
    if (els.revealImposter) els.revealImposter.hidden = false;
    if (els.revealCategory) els.revealCategory.hidden = true;
    if (els.revealWord) els.revealWord.hidden = true;
  } else {
    if (els.revealImposter) els.revealImposter.hidden = true;
    if (els.revealCategory) {
      els.revealCategory.hidden = false;
      els.revealCategory.textContent = `Category: ${secret.category}`;
    }
    if (els.revealWord) {
      els.revealWord.hidden = false;
      els.revealWord.textContent = secret.word;
    }
  }
}

function renderVoting() {
  const els = elements();
  const players = latestState?.players || [];
  const participantIds = new Set(latestState?.imposter?.participantIds || []);
  const myId = getPlayerId();
  const votable = players.filter((p) => participantIds.has(p.id) && p.id !== myId);

  renderPlayerList(els.votingList, votable, {
    votable: true,
    selectedId: selectedVoteTarget,
  });

  if (els.voteStatus) {
    const total = participantIds.size;
    const voted = latestState?.imposter?.voteCount || 0;
    els.voteStatus.textContent = `${voted}/${total} voted`;
  }
}

function renderResults() {
  const els = elements();
  const results = latestState?.imposter?.results;
  if (!results) return;

  const players = latestState?.players || [];
  const playerById = new Map(players.map((p) => [p.id, p]));

  const imposterPlayer = playerById.get(results.imposterId);
  if (els.resultsImposter) {
    const avatar = getAvatarByKey(imposterPlayer?.avatar);
    els.resultsImposter.textContent = `${avatar ? avatar.emoji : '❓'} ${imposterPlayer?.name || 'Someone'} was the Imposter!`;
  }
  if (els.resultsWord) {
    els.resultsWord.textContent = `Category: ${results.category} · Word: ${results.word}`;
  }
  if (els.resultsTally) {
    const participantIds = latestState?.imposter?.participantIds || [];
    const tallyPlayers = participantIds.map((id) => playerById.get(id)).filter(Boolean);
    renderPlayerList(els.resultsTally, tallyPlayers, {
      badge: (player) => {
        const votes = results.tally[player.id] || 0;
        return votes > 0 ? `${votes} vote${votes === 1 ? '' : 's'}` : '';
      },
    });
  }
}

export function onRoomPrivate(payload) {
  if (!payload.imposter) return;
  latestSecret = payload;
  if (latestState?.imposter?.subPhase === 'reveal') renderReveal();
}

export function handleClick(target, dataset) {
  if (dataset.action === 'flip-reveal-card') {
    target.classList.toggle('reveal-card--flipped');
    return true;
  }

  if (target.matches('.player-row--votable')) {
    selectedVoteTarget = dataset.targetPlayerId;
    emit('imposter:vote', { voterId: getPlayerId(), targetPlayerId: selectedVoteTarget });
    renderVoting();
    return true;
  }

  return false;
}

export function renderOrchestratorControls(state, container) {
  if (!container) return;
  container.innerHTML = '';
  const subPhase = state.imposter?.subPhase;

  if (subPhase === 'reveal') {
    addButton(container, 'Start Voting 🗳️', 'btn-primary', 'orchestrator-start-voting');
  } else if (subPhase === 'voting') {
    const hint = document.createElement('div');
    hint.className = 'orchestrator-start-hint';
    hint.textContent = `${state.imposter.voteCount}/${state.imposter.participantIds.length} voted`;
    container.appendChild(hint);
    addButton(container, 'End Voting & Reveal 🔍', 'btn-primary', 'orchestrator-end-voting');
  } else if (subPhase === 'results') {
    addButton(container, 'Play Again 🔁', 'btn-primary', 'orchestrator-imposter-play-again');
    addButton(container, 'End Game 🏠', 'btn-secondary', 'orchestrator-reset');
  }
}

function addButton(container, label, className, action) {
  const btn = document.createElement('button');
  btn.className = `btn ${className}`;
  btn.dataset.action = action;
  btn.textContent = label;
  container.appendChild(btn);
}
