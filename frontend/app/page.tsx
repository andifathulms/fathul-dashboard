import AyatWidget from '@/components/dashboard/AyatWidget'
import DailyLogWidget from '@/components/dashboard/DailyLogWidget'
import DhikrCounter from '@/components/dashboard/DhikrCounter'
import IbadahWidget from '@/components/dashboard/IbadahWidget'
import ProjectsWidget from '@/components/dashboard/ProjectsWidget'
import QuickAccessWidget from '@/components/dashboard/QuickAccessWidget'
import ServerStatusWidget from '@/components/dashboard/ServerStatusWidget'
import TodayBand from '@/components/dashboard/TodayBand'

/** Bento, not three equal columns: the log is the widest object, the reference
 *  widgets sit in the narrowest. DESIGN.md §9. */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <TodayBand />

      <div className="stagger-in grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-5">
          <DailyLogWidget />
          <AyatWidget />
        </div>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <ProjectsWidget />
          <ServerStatusWidget />
          <IbadahWidget />
        </div>

        <div className="flex flex-col gap-4 xl:col-span-3">
          <QuickAccessWidget />
          <DhikrCounter />
        </div>
      </div>
    </div>
  )
}
