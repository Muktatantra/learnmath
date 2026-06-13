export const QUESTIONS_PER_LEVEL = 10;
export const STARTING_LIVES = 3;
export const PASS_THRESHOLD = 7; // correct answers out of QUESTIONS_PER_LEVEL

export const OPERATIONS = ['addition', 'subtraction', 'multiplication'];

export const LEVELS = {
  addition: [
    { min: 1, max: 5, timeLimit: 12 },
    { min: 1, max: 10, timeLimit: 10 },
    { min: 10, max: 50, timeLimit: 9 },
    { min: 10, max: 99, timeLimit: 8 },
    { min: 50, max: 200, timeLimit: 7 },
  ],
  subtraction: [
    { min: 1, max: 10, timeLimit: 12 },
    { min: 1, max: 20, timeLimit: 10 },
    { min: 10, max: 50, timeLimit: 9 },
    { min: 10, max: 99, timeLimit: 8 },
    { min: 50, max: 200, timeLimit: 7 },
  ],
  multiplication: [
    { tables: [1, 2, 5, 10], multiplierMin: 1, multiplierMax: 10, timeLimit: 12 },
    { tables: [3, 4, 6], multiplierMin: 1, multiplierMax: 10, timeLimit: 10 },
    { tables: [7, 8, 9], multiplierMin: 1, multiplierMax: 10, timeLimit: 9 },
    { tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], multiplierMin: 1, multiplierMax: 12, timeLimit: 8 },
    { tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], multiplierMin: 1, multiplierMax: 12, timeLimit: 7 },
  ],
};

export const OPERATION_LABELS = {
  addition: { name: 'Addition', symbol: '+' },
  subtraction: { name: 'Subtraction', symbol: '−' },
  multiplication: { name: 'Multiplication', symbol: '×' },
};

export function starsForScore(score) {
  if (score >= 160) return 3;
  if (score >= 100) return 2;
  if (score >= 70) return 1;
  return 0;
}
