'use client'

import { AnimatePresence, motion } from "framer-motion"
import { ShoppingBagIcon } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import CartHeader from "./cart-header"
import CartItems from "./cart-items"
import CartProgress from "./cart-progress"
import PickupLocation from "./pickup-location"
import CartSummary from "./cart-summary"

interface CartComponentProps {
  isScrolled: boolean;
}

export default function CartComponent({ isScrolled }: CartComponentProps) {
  const { cart, checkoutProgress, cartOpen, setCartOpen } = useCartStore()

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetTrigger>
        <div className="relative mx-4">
    <AnimatePresence>
  {cart.length > 0 && (
    <motion.span
      key="cart-badge"
      animate={{ scale: 1, opacity: 1 }}
      initial={{ opacity: 0, scale: 0 }}
      exit={{ scale: 0 }}
      className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-2 -right-3 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
    >
      {cart.length}
    </motion.span>
  )}

  <motion.div
    key="cart-icon"
    className="transition-colors duration-300"
    animate={{ color: isScrolled ? "#000" : "#fff" }}
  >
    <ShoppingBagIcon className="w-6 h-6 text-zinc-900 dark:text-zinc-50" strokeWidth={1.5} />
  </motion.div>
</AnimatePresence>
        </div>
      </SheetTrigger>

      <SheetContent
        className={`w-[400px] sm:w-[640px] md:w-[768px] flex flex-col transition-all duration-1000 ${
          isScrolled ? "text-black" : "text-white"
        }`}
      >
        <SheetHeader>
          <CartHeader />
        </SheetHeader>

        {cart.length > 0 && <CartProgress />}

        <ScrollArea>
          {checkoutProgress === "cart-page" && <CartItems />}
          {checkoutProgress === "pickup-location" && <PickupLocation />}
          {checkoutProgress === "cart-summary" && <CartSummary />}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
