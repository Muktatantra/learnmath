// Movie-inspired emoji avatars. Plain emoji (no copyrighted artwork/names)
// so they're safe to use and render instantly on any device.
export const AVATARS = [
  { key: 'snow-queen', emoji: '❄️', label: 'Snow Queen' },
  { key: 'snow-pal', emoji: '⛄', label: 'Snow Pal' },
  { key: 'cheerful-mouse', emoji: '🐭', label: 'Cheerful Mouse' },
  { key: 'chef-rat', emoji: '🐀', label: 'Chef Rat' },
  { key: 'jungle-tiger', emoji: '🐯', label: 'Jungle Tiger' },
  { key: 'jungle-monkey', emoji: '🐵', label: 'Jungle Monkey' },
  { key: 'lion-prince', emoji: '🦁', label: 'Lion Prince' },
  { key: 'bear-cub', emoji: '🐻', label: 'Bear Cub' },
  { key: 'ocean-mermaid', emoji: '🧜', label: 'Ocean Mermaid' },
  { key: 'pirate-captain', emoji: '🏴‍☠️', label: 'Pirate Captain' },
  { key: 'superhero', emoji: '🦸', label: 'Superhero' },
  { key: 'wise-wizard', emoji: '🧙', label: 'Wise Wizard' },
];

export function getAvatarByKey(key) {
  return AVATARS.find((a) => a.key === key) || null;
}
