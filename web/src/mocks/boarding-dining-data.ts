export const diningEffectiveFrom = '2026-10-26'

export const mealShifts = {
  1: { start: '11:00', end: '11:25', arrival: '11:25' },
  2: { start: '11:25', end: '11:55', arrival: '11:55' },
  3: { start: '11:50', end: '12:15', arrival: '12:15' },
} as const

// Day numbers use Monday = 2, Friday = 6, matching the source diagram.
export const diningSchedule: Record<number, Record<number, string[]>> = {
  '2': {
    '1': ['7A2', '6A3', '7A4', '8A5', '6A7', '8A3', '8A2+8A6', '8A1', '7A5', '7A6', '7A7'],
    '2': ['', '', '', '', '', '', '', '', '', '', ''],
    '3': ['6A4', '7A3', '7A1', '6A2', '9A4+9A5', '7A8', '6A5', '9A2', '9A3', '6A6', '6A1'],
  },
  '3': {
    '1': ['6A4', '6A3', '6A2', '6A8', '8A4', '8A3', '8A2', '8A1', '8A6', '6A6', '6A1'],
    '2': ['', '', '', '', '', '', '', '', '', '', ''],
    '3': ['7A2', '7A3', '7A1', '7A4', '8A7+8A8', '9A2', '9A6', '9A1+9A7', '6A9', '7A6', '7A7'],
  },
  '4': {
    '1': ['6A4', '7A3', '7A1', '8A5', '8A4', '7A4', '7A6', '', '6A9', '6A6', '6A1'],
    '2': ['', '', '6A2', '', '', '', '6A5', '', '', '', ''],
    '3': ['9A1', '6A3', '7A5', '6A7', '9A4', '7A8', '8A7+8A8', '8A1+7A9', '9A3', '9A8', '7A7'],
  },
  '5': {
    '1': ['6A5', '6A3', '6A7', '8A5', '8A4', '8A3', '8A2', '', '8A6', '', '7A7'],
    '2': ['', '', '', '', '', '', '', '', '', '', ''],
    '3': [
      '7A2',
      '7A5',
      '6A2',
      '7A4',
      '9A6+9A5',
      '7A9+9A8',
      '8A7+8A8',
      '9A2',
      '6A9+9A7',
      '7A6',
      '6A1',
    ],
  },
  '6': {
    '1': ['7A2', '7A3', '7A1', '', '8A4', '8A3', '6A5', '8A1', '8A6', '8A2', '7A5'],
    '2': ['', '', '', '', '', '', '', '', '', '', ''],
    '3': ['6A4', '9A7', '6A7', '8A5', '9A4+9A5', '7A8', '9A6', '7A9+9A1', '9A3', '6A6', '9A8'],
  },
}

// Confirmed by the user: outside the dining hall on both days, shift 3.
export const diningExceptions = [
  { day: 5, classId: '6A8', shift: 3 as const, area: 'Phòng Ngữ văn' },
  { day: 6, classId: '6A8', shift: 3 as const, area: 'Phòng Ngữ văn' },
]
