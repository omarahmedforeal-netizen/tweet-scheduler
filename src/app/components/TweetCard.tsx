'use client'

import React from 'react'
import type { ScheduledTweet, I18nStrings } from './types'
import { Spinner, TrashIcon, EditIcon } from './Icons'

interface TweetCardProps {
  tweet: ScheduledTweet
  onEdit: (tweet: ScheduledTweet) => void
  onDelete: (id: string) => void
  onPostNow: (id: string) => void
  onSelect: (id: string) => void
  isSelected: boolean
  loadingPost: string | null
  loadingDelete: string | null
  confirmPostId: string | null
  confirmDeleteId: string | null
  setConfirmPostId: (id: string | null) => void
  setConfirmDeleteId: (id: string | null) => void
  formatDate: (dateStr: string) => string
  i18n: I18nStrings
}

function truncate(text: string, max = 150) {
  return text.length > max ? text.slice(0, max) + '...' : text
}

export function TweetCard({
  tweet,
  onEdit,
  onDelete,
  onPostNow,
  onSelect,
  isSelected,
  loadingPost,
  loadingDelete,
  confirmPostId,
  confirmDeleteId,
  setConfirmPostId,
  setConfirmDeleteId,
  formatDate,
  i18n,
}: TweetCardProps) {
  return (
    <div
      className={`rounded-xl p-4 border transition-all ${
        isSelected
          ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(tweet.id)}
          className="mt-1 shrink-0 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-800 leading-relaxed flex-1" dir="rtl">
              {truncate(tweet.translatedText, 150)}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {tweet.isThread && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  {i18n.thread || '\u0633\u0644\u0633\u0644\u0629'} {(tweet.threadIndex || 0) + 1}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                tweet.status === 'posted'
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : tweet.status === 'failed'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}>
                {tweet.status === 'posted' ? `\u2713 ${i18n.statusPublished || '\u0646\u064f\u0634\u0631'}`
                : tweet.status === 'failed' ? `\u2717 ${i18n.statusFailed || '\u0641\u0634\u0644'}`
                : `\u23f3 ${i18n.statusPending || '\u0627\u0646\u062a\u0638\u0627\u0631'}`}
              </span>
            </div>
          </div>
          {tweet.errorMessage && (
            <p className="text-xs text-red-500 mt-1">\u26a0 {tweet.errorMessage}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mr-7">
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span>\ud83d\udd52</span>
          <span dir="ltr">{formatDate(tweet.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {tweet.status === 'pending' && (
            <>
              <button
                onClick={() => onEdit(tweet)}
                className="text-xs px-2 py-1.5 rounded-lg transition-all text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title={i18n.edit || '\u062a\u0639\u062f\u064a\u0644'}
              >
                <EditIcon />
              </button>
              <button
                onClick={() => setConfirmPostId(tweet.id)}
                disabled={loadingPost === tweet.id}
                className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg transition-all disabled:opacity-50"
              >
                {loadingPost === tweet.id ? <Spinner size="w-3 h-3" /> : (i18n.publishNow || '\u0646\u0634\u0631 \u0627\u0644\u0622\u0646')}
              </button>
            </>
          )}
          <button
            onClick={() => setConfirmDeleteId(tweet.id)}
            disabled={loadingDelete === tweet.id}
            className="text-xs px-2 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-lg transition-all disabled:opacity-50"
            title={i18n.delete || '\u062d\u0630\u0641'}
          >
            {loadingDelete === tweet.id ? <Spinner size="w-3 h-3" /> : <TrashIcon />}
          </button>
          {tweet.tweetUrl && (
            <a
              href={tweet.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
              dir="ltr"
            >
              {i18n.source || '\u0627\u0644\u0645\u0635\u062f\u0631'} \u2197
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default TweetCard
