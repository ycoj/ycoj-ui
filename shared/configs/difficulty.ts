export const PROBLEMS_DIFFICULTY_KEYS = [
  'unrated',
  'beginner',
  'basicMinus',
  'basic',
  'basicPlusAdvancedMinus',
  'advanced',
  'advancedPlusProvincialMinus',
  'provincialNoiMinus',
  'noiNoiPlus',
  'noiNoiPlus',
  'noiNoiPlus',
] as const;

export const PROBLEMS_DIFFICULTY_SHORT_KEYS = [
  'none',
  'beginner',
  'basicMinus',
  'basic',
  'advancedMinus',
  'advanced',
  'provincialMinus',
  'provincial',
  'noi',
  'noiPlus',
  'noiPlus',
] as const;

const rgb = (r: number, g: number, b: number) => {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const PROBLEMS_DIFFICULTY_COLOR = [
  rgb(160, 160, 160),
  rgb(254, 76, 97),
  rgb(243, 156, 17),
  rgb(255, 193, 22),
  rgb(82, 196, 26),
  rgb(19, 194, 194),
  rgb(52, 152, 219),
  rgb(157, 61, 207),
  rgb(14, 29, 105),
  rgb(14, 29, 105),
  rgb(14, 29, 105),
];

// Text-friendly variants of PROBLEMS_DIFFICULTY_COLOR: same recognizable hue
// per level, darkened where the badge color is too light to read as text.
export const PROBLEMS_DIFFICULTY_TEXT_COLOR = [
  rgb(140, 140, 140),
  rgb(254, 76, 97),
  rgb(194, 124, 14),
  rgb(178, 135, 15),
  rgb(62, 147, 20),
  rgb(13, 135, 135),
  rgb(42, 122, 175),
  rgb(157, 61, 207),
  rgb(33, 48, 140),
  rgb(33, 48, 140),
  rgb(33, 48, 140),
];
