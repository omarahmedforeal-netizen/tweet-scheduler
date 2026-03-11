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

export function StatusPills({ stats, filterTab, setFilterTab, i18n }: StatusPillsProps) {
  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {/* All / Drafts */}
      <button
        onClick={() => setFilterTab('all')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
          filterTab === 'all'
            ? 'bg-gray-100 border-gray-300 text-gray-700'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>\u0645\u0633\u0648\u062f\u0627\u062a</span>
        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{stats.total}</span>
      </button>

      {/* Failed */}
      <button
        onClick={() => setFilterTab('failed')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
          filterTab === 'failed'
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-red-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>\u0641\u0634\u0644\u062a</span>
        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{stats.failed}</span>
      </button>

      {/* Posted */}
      <button
        onClick={() => setFilterTab('posted')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
          filterTab === 'posted'
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-green-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>\u062a\u0645 \u0646\u0634\u0631\u0647\u0627</span>
        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">{stats.posted}</span>
      </button>

      {/* Pending */}
      <button
        onClick={() => setFilterTab('pending')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
          filterTab === 'pending'
            ? 'bg-blue-50 border-blue-200 text-blue-600'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-blue-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631</span>
        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{stats.pending}</span>
      </button>
    </div>
  )
}

export default StatusPills
