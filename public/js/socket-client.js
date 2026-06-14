import { getPlayerId, getProfile } from './profile.js';

let socket = null;
const connectListeners = [];
const stateListeners = [];
const privateListeners = [];
const authResultListeners = [];

export function connect() {
  if (socket) return socket;

  // Loaded globally via <script src="/socket.io/socket.io.js">.
  socket = io();

  socket.on('connect', () => {
    const profile = getProfile();
    socket.emit('player:hello', {
      playerId: getPlayerId(),
      name: profile?.name,
      avatar: profile?.avatar,
    });
    connectListeners.forEach((cb) => cb());
  });

  socket.on('room:state', (state) => {
    stateListeners.forEach((cb) => cb(state));
  });

  socket.on('room:private', (payload) => {
    privateListeners.forEach((cb) => cb(payload));
  });

  socket.on('orchestrator:auth-result', (result) => {
    authResultListeners.forEach((cb) => cb(result));
  });

  return socket;
}

export function onConnect(cb) {
  connectListeners.push(cb);
}

export function onRoomState(cb) {
  stateListeners.push(cb);
}

export function onRoomPrivate(cb) {
  privateListeners.push(cb);
}

export function onAuthResult(cb) {
  authResultListeners.push(cb);
}

export function emit(event, payload) {
  socket?.emit(event, payload);
}
