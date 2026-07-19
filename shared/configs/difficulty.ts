export const PROBLEMS_DIFFICULTY_KEYS = [
  'unrated',
  'beginner',
  'basicMinus',
  'basicAdvancedMinus',
  'basicPlusAdvanced',
  'advancedPlusProvincialMinus',
  'provincialNoiMinus',
  'noiNoiPlus',
  'noiPlusCstc',
  'noiPlusCstc',
  'noiPlusCstc',
] as const;

export const PROBLEMS_DIFFICULTY_SHORT_KEYS = [
  'none',
  'beginner',
  'basicMinus',
  'advancedMinus',
  'advanced',
  'provincialMinus',
  'provincial',
  'noi',
  'noiPlus',
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
  rgb(52, 152, 219),
  rgb(157, 61, 207),
  rgb(14, 29, 105),
  rgb(14, 29, 105),
  rgb(14, 29, 105),
  rgb(14, 29, 105),
];
