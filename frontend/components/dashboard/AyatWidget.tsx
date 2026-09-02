'use client'

import { BookOpen } from 'lucide-react'
import useSWR from 'swr'

import Skeleton from '@/components/ui/Skeleton'
import type { Ayat } from '@/lib/types'

export default function AyatWidget() {
  const { data: ayat } = useSWR<Ayat>('/ayat/today/')

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 pb-2 pt-3.5 text-muted">
        <BookOpen size={15} />
        <h3 className="widget-title">Verse of the day</h3>
      </div>

      {ayat ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p dir="rtl" lang="ar" className="text-right text-2xl leading-[2] text-text">
            {ayat.arabic}
          </p>
          <p className="border-l-2 border-accent1/30 pl-3 text-base leading-relaxed text-text2">
            {ayat.translation}
          </p>
          <p className="text-sm font-semibold text-accent1">
            QS. {ayat.surah} : {ayat.ayat}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 pb-4">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      )}
    </section>
  )
}
