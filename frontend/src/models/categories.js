const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
};

const rgbToHex = (rgb) =>
  `#${rgb.map((part) => clamp(part).toString(16).padStart(2, '0')).join('')}`;

// Mixes a colour with white (amount 0..1) to get the soft chip background.
export const tint = (hex, amount = 0.84) =>
  rgbToHex(hexToRgb(hex).map((part) => part + (255 - part) * amount));

// Darkens a colour (amount 0..1) to get readable chip text.
export const shade = (hex, amount = 0.5) =>
  rgbToHex(hexToRgb(hex).map((part) => part * (1 - amount)));

export function buildCategory(name, color) {
  const trimmed = name.trim();
  return {
    id: trimmed.toLowerCase().replace(/\s+/g, '-'),
    name: trimmed,
    color,
    background: tint(color),
    text: shade(color, 0.52),
  };
}

export const DEFAULT_CATEGORIES = [
  buildCategory('Nauka', '#7954E8'),
  buildCategory('Obowiązki domowe', '#D94F78'),
  buildCategory('Praca', '#3C74DC'),
  buildCategory('Jazda autem', '#EF8528'),
  buildCategory('Relaks', '#2CA26F'),
];

export const CUSTOM_CATEGORY_COLORS = [
  '#0EA5A4',
  '#D6A100',
  '#8B5CF6',
  '#E11D48',
  '#0284C7',
  '#65A30D',
  '#C2410C',
  '#64748B',
];
