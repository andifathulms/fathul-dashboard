'use client'

import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface AssetPickerProps {
  label: string
  value: string
  onChange: (v: string) => void
  /** Preview aspect ratio hint. */
  shape?: 'square' | 'wide' | 'tall'
  hint?: string
}

/** Upload-or-paste an image asset with a live preview + clear button. */
export default function AssetPicker({ label, value, onChange, shape = 'wide', hint }: AssetPickerProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(data.url)
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  const box = shape === 'square' ? 'h-11 w-11' : shape === 'tall' ? 'h-14 w-11' : 'h-11 w-20'

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          title="Pilih file"
          className={cn(
            'group relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg',
            box
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={16} className="text-muted" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? <Loader2 size={14} className="animate-spin text-white" /> : <ImagePlus size={14} className="text-white" />}
          </span>
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/45">
              <Loader2 size={14} className="animate-spin text-white" />
            </span>
          )}
        </button>
        <input
          className="input font-mono text-[13px]"
          placeholder="https://… atau /path.png"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button type="button" onClick={() => onChange('')} className="btn btn-sm shrink-0" title="Hapus">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
      <input ref={ref} type="file" accept="image/*" onChange={onFile} className="hidden" />
    </div>
  )
}
