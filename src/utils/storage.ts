import type { AppDataBundle } from '@/core/types'

const STORAGE_KEY = 'price_index_app_data_v1'

export function saveToLocalStorage(bundle: AppDataBundle): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

export function loadFromLocalStorage(): AppDataBundle | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppDataBundle
  } catch (e) {
    console.error('Failed to load from localStorage', e)
    return null
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
