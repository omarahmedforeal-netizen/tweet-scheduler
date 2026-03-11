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
        <div key={dayIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Column header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">{day.label}</h3>
          </div>
          {/* Time slots */}
          <div className="p-3 space-y-2">
            {TIME_SLOTS.map(slot => {
              const tweetsInSlot = getTweetsForSlot(day.date, slot.hour)
              return (
                <div
                  key={slot.key}
                  className="border border-gray-100 rounded-lg p-2.5 hover:border-gray-200 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {getSlotIcon(slot)}
                      <span className="text-xs font-medium text-gray-600" dir="ltr">{getSlotTimeLabel(slot)}</span>
                    </div>
                    <button
                      onClick={() => onSlotClick(day.date, slot.hour)}
                      className="w-6 h-6 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all"
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
                          className={`text-xs p-2 rounded-md border cursor-pointer transition-all hover:shadow-sm ${
                            tweet.status === 'posted'
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : tweet.status === 'failed'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
                          onClick={() => {
                            if (tweet.status === 'pending') onEditTweet(tweet)
                          }}
                        >
                          <p className="line-clamp-2 leading-relaxed" dir="rtl">{truncate(tweet.translatedText, 60)}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="opacity-70" dir="ltr">
                              {new Date(tweet.scheduledAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[10px] font-medium ${
                              tweet.status === 'posted' ? 'text-green-600' : tweet.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {tweet.status === 'posted' ? '\u2713 \u0646\u064f\u0634\u0631' : tweet.status === 'failed' ? '\u2717 \u0641\u0634\u0644' : '\u23f3 \u0627\u0646\u062a\u0638\u0627\u0631'}
                            </span>
                          </div>
                          {tweet.isThread && (
                            <span className="text-[10px] opacity-60">\u0633\u0644\u0633\u0644\u0629 {(tweet.threadIndex || 0) + 1}</span>
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
