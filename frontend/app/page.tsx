import AyatWidget from '@/components/dashboard/AyatWidget'
import DailyLogWidget from '@/components/dashboard/DailyLogWidget'
import DhikrCounter from '@/components/dashboard/DhikrCounter'
import IbadahWidget from '@/components/dashboard/IbadahWidget'
import PrayerBar from '@/components/dashboard/PrayerBar'
import ProjectsWidget from '@/components/dashboard/ProjectsWidget'
import QuickAccessWidget from '@/components/dashboard/QuickAccessWidget'
import ServerStatusWidget from '@/components/dashboard/ServerStatusWidget'

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <PrayerBar />

      {/* 3-column grid */}
      <div className="stagger-in grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left */}
        <div className="space-y-5">
          <ProjectsWidget />
          <ServerStatusWidget />
        </div>

        {/* Center */}
        <div>
          <DailyLogWidget />
        </div>

        {/* Right */}
        <div>
          <QuickAccessWidget />
        </div>
      </div>

      {/* Bottom: Islamic corner */}
      <div className="stagger-in grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <AyatWidget />
          <IbadahWidget />
        </div>
        <DhikrCounter />
      </div>
    </div>
  )
}
