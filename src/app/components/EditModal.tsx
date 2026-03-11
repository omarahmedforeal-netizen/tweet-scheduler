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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <EditIcon /> {i18n.editTweet || '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062a\u063a\u0631\u064a\u062f\u0629'}
        </h3>
        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-2">{i18n.textLabel || '\u0627\u0644\u0646\u0635'}</label>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
            dir="rtl"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-mono ${editText.length > CHAR_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
              {editText.length}/{CHAR_LIMIT}
            </span>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm text-gray-500 mb-2">{i18n.publishTimeLabel || '\u0648\u0642\u062a \u0627\u0644\u0646\u0634\u0631'}</label>
          <input
            type="datetime-local"
            value={editTime}
            onChange={e => setEditTime(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={loadingEdit || editText.length > CHAR_LIMIT || !editText.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            {loadingEdit ? <><Spinner /> {i18n.saving || '\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...'}</> : (i18n.saveChanges || '\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a')}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm">
            {i18n.cancel || '\u0625\u0644\u063a\u0627\u0621'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditModal
