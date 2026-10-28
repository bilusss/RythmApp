export const MOODS = [
  { value: 1, label: 'Bardzo źle' },
  { value: 2, label: 'Źle' },
  { value: 3, label: 'Neutralnie' },
  { value: 4, label: 'Dobrze' },
  { value: 5, label: 'Świetnie' },
];

export const moodLabel = (value) => MOODS.find((mood) => mood.value === value)?.label ?? '';
