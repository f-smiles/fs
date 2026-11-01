import DesktopNav from '@/components/nav/desktop-nav'
import dynamic from 'next/dynamic'
import ThemeButtons from '@/components/nav/theme-buttons'

const MobileNav = dynamic(() => import('@/components/nav/mobile-nav'), { ssr: false })

export default function Navbar({ user }) {
  return (
    <div className="relative">
      <DesktopNav user={user} />
      {/* <MobileNav user={user} /> */}
      {/* <ThemeButtons /> */}
    </div>
  )
}