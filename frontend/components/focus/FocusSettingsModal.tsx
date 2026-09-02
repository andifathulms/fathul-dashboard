'use client'

import { useEffect, useState } from 'react'

import { useFocus } from '@/components/focus/FocusProvider'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { FocusSettings } from '@/lib/types'

const NUMBERS: { key: keyof FocusSettings; label: string; hint: string }[] = [
  { key: 'focus_min', label: 'Focus', hint: 'Minutes' },
  { key: 'short_break_min', label: 'Short break', hint: 'Minutes' },
  { key: 'long_break_min', label: 'Long break', hint: 'Minutes' },
  { key: 'long_break_every', label: 'Long break every', hint: 'Sessions' },
  { key: 'daily_target_sessions', label: 'Daily target', hint: 'Sessions' },
]

const TOGGLES: { key: keyof FocusSettings; label: string; hint: string }[] = [
  { key: 'auto_start_breaks', label: 'Start breaks automatically', hint: 'The break begins the moment focus ends.' },
  { key: 'sound_enabled', label: 'Chime when a session ends', hint: 'A short two-tone bell.' },
  { key: 'pause_for_prayer', label: 'Fit sessions around prayer', hint: 'Offer a shorter session when the adzan lands inside it.' },
]

export default function FocusSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saveSettings } = useFocus()
  const [draft, setDraft] = useState<Partial<FocusSettings>>({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (open && settings) setDraft(settings)
  }, [open, settings])

  const save = async () => {
    setSaving(true)
    try {
      await saveSettings(draft)
      toast.success('Timer settings saved', 'Focus')
      onClose()
    } catch (e) {
      toast.error((e as Error).message, "Couldn't save the settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Timer settings"
      subtitle="Durations apply to the next session you start."
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-accent" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {NUMBERS.map(({ key, label, hint }) => (
          <div key={key}>
            <label className="field-label" htmlFor={`focus-${key}`}>
              {label}
            </label>
            <input
              id={`focus-${key}`}
              type="number"
              min={1}
              max={180}
              className="input tnum"
              value={(draft[key] as number) ?? ''}
              onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
            />
            <p className="mt-1 text-sm text-muted">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
        {TOGGLES.map(({ key, label, hint }) => (
          <label key={key} className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-accent1"
              checked={Boolean(draft[key])}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
            />
            <span className="min-w-0">
              <span className="block text-base font-medium">{label}</span>
              <span className="block text-sm text-muted">{hint}</span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  )
}
