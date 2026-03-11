'use client'

import React from 'react'
import type { FilterTab, I18nStrings } from './types'

interface Stats {
  total: number
  pending: number
  posted: number
  failed: number
}

interface StatusPillsProps {
  stats: Stats
  filterTab: FilterTab
  setFilterTab: (tab: FilterTab) => void
  i18n: I18nStrings
}

function getPillStyle(tab: FilterTab, isActive: boolean): React.CSSProperties {
  if (tab === 'all') {
    return isActive
      ? { backgroundColor: 'var(--accent-light)', borderColor: 'var(--border)', color: 'var(--text)' }
      : { backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
  }
  if (tab === 'failed') {
    return isActive
      ? { backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--error) 30%, transparent)', color: 'var(--error)' }
      : { backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
  }
  if (tab === 'posted') {
    return isActive
      ? { backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)', color: 'var(--success)' }
      : { backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
  }
  // pending
  return isActive
    ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }
    : { backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
}

function getBadgeStyle(tab: FilterTab): React.CSSProperties {
  if (tab === 'all') {
    return { backgroundColor: 'var(--accent-light)', color: 'var(--text-secondary)' }
  }
  if (tab === 'failed') {
    return { backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)' }
  }
  if (tab === 'posted') {
    return { backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }
  }
  // pending
  return { backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }
}

export function StatusPills({ stats, filterTab, setFilterTab, i18n }: StatusPillsProps) {
  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {/* All / Drafts */}
      <button
        onClick={() => setFilterTab('all')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ ...getPillStyle('all', filterTab === 'all'), border: '1px solid', borderColor: getPillStyle('all', filterTab === 'all').borderColor }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>\u0645\u0633\u0648\u062f\u0627\u062a</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={getBadgeStyle('all')}>{stats.total}</span>
      </button>

      {/* Failed */}
      <button
        onClick={() => setFilterTab('failed')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ ...getPillStyle('failed', filterTab === 'failed'), border: '1px solid', borderColor: getPillStyle('failed', filterTab === 'failed').borderColor }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>\u0641\u0634\u0644\u062a</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={getBadgeStyle('failed')}>{stats.failed}</span>
      </button>

      {/* Posted */}
      <button
        onClick={() => setFilterTab('posted')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ ...getPillStyle('posted', filterTab === 'posted'), border: '1px solid', borderColor: getPillStyle('posted', filterTab === 'posted').borderColor }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>\u062a\u0645 \u0646\u0634\u0631\u0647\u0627</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={getBadgeStyle('posted')}>{stats.posted}</span>
      </button>

      {/* Pending */}
      <button
        onClick={() => setFilterTab('pending')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
        style={{ ...getPillStyle('pending', filterTab === 'pending'), border: '1px solid', borderColor: getPillStyle('pending', filterTab === 'pending').borderColor }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={getBadgeStyle('pending')}>{stats.pending}</span>
      </button>
    </div>
  )
}

export default StatusPills
