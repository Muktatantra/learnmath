export const QUESTIONS_PER_LEVEL = 10;
export const STARTING_LIVES = 3;
export const PASS_THRESHOLD = 7; // correct answers out of QUESTIONS_PER_LEVEL

export const OPERATIONS = ['addition', 'subtraction', 'multiplication'];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const LEVELS_PER_DIFFICULTY = 10;

function lerp(start, end, t) {
  return Math.round(start + (end - start) * t);
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildArithmeticLevels({ minStart, minEnd, maxStart, maxEnd, timeStart, timeEnd }) {
  return Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, i) => {
    const t = i / (LEVELS_PER_DIFFICULTY - 1);
    return {
      min: lerp(minStart, minEnd, t),
      max: lerp(maxStart, maxEnd, t),
      timeLimit: Math.round((timeStart + (timeEnd - timeStart) * t) * 10) / 10,
    };
  });
}

function buildMultiplicationLevels({ tableSets, multiplierMin, multiplierMax, timeStart, timeEnd }) {
  return tableSets.map((tables, i) => {
    const t = i / (LEVELS_PER_DIFFICULTY - 1);
    return {
      tables,
      multiplierMin,
      multiplierMax,
      timeLimit: Math.round((timeStart + (timeEnd - timeStart) * t) * 10) / 10,
    };
  });
}

const ARITHMETIC_RANGES = {
  easy: { minStart: 1, minEnd: 1, maxStart: 5, maxEnd: 30, timeStart: 14, timeEnd: 10 },
  medium: { minStart: 10, minEnd: 50, maxStart: 30, maxEnd: 200, timeStart: 10, timeEnd: 6 },
  hard: { minStart: 50, minEnd: 200, maxStart: 200, maxEnd: 999, timeStart: 8, timeEnd: 4 },
};

const MULTIPLICATION_TABLE_SETS = {
  easy: [[1, 2], [1, 2, 3], [2, 3, 4], [1, 2, 3, 4, 5], [2, 5, 10], [1, 2, 5, 10], [3, 4, 6], [3, 4, 6, 8], [6, 7, 8], range(1, 10)],
  medium: [[6, 7], [7, 8], [8, 9], [9, 10], [6, 7, 8, 9], [7, 8, 9, 10], [10, 11], [11, 12], [9, 10, 11, 12], range(6, 12)],
  hard: [range(2, 10), range(2, 11), range(2, 12), range(2, 12), range(2, 13), range(2, 13), range(2, 14), range(2, 14), range(2, 15), range(2, 15)],
};

const MULTIPLICATION_RANGES = {
  easy: { multiplierMin: 1, multiplierMax: 10, timeStart: 14, timeEnd: 9 },
  medium: { multiplierMin: 1, multiplierMax: 12, timeStart: 10, timeEnd: 6 },
  hard: { multiplierMin: 1, multiplierMax: 15, timeStart: 8, timeEnd: 4 },
};

export const LEVELS = {
  addition: {},
  subtraction: {},
  multiplication: {},
};

for (const difficulty of DIFFICULTIES) {
  LEVELS.addition[difficulty] = buildArithmeticLevels(ARITHMETIC_RANGES[difficulty]);
  LEVELS.subtraction[difficulty] = buildArithmeticLevels(ARITHMETIC_RANGES[difficulty]);
  LEVELS.multiplication[difficulty] = buildMultiplicationLevels({
    tableSets: MULTIPLICATION_TABLE_SETS[difficulty],
    ...MULTIPLICATION_RANGES[difficulty],
  });
}

export const OPERATION_LABELS = {
  addition: { name: 'Addition', symbol: '+' },
  subtraction: { name: 'Subtraction', symbol: '−' },
  multiplication: { name: 'Multiplication', symbol: '×' },
};

export const DIFFICULTY_LABELS = {
  easy: { name: 'Easy', color: '#06d6a0' },
  medium: { name: 'Medium', color: '#ffb703' },
  hard: { name: 'Hard', color: '#ef476f' },
};

export function starsForScore(score) {
  if (score >= 160) return 3;
  if (score >= 100) return 2;
  if (score >= 70) return 1;
  return 0;
}
