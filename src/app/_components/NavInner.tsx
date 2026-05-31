'use client'

import { useState } from 'react'

type Props = {
  isSignedIn: boolean
}

export function NavInner({ isSignedIn }: Props) {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/practice', label: 'Practice Papers' },
  ]

  const authLink = isSignedIn
    ? { href: '/dashboard', label: 'Dashboard' }
    : { href: '/login', label: 'Log In' }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <a href="/" className="font-bold text-gray-900 text-lg tracking-tight">
            Nilexia
          </a>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href={authLink.href}
              className="text-sm font-semibold text-white bg-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {authLink.label}
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <nav className="md:hidden border-t border-gray-100 py-2 flex flex-col">
            {[...links, authLink].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-2 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
