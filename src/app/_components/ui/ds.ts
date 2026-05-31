// Design-system class strings. Import these in pages and components.
// Single source of truth for spacing, radius, color, and interaction tokens.

// ── Page backgrounds ──────────────────────────────────────────────────────────
export const pageBg = 'min-h-screen bg-gray-50 dark:bg-gray-950'
export const pageBgWhite = 'min-h-screen bg-white dark:bg-gray-950'

// ── Cards ─────────────────────────────────────────────────────────────────────
export const card = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl'
export const cardHover = `${card} hover:border-blue-300 dark:hover:border-blue-600 transition-colors`
export const cardPad = `${card} p-5`
export const cardPadLg = `${card} p-6`

// ── Inputs ────────────────────────────────────────────────────────────────────
export const input =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

export const inputSm =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

// ── Buttons ───────────────────────────────────────────────────────────────────
export const btnPrimary =
  'bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors'
export const btnPrimaryFull = `w-full ${btnPrimary} py-2.5`
export const btnSecondary =
  'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
export const btnDanger =
  'bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors'
export const btnGhost =
  'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'

// ── Typography ────────────────────────────────────────────────────────────────
export const pageTitle = 'text-xl font-bold text-gray-900 dark:text-white'
export const sectionTitle = 'text-base font-semibold text-gray-900 dark:text-white'
export const label = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
export const labelXs = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'
export const muted = 'text-sm text-gray-500 dark:text-gray-400'
export const mutedXs = 'text-xs text-gray-400 dark:text-gray-500'
export const breadcrumb = 'text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors'

// ── Badges ────────────────────────────────────────────────────────────────────
export const badgeBase = 'text-xs font-medium px-2.5 py-1 rounded-full'
export const badgeGreen = `${badgeBase} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`
export const badgeGray = `${badgeBase} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400`
export const badgeAmber = `${badgeBase} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400`
export const badgeRed = `${badgeBase} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`
export const badgeBlue = `${badgeBase} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400`
