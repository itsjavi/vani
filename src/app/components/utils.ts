import { classNames, type ClassName } from '@/vani/runtime'
import { twMerge } from 'tailwind-merge'

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────
export function cn(...inputs: ClassName[]) {
  return twMerge(classNames(inputs))
}
