'use client'

import React from 'react'
import type { ScheduledTweet, I18nStrings } from './types'
import { CHAR_LIMIT } from './types'
import { Spinner, EditIcon } from './Icons'

interface EditModalProps {
  editingTweet: ScheduledTweet | null
  editText: string
  setEditText: (text: string) => void
  editTime: string
  setEditTime: (time: string) => void
  onSave: () => void
  onClose: () => void
  loadingEdit: boolean
  i18n: I18nStrings
}

export function EditModal({
  editingTweet,
  editText,
  setEditText,
  editTime,
  setEditTime,
  onSave,
  onClose,
  loadingEdit,
  i18n,
}: EditModalProps) {
  if (!editingTweet) return null

  const isDisabled = loadingEdit || editText.length > CHAR_LIMIT || !editText.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
      >
        <h3
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ color: 'var(--text)' }}
        >
          <EditIcon /> {i18n.editTweet || '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629'}
        </h3>
        <div className="mb-4">
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {i18n.textLabel || '\u0627\u0644\u0646\u0635'}
          </label>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--bg)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            onFocus={e => {
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)'
              e.currentTarget.style.borderColor = 'var(--accent)'
            }}
            onBlur={e => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            dir="rtl"
          />
          <div className="flex justify-end mt-1">
            <span
              className="text-xs font-mono"
              style={{ color: editText.length > CHAR_LIMIT ? 'var(--error)' : 'var(--text-muted)' }}
            >
              {editText.length}/{CHAR_LIMIT}
            </span>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {i18n.publishTimeLabel || '\u0648\u0642\u062a \u0627\u0644\u0646\u0634\u0631'}
          </label>
          <input
            type="datetime-local"
            value={editTime}
            onChange={e => setEditTime(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--bg)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            onFocus={e => {
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)'
              e.currentTarget.style.borderColor = 'var(--accent)'
            }}
            onBlur={e => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={isDisabled}
            className="flex-1 py-2.5 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            style={
              isDisabled
                ? { backgroundColor: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                : { backgroundColor: 'var(--accent)', color: '#fff' }
            }
            onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.backgroundColor = 'var(--accent-hover)' }}
            onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.backgroundColor = 'var(--accent)' }}
          >
            {loadingEdit ? <><Spinner /> {i18n.saving || '\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...'}</> : (i18n.saveChanges || '\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 font-medium rounded-xl transition-all text-sm"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-light)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
          >
            {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditModal
