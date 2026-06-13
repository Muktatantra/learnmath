function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateAddition({ min, max }) {
  const a = randInt(min, max);
  const b = randInt(min, max);
  return { text: `${a} + ${b}`, answer: a + b, a, b, op: '+' };
}

function generateSubtraction({ min, max }) {
  let a = randInt(min, max);
  let b = randInt(min, max);
  if (b > a) [a, b] = [b, a];
  if (a === b && Math.random() < 0.7) {
    b = randInt(min, a > min ? a - 1 : min);
  }
  return { text: `${a} - ${b}`, answer: a - b, a, b, op: '-' };
}

function generateMultiplication({ tables, multiplierMin, multiplierMax }) {
  const table = tables[randInt(0, tables.length - 1)];
  const multiplier = randInt(multiplierMin, multiplierMax);
  const a = Math.random() < 0.5 ? table : multiplier;
  const b = a === table ? multiplier : table;
  return { text: `${a} × ${b}`, answer: table * multiplier, a, b, op: '×' };
}

export function generateQuestion(operation, levelConfig) {
  switch (operation) {
    case 'addition':
      return generateAddition(levelConfig);
    case 'subtraction':
      return generateSubtraction(levelConfig);
    case 'multiplication':
      return generateMultiplication(levelConfig);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

export function generateChoices(correctAnswer) {
  const choices = new Set([correctAnswer]);
  const deltas = [-2, -1, 1, 2, 10, -10];
  let attempts = 0;
  while (choices.size < 4 && attempts < 50) {
    const delta = deltas[randInt(0, deltas.length - 1)];
    const candidate = correctAnswer + delta;
    if (candidate >= 0) choices.add(candidate);
    attempts++;
  }
  // Fallback in the unlikely event we couldn't find enough distinct non-negative distractors
  let filler = 0;
  while (choices.size < 4) {
    if (!choices.has(filler)) choices.add(filler);
    filler++;
  }
  return shuffle([...choices]);
}
