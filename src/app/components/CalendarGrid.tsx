'use client'

import React from 'react'
import type { ScheduledTweet, TimeSlot, I18nStrings } from './types'
import { TIME_SLOTS } from './types'

interface CalendarDay {
  date: Date
  label: string
  dayName: string
  dateStr: string
}

interface CalendarGridProps {
  calendarDays: CalendarDay[]
  getTweetsForSlot: (dayDate: Date, slotHour: number) => ScheduledTweet[]
  getSlotIcon: (slot: TimeSlot) => React.ReactNode
  getSlotTimeLabel: (slot: TimeSlot) => string
  onSlotClick: (dayDate: Date, slotHour: number) => void
  onEditTweet: (tweet: ScheduledTweet) => void
  i18n: I18nStrings
}

function truncate(text: string, max = 60) {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function getTweetCardStyle(status: string): React.CSSProperties {
  if (status === 'posted') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)',
      color: 'var(--success)',
    }
  }
  if (status === 'failed') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--error) 30%, transparent)',
      color: 'var(--error)',
    }
  }
  return {
    backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
    color: 'var(--accent)',
  }
}

function getStatusLabelColor(status: string): React.CSSProperties {
  if (status === 'posted') return { color: 'var(--success)' }
  if (status === 'failed') return { color: 'var(--error)' }
  return { color: 'var(--accent)' }
}

export function CalendarGrid({
  calendarDays,
  getTweetsForSlot,
  getSlotIcon,
  getSlotTimeLabel,
  onSlotClick,
  onEditTweet,
  i18n,
}: CalendarGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {calendarDays.map((day, dayIdx) => (
        <div
          key={dayIdx}
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-sidebar)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Column header */}
          <div
            className="px-4 py-3"
            style={{
              borderBottom: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg)',
            }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{day.label}</h3>
          </div>
          {/* Time slots */}
          <div className="p-3 space-y-2">
            {TIME_SLOTS.map(slot => {
              const tweetsInSlot = getTweetsForSlot(day.date, slot.hour)
              return (
                <div
                  key={slot.key}
                  className="rounded-lg p-2.5 transition-all"
                  style={{ border: '1px solid var(--border-light)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {getSlotIcon(slot)}
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }} dir="ltr">{getSlotTimeLabel(slot)}</span>
                    </div>
                    <button
                      onClick={() => onSlotClick(day.date, slot.hour)}
                      className="w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  {/* Tweets in this slot */}
                  {tweetsInSlot.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {tweetsInSlot.map(tweet => (
                        <div
                          key={tweet.id}
                          className="text-xs p-2 rounded-md cursor-pointer transition-all"
                          style={{
                            ...getTweetCardStyle(tweet.status),
                            border: '1px solid',
                            borderColor: getTweetCardStyle(tweet.status).borderColor,
                          }}
                          onClick={() => {
                            if (tweet.status === 'pending') onEditTweet(tweet)
                          }}
                        >
                          <p className="line-clamp-2 leading-relaxed" dir="rtl">{truncate(tweet.translatedText, 60)}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="opacity-70" dir="ltr">
                              {new Date(tweet.scheduledAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span
                              className="text-[10px] font-medium"
                              style={getStatusLabelColor(tweet.status)}
                            >
                              {tweet.status === 'posted' ? '✓ نُشر' : tweet.status === 'failed' ? '✗ فشل' : '⏳ انتظار'}
                            </span>
                          </div>
                          {tweet.isThread && (
                            <span className="text-[10px] opacity-60">سلسلة {(tweet.threadIndex || 0) + 1}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default CalendarGrid
