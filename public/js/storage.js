import { LEVELS } from './levels.js';

const KEY = 'learnmath_progress';

function defaultProgress() {
  const progress = {};
  for (const operation of Object.keys(LEVELS)) {
    progress[operation] = { unlockedLevel: 1, bestScores: {} };
  }
  return progress;
}

let memoryFallback = null;

export function getProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : defaultProgress();
  } catch {
    return memoryFallback || (memoryFallback = defaultProgress());
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    memoryFallback = progress;
  }
}

export function recordLevelResult(operation, levelIndex, result) {
  const progress = getProgress();
  const opData = progress[operation];
  const levelNum = levelIndex + 1;
  const maxLevel = LEVELS[operation].length;

  opData.bestScores[levelNum] = Math.max(opData.bestScores[levelNum] || 0, result.score);

  if (result.passed && levelNum === opData.unlockedLevel && levelNum < maxLevel) {
    opData.unlockedLevel = levelNum + 1;
  }

  saveProgress(progress);
  return progress;
}
