'use client'

import Image from "next/image"
import { useMemo } from "react"
import { createId } from "@paralleldrive/cuid2"
import { AnimatePresence, motion } from "framer-motion"
import { useCartStore } from "@/lib/cart-store"
import { formatPrice } from "@/lib/format-price"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "../ui/button"
import { MinusCircleIcon, PlusCircleIcon } from "lucide-react"


export default function CartItems() {
  const { cart, addToCart, removeFromCart, setCheckoutProgress } = useCartStore()

  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      return acc + item.price * item.variant.quantity
    }, 0)
  }, [cart])

  const animateTotal = useMemo(() => {
    return [...total.toFixed(2).toString()].map((letter) => {
      return { letter, id: createId() }
    })
  }, [total])

  return (
    <div className="flex flex-col items-center w-full">
      {cart.length === 0 && (
        <>
          <motion.figure className="text-center"
            initial={{ y: -12 }}
            animate={{ y: [12, 0, -12], rotate: [-2, 0, 2], rotateX: [-12, 0, 12] }}
            transition={{
              delay: 0.3,
              duration: 1.25,
              repeat: Infinity,
              repeatType: "mirror"
            }}
          >
            <Image src="/images/shop/Empty_cart.png" alt="Empty cart" width={720} height={1280} className="h-auto w-80 md:w-96" priority />
          </motion.figure>
          <p className="mb-6">Cart is empty</p>
        </>
      )}

      {cart.length > 0 && (
        <>
          <Table>
            <TableCaption>
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Image</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((item) => (
                <TableRow key={(item.id + item.variant.variantID).toString()} className="text-zinc-900 dark:text-zinc-50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <figure className="flex justify-center">
                      <Image src={item.image} alt={item.name} width={128} height={128} className="w-16 h-16 rounded-sm" priority />
                    </figure>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-between">
                      <MinusCircleIcon
                        onClick={() => removeFromCart({
                          ...item,
                          variant: { quantity: 1, variantID: item.variant.variantID },
                        })}
                        className="w-4 h-4"
                      />
                      {item.variant.quantity}
                      <PlusCircleIcon
                        onClick={() => addToCart({
                          ...item,
                          variant: { quantity: 1, variantID: item.variant.variantID },
                        })}
                        className="w-4 h-4"
                      />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <motion.div className="relative flex items-center justify-center overflow-hidden">
            <span className="text-md">Total: $</span>
            <AnimatePresence mode="popLayout">
              {animateTotal.map((letter, i) => (
                <motion.div key={letter.id}>
                  <motion.span
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    exit={{ y: -20 }}
                    transition={{ delay: i * 0.1, duration: 0.25 }}
                    className="inline-block text-md"
                  >
                    {letter.letter}
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          <p className="mt-2 mb-6 text-sm">*Sales tax will be calculated during checkout where applicable</p>
          <Button
            onClick={() => setCheckoutProgress("pickup-location")}
            disabled={cart.length === 0}
            className="w-full max-w-md"
          >
            Continue
          </Button>
        </>
      )}
    </div>
  )
}