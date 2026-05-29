import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import SettingsSheet from '@/components/layout/SettingsSheet'
import TripDetailSheet from '@/components/viajes/TripDetailSheet'
import Toast from '@/components/ui/Toast'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-shell">
      <TopBar />
      <BottomNav />
      <main className="page-content" id="main-content">
        {children}
      </main>
      <SettingsSheet />
      <TripDetailSheet />
      <Toast />
    </div>
  )
}
