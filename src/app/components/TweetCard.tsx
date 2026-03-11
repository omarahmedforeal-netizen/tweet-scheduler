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

function getStatusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'posted') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)',
      color: 'var(--success)',
      border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
    }
  }
  if (status === 'failed') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
      color: 'var(--error)',
      border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
    }
  }
  return {
    backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    color: 'var(--accent)',
    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
  }
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
      className="rounded-xl p-4 transition-all"
      style={
        isSelected
          ? {
              border: '1px solid var(--accent-ring)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 5%, transparent)',
              boxShadow: '0 0 0 1px var(--accent-ring)',
            }
          : {
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-sidebar)',
            }
      }
    >
      <div className="flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(tweet.id)}
          className="mt-1 shrink-0 w-4 h-4 rounded cursor-pointer"
          style={{ borderColor: 'var(--border)', accentColor: 'var(--accent)' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text)' }} dir="rtl">
              {truncate(tweet.translatedText, 150)}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {tweet.isThread && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    color: 'var(--accent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                  }}
                >
                  {i18n.thread || '\u0633\u0644\u0633\u0644\u0629'} {(tweet.threadIndex || 0) + 1}
                </span>
              )}
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={getStatusBadgeStyle(tweet.status)}
              >
                {tweet.status === 'posted' ? `\u2713 ${i18n.statusPublished || '\u0646\u064f\u0634\u0631'}`
                : tweet.status === 'failed' ? `\u2717 ${i18n.statusFailed || '\u0641\u0634\u0644'}`
                : `\u23f3 ${i18n.statusPending || '\u0627\u0646\u062a\u0638\u0627\u0631'}`}
              </span>
            </div>
          </div>
          {tweet.errorMessage && (
            <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>\u26a0 {tweet.errorMessage}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mr-7">
        <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <span>\ud83d\udd52</span>
          <span dir="ltr">{formatDate(tweet.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {tweet.status === 'pending' && (
            <>
              <button
                onClick={() => onEdit(tweet)}
                className="text-xs px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                title={i18n.edit || '\u062a\u0639\u062f\u064a\u0644'}
              >
                <EditIcon />
              </button>
              <button
                onClick={() => setConfirmPostId(tweet.id)}
                disabled={loadingPost === tweet.id}
                className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                }}
              >
                {loadingPost === tweet.id ? <Spinner size="w-3 h-3" /> : (i18n.publishNow || '\u0646\u0634\u0631 \u0627\u0644\u0622\u0646')}
              </button>
            </>
          )}
          <button
            onClick={() => setConfirmDeleteId(tweet.id)}
            disabled={loadingDelete === tweet.id}
            className="text-xs px-2 py-1.5 rounded-lg transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
              color: 'var(--error)',
              border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
            }}
            title={i18n.delete || '\u062d\u0630\u0641'}
          >
            {loadingDelete === tweet.id ? <Spinner size="w-3 h-3" /> : <TrashIcon />}
          </button>
          {tweet.tweetUrl && (
            <a
              href={tweet.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
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
