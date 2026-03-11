'use client'

import React from 'react'
import type { ThreadItem, I18nStrings } from './types'
import { CHAR_LIMIT } from './types'
import { Spinner, CloseIcon, PlusIcon, MinusIcon } from './Icons'

interface LanguageOption {
  value: string
  label: string
}

interface NewTweetModalProps {
  showModal: boolean
  setShowModal: (show: boolean) => void
  inputMode: 'fetch' | 'write'
  setInputMode: (mode: 'fetch' | 'write') => void
  // Fetch mode
  tweetUrl: string
  setTweetUrl: (url: string) => void
  fetchedText: string
  loadingFetch: boolean
  fetchError: string
  onFetchTweet: () => void
  // Write mode
  directText: string
  setDirectText: (text: string) => void
  // Thread
  isThreadMode: boolean
  setIsThreadMode: (mode: boolean) => void
  threadItems: ThreadItem[]
  addThreadItem: () => void
  removeThreadItem: (index: number) => void
  updateThreadItem: (index: number, field: 'text' | 'originalText', value: string) => void
  // Translation
  translatedText: string
  setTranslatedText: (text: string) => void
  loadingTranslate: boolean
  translateError: string
  onTranslate: () => void
  onTranslateThread: () => void
  language: string
  setLanguage: (lang: string) => void
  languages: LanguageOption[]
  // Schedule
  scheduledAt: string
  setScheduledAt: (time: string) => void
  loadingSchedule: boolean
  scheduleError: string
  onSchedule: () => void
  // Derived
  hasSourceText: boolean
  sourceText: string
  i18n: I18nStrings
}

/* ---- style helpers ---- */
const tabContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
}

function tabStyle(active: boolean): React.CSSProperties {
  return active
    ? { backgroundColor: 'var(--bg-sidebar)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' }
    : { color: 'var(--text-secondary)' }
}

function pillStyle(active: boolean): React.CSSProperties {
  return active
    ? { backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' }
    : { backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
}

const inputBgStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
}

const focusRingStyle = 'focus:outline-none focus:ring-2 transition-all'

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--accent)',
  color: '#fff',
}

const primaryBtnHoverStyle: React.CSSProperties = {
  backgroundColor: 'var(--accent-hover)',
  color: '#fff',
}

const disabledBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--border)',
  color: 'var(--text-muted)',
  cursor: 'not-allowed',
}

export function NewTweetModal({
  showModal,
  setShowModal,
  inputMode,
  setInputMode,
  tweetUrl,
  setTweetUrl,
  fetchedText,
  loadingFetch,
  fetchError,
  onFetchTweet,
  directText,
  setDirectText,
  isThreadMode,
  setIsThreadMode,
  threadItems,
  addThreadItem,
  removeThreadItem,
  updateThreadItem,
  translatedText,
  setTranslatedText,
  loadingTranslate,
  translateError,
  onTranslate,
  onTranslateThread,
  language,
  setLanguage,
  languages,
  scheduledAt,
  setScheduledAt,
  loadingSchedule,
  scheduleError,
  onSchedule,
  hasSourceText,
  sourceText,
  i18n,
}: NewTweetModalProps) {
  if (!showModal) return null

  const charCount = translatedText.length
  const charOver = charCount > CHAR_LIMIT

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-light)' }}
        >
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>تغريدة جديدة</h3>
          <button
            onClick={() => setShowModal(false)}
            className="p-1.5 rounded-lg transition-all cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
          {/* Input Mode Toggle */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex rounded-xl p-1 gap-1 w-full" style={tabContainerStyle}>
              <button
                onClick={() => { setInputMode('fetch'); setIsThreadMode(false) }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={tabStyle(inputMode === 'fetch' && !isThreadMode)}
              >
                {i18n.fetchFromUrl || 'جلب تغريدة'}
              </button>
              <button
                onClick={() => { setInputMode('write'); setIsThreadMode(false) }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={tabStyle(inputMode === 'write' && !isThreadMode)}
              >
                {i18n.writeMode || 'كتابة'}
              </button>
            </div>
          </div>

          {/* Thread toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setIsThreadMode(!isThreadMode)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
              style={pillStyle(isThreadMode)}
            >
              {i18n.thread || 'سلسلة'} {isThreadMode ? '✓' : ''}
            </button>
          </div>

          {/* ===== FETCH MODE ===== */}
          {inputMode === 'fetch' && !isThreadMode && (
            <div>
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{i18n.tweetUrl || 'رابط التغريدة'}</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={tweetUrl}
                    onChange={e => setTweetUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onFetchTweet()}
                    placeholder="https://twitter.com/user/status/..."
                    dir="ltr"
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm ${focusRingStyle}`}
                    style={{ ...inputBgStyle, borderWidth: '1px', borderStyle: 'solid' }}
                    onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                  <button
                    onClick={onFetchTweet}
                    disabled={loadingFetch || !tweetUrl.trim()}
                    className="px-4 py-2.5 font-semibold rounded-xl transition-all text-sm"
                    style={
                      loadingFetch || !tweetUrl.trim()
                        ? disabledBtnStyle
                        : primaryBtnStyle
                    }
                    onMouseEnter={e => { if (!loadingFetch && tweetUrl.trim()) Object.assign(e.currentTarget.style, primaryBtnHoverStyle) }}
                    onMouseLeave={e => { if (!loadingFetch && tweetUrl.trim()) Object.assign(e.currentTarget.style, primaryBtnStyle) }}
                  >
                    {loadingFetch ? <Spinner /> : (i18n.fetch || 'جلب')}
                  </button>
                </div>
                {fetchError && <p className="mt-2 text-sm" style={{ color: 'var(--error)' }}>⚠ {fetchError}</p>}
              </div>

              {fetchedText && (
                <div className="mb-4">
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{i18n.originalText || 'النص الأصلي'}</label>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-sm leading-relaxed" dir="auto" style={{ color: 'var(--text)' }}>{fetchedText}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== WRITE MODE ===== */}
          {inputMode === 'write' && !isThreadMode && (
            <div>
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{i18n.writeYourTweet || 'اكتب تغريدتك'}</label>
                <textarea
                  value={directText}
                  onChange={e => setDirectText(e.target.value)}
                  rows={4}
                  placeholder={i18n.writeTweetPlaceholder || 'اكتب تغريدتك هنا...'}
                  className={`w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none ${focusRingStyle}`}
                  style={{ ...inputBgStyle, borderWidth: '1px', borderStyle: 'solid' }}
                  onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  dir="rtl"
                />
              </div>
            </div>
          )}

          {/* ===== THREAD MODE ===== */}
          {isThreadMode && (
            <div>
              <div className="space-y-3 mb-4">
                {threadItems.map((item, index) => (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div
                        className="absolute right-5 -top-3 w-0.5 h-3 opacity-40"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                          {index + 1}/{threadItems.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-mono"
                            style={{ color: item.text.length > CHAR_LIMIT ? 'var(--error)' : 'var(--text-muted)' }}
                          >
                            {item.text.length}/{CHAR_LIMIT}
                          </span>
                          {threadItems.length > 1 && (
                            <button
                              onClick={() => removeThreadItem(index)}
                              className="p-1 rounded-lg transition-all"
                              style={{ color: 'var(--error)' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--error) 10%, transparent)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <MinusIcon />
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={item.text}
                        onChange={e => updateThreadItem(index, 'text', e.target.value)}
                        rows={3}
                        placeholder={`${i18n.tweetNumber || 'تغريدة'} ${index + 1}...`}
                        className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
                        style={{ color: 'var(--text)' }}
                        dir="rtl"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addThreadItem}
                className="w-full py-2.5 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.backgroundColor = 'var(--accent-light)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <PlusIcon /> {i18n.addTweet || 'إضافة تغريدة'}
              </button>
            </div>
          )}

          {/* ===== LANGUAGE SELECTOR ===== */}
          {(hasSourceText || isThreadMode) && (
            <div className="mt-4 mb-4">
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{i18n.translationLanguage || 'لغة الترجمة'}</label>
              <div className="flex gap-2 flex-wrap">
                {languages.map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                    style={pillStyle(language === lang.value)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => isThreadMode ? onTranslateThread() : onTranslate()}
                disabled={loadingTranslate || (isThreadMode ? threadItems.every(i => !i.text.trim()) : !sourceText.trim())}
                className="mt-3 px-5 py-2.5 font-semibold rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer"
                style={
                  loadingTranslate || (isThreadMode ? threadItems.every(i => !i.text.trim()) : !sourceText.trim())
                    ? disabledBtnStyle
                    : primaryBtnStyle
                }
                onMouseEnter={e => {
                  const disabled = loadingTranslate || (isThreadMode ? threadItems.every(i => !i.text.trim()) : !sourceText.trim())
                  if (!disabled) Object.assign(e.currentTarget.style, primaryBtnHoverStyle)
                }}
                onMouseLeave={e => {
                  const disabled = loadingTranslate || (isThreadMode ? threadItems.every(i => !i.text.trim()) : !sourceText.trim())
                  if (!disabled) Object.assign(e.currentTarget.style, primaryBtnStyle)
                }}
              >
                {loadingTranslate ? <><Spinner /> {i18n.translating || 'جاري الترجمة...'}</> : (i18n.translate || 'ترجمة')}
              </button>
              {translateError && <p className="mt-2 text-sm" style={{ color: 'var(--error)' }}>⚠ {translateError}</p>}
            </div>
          )}

          {/* ===== TRANSLATED TEXT (single mode) ===== */}
          {!isThreadMode && (loadingTranslate || translatedText) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{i18n.translatedText || 'النص المترجم'}</label>
                {!loadingTranslate && translatedText && (
                  <span
                    className="text-xs font-mono"
                    style={{ color: charOver ? 'var(--error)' : charCount > CHAR_LIMIT * 0.9 ? 'var(--warning)' : 'var(--text-muted)' }}
                  >
                    {charCount}/{CHAR_LIMIT}
                  </span>
                )}
              </div>
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: charOver ? '1px solid var(--error)' : '1px solid var(--border)',
                }}
              >
                {loadingTranslate ? (
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Spinner size="w-4 h-4" /> {i18n.translating || 'جاري الترجمة...'}
                  </div>
                ) : (
                  <textarea
                    value={translatedText}
                    onChange={e => setTranslatedText(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
                    style={{ color: 'var(--text)' }}
                    dir="rtl"
                  />
                )}
              </div>
              {charOver && <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>{i18n.charLimitExceeded || 'تجاوزت الحد المسموح'} ({CHAR_LIMIT} {i18n.charUnit || 'حرف'})</p>}
            </div>
          )}

          {/* ===== SCHEDULE TIME ===== */}
          {((translatedText && !loadingTranslate && !isThreadMode) || (isThreadMode && threadItems.some(i => i.text.trim()))) && (
            <div className="mb-5">
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{i18n.publishTimeLabel || 'وقت النشر'}</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className={`w-full rounded-xl px-4 py-2.5 text-sm ${focusRingStyle}`}
                style={{ ...inputBgStyle, borderWidth: '1px', borderStyle: 'solid' }}
                onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
              />
            </div>
          )}

          {/* ===== SCHEDULE BUTTON ===== */}
          {((translatedText && !loadingTranslate && !isThreadMode) || (isThreadMode && threadItems.some(i => i.text.trim()))) && (
            <div>
              {scheduleError && <p className="mb-3 text-sm" style={{ color: 'var(--error)' }}>⚠ {scheduleError}</p>}
              <button
                onClick={onSchedule}
                disabled={loadingSchedule || (!isThreadMode && charOver)}
                className="w-full py-3 font-bold rounded-xl transition-all text-sm"
                style={
                  loadingSchedule || (!isThreadMode && charOver)
                    ? disabledBtnStyle
                    : primaryBtnStyle
                }
                onMouseEnter={e => {
                  if (!(loadingSchedule || (!isThreadMode && charOver))) Object.assign(e.currentTarget.style, primaryBtnHoverStyle)
                }}
                onMouseLeave={e => {
                  if (!(loadingSchedule || (!isThreadMode && charOver))) Object.assign(e.currentTarget.style, primaryBtnStyle)
                }}
              >
                {loadingSchedule ? (
                  <span className="flex items-center justify-center gap-2"><Spinner size="w-5 h-5" /> {i18n.scheduling || 'جاري الجدولة...'}</span>
                ) : isThreadMode ? `${i18n.scheduleThread || 'جدولة السلسلة'} (${threadItems.filter(i => i.text.trim()).length} ${i18n.tweetsUnit || 'تغريدات'})` : (i18n.schedulePublish || 'جدولة النشر')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewTweetModal
