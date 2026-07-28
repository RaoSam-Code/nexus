import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate a color from a string (stable per user id) */
export function userColor(id: string): string {
  const colors = [
    '#00f2ff', '#bc13fe', '#22c55e', '#f59e0b',
    '#ef4444', '#3b82f6', '#f97316', '#a855f7',
    '#06b6d4', '#84cc16', '#ec4899', '#14b8a6',
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/** Get initials from email or display name */
export function initials(emailOrName: string): string {
  if (!emailOrName) return '?'
  const clean = emailOrName.split('@')[0]
  const parts = clean.split(/[_.\s-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}

/** Short display name from email */
export function displayName(email: string): string {
  return email.split('@')[0].replace(/[_.-]/g, ' ')
}

/** Format timestamp to HH:MM */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Shuffle an array in-place (Fisher–Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Copy text to clipboard; returns success bool */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
