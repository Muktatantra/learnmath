export const GAMES = [
  { id: 'math', emoji: '🔢', name: 'Math Practice', tag: 'Solo', kind: 'solo' },
  { id: 'imposter', emoji: '🕵️', name: 'Imposter', tag: 'Group', kind: 'group' },
  { id: 'pictionary', emoji: '🎨', name: 'Pictionary', tag: 'Group', kind: 'group' },
];

export function getGroupGames() {
  return GAMES.filter((game) => game.kind === 'group');
}
