import { LEVELS, OPERATIONS, DIFFICULTIES } from './levels.js';

const KEY = 'learnmath_progress';

function defaultProgress() {
  const progress = {};
  for (const operation of OPERATIONS) {
    progress[operation] = {};
    for (const difficulty of DIFFICULTIES) {
      progress[operation][difficulty] = { unlockedLevel: 1, bestScores: {} };
    }
  }
  return progress;
}

function isValidShape(progress) {
  return Boolean(progress?.addition?.easy?.bestScores);
}

let memoryFallback = null;

export function getProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return isValidShape(parsed) ? parsed : defaultProgress();
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

export function recordLevelResult(operation, difficulty, levelIndex, result) {
  const progress = getProgress();
  const tierData = progress[operation][difficulty];
  const levelNum = levelIndex + 1;
  const maxLevel = LEVELS[operation][difficulty].length;

  tierData.bestScores[levelNum] = Math.max(tierData.bestScores[levelNum] || 0, result.score);

  if (result.passed && levelNum === tierData.unlockedLevel && levelNum < maxLevel) {
    tierData.unlockedLevel = levelNum + 1;
  }

  saveProgress(progress);
  return progress;
}
