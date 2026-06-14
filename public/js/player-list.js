import { getAvatarByKey } from './avatars.js';

// options:
//   showReady   - show a Ready/Not ready badge
//   votable     - render rows as buttons with data-target-player-id (Imposter voting)
//   selectedId  - player id to mark with --selected (current vote choice)
//   badge(player) - optional fn returning extra badge text for a player
export function renderPlayerList(container, players, options = {}) {
  if (!container) return;
  container.innerHTML = '';

  players.forEach((player) => {
    const row = document.createElement(options.votable ? 'button' : 'div');
    row.className = 'player-row';
    if (options.votable) {
      row.classList.add('player-row--votable');
      row.dataset.targetPlayerId = player.id;
    }
    if (options.selectedId === player.id) {
      row.classList.add('player-row--selected');
    }
    if (!player.connected) {
      row.classList.add('player-row--disconnected');
    }

    const avatar = getAvatarByKey(player.avatar);
    const avatarEl = document.createElement('span');
    avatarEl.className = 'player-row-avatar';
    avatarEl.textContent = avatar ? avatar.emoji : '❓';
    row.appendChild(avatarEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'player-row-name';
    nameEl.textContent = player.name || 'Player';
    row.appendChild(nameEl);

    if (options.showReady) {
      const badge = document.createElement('span');
      badge.className = 'player-row-badge' + (player.ready ? ' player-row-badge--ready' : '');
      badge.textContent = player.ready ? 'Ready ✅' : 'Not ready';
      row.appendChild(badge);
    }

    if (options.badge) {
      const text = options.badge(player);
      if (text) {
        const badge = document.createElement('span');
        badge.className = 'player-row-badge';
        badge.textContent = text;
        row.appendChild(badge);
      }
    }

    container.appendChild(row);
  });
}
