'use client'

import { BookOpen } from 'lucide-react'
import useSWR from 'swr'

import type { Ayat } from '@/lib/types'

export default function AyatWidget() {
  const { data: ayat } = useSWR<Ayat>('/ayat/today/')

  return (
    <section className="card relative overflow-hidden bg-gradient-to-br from-surface to-accent1/5 p-5">
      <div className="mb-3 flex items-center gap-2 text-muted">
        <BookOpen size={15} />
        <h3 className="widget-title">Ayat Hari Ini</h3>
      </div>
      {ayat ? (
        <div className="space-y-3">
          <p dir="rtl" className="text-right text-2xl leading-loose text-text" lang="ar">
            {ayat.arabic}
          </p>
          <p className="text-sm italic leading-relaxed text-muted">“{ayat.translation}”</p>
          <p className="text-xs font-medium text-accent1">
            QS. {ayat.surah} : {ayat.ayat}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">Memuat ayat…</p>
      )}
    </section>
  )
}
