import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
export const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
export const number = (value: number) => new Intl.NumberFormat('vi-VN').format(value)
export const initials = (name: string) =>
  name
    .replace(/^(Thầy|Cô|Y sĩ) /, '')
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('')
export const normalize = (text: string) =>
  text
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
export const dateLabel = (date: string, weekday = false) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(weekday ? { weekday: 'long' } : {}),
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(`${date}T12:00:00+07:00`))
export function addDays(date: string, count: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}
export function intervalsOverlap(start: string, end: string, otherStart: string, otherEnd: string) {
  return start < otherEnd && end > otherStart
}
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const safe = String(value).replace(/^[=+@\-\t\r]/, "'$&")
    return `"${safe.replaceAll('"', '""')}"`
  }
  const blob = new Blob(
    ['\uFEFF', [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')],
    { type: 'text/csv;charset=utf-8;' },
  )
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
