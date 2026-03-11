'use client'

import React from 'react'
import type { NavSection, I18nStrings } from './types'
import {
  CalendarIcon, SparkleIcon, CartIcon, BrowseIcon, RefreshIcon,
  GearIcon, SunIcon, MoonIcon, CloseIcon, MenuIcon, TwitterLogo, TwitterLogoSmall,
} from './Icons'

interface SidebarProps {
  activeSection: NavSection
  setActiveSection: (section: NavSection) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isDark: boolean
  toggleTheme: () => void
  i18n: I18nStrings
}

const NAV_ITEMS: { key: NavSection; labelKey: string; fallback: string; icon: React.ReactNode }[] = [
  { key: 'schedule', labelKey: '', fallback: '\u062c\u062f\u0648\u0644\u0629 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0627\u062a', icon: <CalendarIcon /> },
  { key: 'ai-write', labelKey: '', fallback: '\u0643\u062a\u0627\u0628\u0629 \u062a\u063a\u0631\u064a\u062f\u0627\u062a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a', icon: <SparkleIcon /> },
  { key: 'amazon-marketing', labelKey: '', fallback: '\u062a\u0633\u0648\u064a\u0642 \u0645\u0646\u062a\u062c\u0627\u062a \u0623\u0645\u0627\u0632\u0648\u0646', icon: <CartIcon /> },
  { key: 'amazon-browse', labelKey: '', fallback: '\u062a\u0635\u0641\u062d \u0645\u0646\u062a\u062c\u0627\u062a \u0623\u0645\u0627\u0632\u0648\u0646', icon: <BrowseIcon /> },
  { key: 'rewrite', labelKey: '', fallback: '\u0625\u0639\u0627\u062f\u0629 \u0643\u062a\u0627\u0628\u0629 \u062a\u063a\u0631\u064a\u062f\u0629', icon: <RefreshIcon /> },
]

export function Sidebar({
  activeSection,
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
  isDark,
  toggleTheme,
  i18n,
}: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-[260px] z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <TwitterLogo />
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>Postlate</span>
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mr-auto lg:hidden p-1 rounded-lg transition-all"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* User Profile */}
        <div
          className="px-5 py-4"
          style={{
            borderTop: '1px solid var(--border-light)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              \u0645
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Pro</span>
              </div>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>user@postlate.com</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => { setActiveSection(item.key); setSidebarOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                activeSection === item.key
                  ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <span style={{ color: activeSection === item.key ? 'var(--accent)' : 'var(--text-muted)' }}>{item.icon}</span>
              <span>{item.fallback}</span>
            </button>
          ))}
        </nav>

        {/* Settings & Theme at bottom */}
        <div
          className="px-3 py-4 space-y-1"
          style={{ borderTop: '1px solid var(--border-light)' }}
        >
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>{isDark ? <SunIcon /> : <MoonIcon />}</span>
            <span>{isDark ? (i18n.lightMode || '\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0641\u0627\u062a\u062d') : (i18n.darkMode || '\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062f\u0627\u0643\u0646')}</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}><GearIcon /></span>
            <span>\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// Mobile header component used in main content area
export function MobileHeader({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void
}) {
  return (
    <div
      className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <TwitterLogoSmall />
        </div>
        <span className="font-bold" style={{ color: 'var(--text)' }}>Postlate</span>
      </div>
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 rounded-xl transition-all"
        style={{ color: 'var(--text-secondary)' }}
      >
        <MenuIcon />
      </button>
    </div>
  )
}

export default Sidebar
