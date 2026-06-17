import * as ui from './ui.js';
import { getPlayerId } from './profile.js';
import { emit } from './socket-client.js';
import { renderPlayerList } from './player-list.js';
import { getAvatarByKey } from './avatars.js';

let latestState = null;
let latestSecret = null;
let selectedVoteTarget = null;
let timerInterval = null;

function elements() {
  return {
    revealCard: document.querySelector('.reveal-card'),
    revealImposter: document.querySelector('.reveal-card-imposter'),
    revealCategory: document.querySelector('.reveal-card-category'),
    revealWord: document.querySelector('.reveal-card-word'),
    discussionTimerFill: document.querySelector('[data-screen="imposter-reveal"] .imp-timer-fill'),
    discussionTimerLabel: document.querySelector('[data-screen="imposter-reveal"] .imp-timer-label'),
    votingList: document.querySelector('.imposter-voting-list'),
    voteStatus: document.querySelector('.imposter-vote-status'),
    votingTimerFill: document.querySelector('[data-screen="imposter-voting"] .imp-timer-fill'),
    votingTimerLabel: document.querySelector('[data-screen="imposter-voting"] .imp-timer-label'),
    resultsImposter: document.querySelector('.imposter-results-imposter'),
    resultsWord: document.querySelector('.imposter-results-word'),
    resultsCaught: document.querySelector('.imposter-results-caught'),
    resultsTally: document.querySelector('.imposter-results-tally'),
    resultsScoreboard: document.querySelector('.imposter-results-scoreboard'),
    recapLeaderboard: document.querySelector('.imposter-recap-leaderboard'),
    recapRounds: document.querySelector('.imposter-recap-rounds'),
    recapEmpty: document.querySelector('.imposter-recap-empty'),
  };
}

export function render(state) {
  latestState = state;
  const subPhase = state.imposter?.subPhase;

  if (subPhase !== 'reveal' && subPhase !== 'voting' && timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (subPhase === 'reveal') {
    selectedVoteTarget = null;
    renderReveal();
    ui.showScreen('imposter-reveal');
    startCountdown();
  } else if (subPhase === 'voting') {
    renderVoting();
    ui.showScreen('imposter-voting');
    startCountdown();
  } else if (subPhase === 'results') {
    renderResults();
    ui.showScreen('imposter-results');
  } else if (subPhase === 'recap') {
    renderRecap();
    ui.showScreen('imposter-recap');
  }
}

function renderReveal() {
  const els = elements();
  if (!els.revealCard) return;

  els.revealCard.classList.remove('reveal-card--flipped');

  const secret = latestSecret?.imposter;
  if (!secret) return;

  if (secret.assignment === 'IMPOSTER') {
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

function startCountdown() {
  if (!timerInterval) {
    timerInterval = setInterval(tickTimer, 200);
    tickTimer();
  }
}

function tickTimer() {
  const els = elements();
  const subPhase = latestState?.imposter?.subPhase;

  let endsAt;
  let totalSeconds;
  let fillEl;
  let labelEl;

  if (subPhase === 'reveal') {
    endsAt = latestState?.imposter?.discussionEndsAt;
    totalSeconds = latestState?.imposter?.discussionSeconds || 60;
    fillEl = els.discussionTimerFill;
    labelEl = els.discussionTimerLabel;
  } else if (subPhase === 'voting') {
    endsAt = latestState?.imposter?.votingEndsAt;
    totalSeconds = latestState?.imposter?.votingSeconds || 20;
    fillEl = els.votingTimerFill;
    labelEl = els.votingTimerLabel;
  } else {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return;
  }

  if (!endsAt || !fillEl || !labelEl) return;

  const remainingMs = Math.max(0, endsAt - Date.now());
  const remainingFraction = remainingMs / (totalSeconds * 1000);

  const pct = Math.max(0, Math.min(100, remainingFraction * 100));
  fillEl.style.width = `${pct}%`;
  fillEl.classList.remove('timer-fill--green', 'timer-fill--yellow', 'timer-fill--red');
  if (remainingFraction > 0.5) {
    fillEl.classList.add('timer-fill--green');
  } else if (remainingFraction > 0.2) {
    fillEl.classList.add('timer-fill--yellow');
  } else {
    fillEl.classList.add('timer-fill--red');
  }
  labelEl.textContent = `${Math.ceil(remainingMs / 1000)}s`;

  if (remainingMs <= 0 && timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function renderResults() {
  const els = elements();
  const im = latestState?.imposter;
  const lastRound = im?.lastRound;
  if (!lastRound) return;

  const players = latestState?.players || [];
  const playerById = new Map(players.map((p) => [p.id, p]));

  const imposterPlayer = playerById.get(lastRound.imposterId);
  if (els.resultsImposter) {
    const avatar = getAvatarByKey(imposterPlayer?.avatar);
    els.resultsImposter.textContent = `${avatar ? avatar.emoji : '❓'} ${imposterPlayer?.name || 'Someone'} was the Imposter!`;
  }
  if (els.resultsWord) {
    els.resultsWord.textContent = `Category: ${lastRound.category} · Word: ${lastRound.word}`;
  }
  if (els.resultsCaught) {
    els.resultsCaught.textContent = lastRound.caught
      ? '✅ Caught! Everyone who voted correctly gets +1 point.'
      : '🏃 The Imposter got away with it and earns +1 point!';
  }
  if (els.resultsTally) {
    const tallyPlayers = (im.participantIds || []).map((id) => playerById.get(id)).filter(Boolean);
    renderPlayerList(els.resultsTally, tallyPlayers, {
      badge: (player) => {
        const votes = lastRound.tally[player.id] || 0;
        return votes > 0 ? `${votes} vote${votes === 1 ? '' : 's'}` : '';
      },
    });
  }
  if (els.resultsScoreboard) {
    renderScoreboard(els.resultsScoreboard, players, im);
  }
}

function renderScoreboard(container, players, im) {
  const participantIds = new Set(im?.participantIds || []);
  const scores = im?.scores || {};
  const ranked = players
    .filter((p) => participantIds.has(p.id))
    .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  renderPlayerList(container, ranked, {
    badge: (player) => {
      const points = scores[player.id] || 0;
      return `${points} pt${points === 1 ? '' : 's'}`;
    },
  });
}

function renderRecap() {
  const els = elements();
  const im = latestState?.imposter;
  const players = latestState?.players || [];

  if (els.recapLeaderboard) {
    renderScoreboard(els.recapLeaderboard, players, im);
  }

  if (els.recapRounds) {
    const rounds = im?.rounds || [];
    els.recapRounds.innerHTML = '';

    rounds.forEach((round, index) => {
      const row = document.createElement('div');
      row.className = 'recap-row';

      const result = document.createElement('span');
      result.className = 'recap-row-result';
      result.textContent = round.caught ? '✅' : '🏃';
      row.appendChild(result);

      const word = document.createElement('span');
      word.className = 'recap-row-word';
      word.textContent = `Round ${index + 1}: ${round.category} · ${round.word}`;
      row.appendChild(word);

      const imposterName = document.createElement('span');
      imposterName.className = 'recap-row-drawer';
      imposterName.textContent = `Imposter: ${round.imposterName}`;
      row.appendChild(imposterName);

      els.recapRounds.appendChild(row);
    });

    if (els.recapEmpty) els.recapEmpty.hidden = rounds.length > 0;
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
    addButton(container, 'End Game 🏁', 'btn-secondary', 'orchestrator-end-imposter-game');
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
