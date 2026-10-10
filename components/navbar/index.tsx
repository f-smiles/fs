"use client"
import { usePathname } from 'next/navigation'
import Logo from '@/components/logo/logo'
import CartComponent from '../cart/cart-component'

export const Navbar = () => {
  let pathname = usePathname()

  return (
    <>
      {pathname === "/" ? null : (
        <>
          <nav className="fixed top-8 left-5 right-5 z-[900] flex justify-between items-center">
            <a href="/" className="">
              <Logo className="fill-zinc-800 h-6 xl:h-7" />
            </a>
            <CartComponent />
          </nav>
        </>
      )}
    </>
  )
}