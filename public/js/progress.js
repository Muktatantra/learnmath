import { OPERATIONS, DIFFICULTIES, LEVELS_PER_DIFFICULTY } from './levels.js';

// Theoretical max score per level is 200 (10 questions x (10 base + 5 speed
// bonus + 5 streak bonus)); allow generous headroom for future tuning.
const MAX_SCORE = 1000;

export function defaultProgress() {
  const progress = {};
  for (const operation of OPERATIONS) {
    progress[operation] = {};
    for (const difficulty of DIFFICULTIES) {
      progress[operation][difficulty] = { unlockedLevel: 1, bestScores: {} };
    }
  }
  return progress;
}

export function isValidProgress(progress) {
  if (!progress || typeof progress !== 'object') return false;

  for (const operation of OPERATIONS) {
    const opData = progress[operation];
    if (!opData || typeof opData !== 'object') return false;

    for (const difficulty of DIFFICULTIES) {
      const tier = opData[difficulty];
      if (!tier || typeof tier !== 'object') return false;

      if (!Number.isInteger(tier.unlockedLevel) || tier.unlockedLevel < 1 || tier.unlockedLevel > LEVELS_PER_DIFFICULTY) {
        return false;
      }

      if (!tier.bestScores || typeof tier.bestScores !== 'object') return false;
      for (const [key, value] of Object.entries(tier.bestScores)) {
        const levelNum = Number(key);
        if (!Number.isInteger(levelNum) || levelNum < 1 || levelNum > LEVELS_PER_DIFFICULTY) return false;
        if (!Number.isFinite(value) || value < 0 || value > MAX_SCORE) return false;
      }
    }
  }

  return true;
}

export function mergeProgress(a, b) {
  const merged = defaultProgress();

  for (const operation of OPERATIONS) {
    for (const difficulty of DIFFICULTIES) {
      const ta = a[operation][difficulty];
      const tb = b[operation][difficulty];

      const bestScores = {};
      for (const level of new Set([...Object.keys(ta.bestScores), ...Object.keys(tb.bestScores)])) {
        bestScores[level] = Math.max(ta.bestScores[level] || 0, tb.bestScores[level] || 0);
      }

      merged[operation][difficulty] = {
        unlockedLevel: Math.max(ta.unlockedLevel, tb.unlockedLevel),
        bestScores,
      };
    }
  }

  return merged;
}
