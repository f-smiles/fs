'use client'

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCartStore } from "@/lib/cart-store"
import { formatPrice } from "@/lib/format-price"
import { createCheckoutSession } from "@/server/actions/create-checkout-session"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"


export default function CartSummary() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const router = useRouter()

  const { cart, pickupLocation, setCartOpen } = useCartStore()

  const total = cart.reduce((acc, item) => {
    return acc + item.price * item.variant.quantity
  }, 0)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    // create Stripe CheckoutSession
    const result = await createCheckoutSession({
      amount: total * 100,
      currency: "usd",
      cart: cart.map((item) => ({
        productID: item.id,
        variantID: item.variant.variantID,
        quantity: item.variant.quantity,
        title: item.name,
        price: item.price * 100,
        image: item.image,
      })),
      pickupLocation,
    })
    if (result?.data?.error) {
      setErrorMessage(result.data.error)
      setLoading(false)
      setCartOpen(false)
      toast.error(result.data.error)
      router.push("/auth/login")
    }
    if (result?.data?.success) {
      setLoading(false)
      router.push(result.data.success.url as string)
    }
  }


  return (
    <div className="flex flex-col items-center w-full">
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full gap-8">
        <Table>
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
                <TableCell className="text-center">
                  {item.variant.quantity}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div>
          <p className="font-semibold">Pickup Location:</p>
          {pickupLocation === "Allentown" && (
            <div className="">
              <p>Allentown</p>
              <span>
                <p>1251 S Cedar Crest Blvd Suite 210</p>
                <p>Allentown, PA 18103</p>
              </span>
            </div>
          )}
          {pickupLocation === "Bethlehem" && (
            <div className="">
              <p>Bethlehem</p>
              <span>
                <p>2901 Emrick Boulevard</p>
                <p>Bethlehem, PA 18020</p>
              </span>
            </div>
          )}
          {pickupLocation === "Schnecksville" && (
            <div className="">
              <p>Schnecksville</p>
              <span>
                <p>4155 Independence Drive</p>
                <p>Schnecksville, PA 18078</p>
              </span>
            </div>
          )}
          {pickupLocation === "Lehighton" && (
            <div className="">
              <p>Lehighton</p>
              <span>
                <p>1080 Blakeslee Blvd Dr E</p>
                <p>Lehighton, PA 18235</p>
              </span>
            </div>
          )}
        </div>

        <Button disabled={loading} className="w-full max-w-md">
          {loading ? (
            <span className="inline-flex items-center">
              <svg className="w-5 h-5 mr-3 -ml-1 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Redirecting to Stripe...</p>
            </span>
          ) : <p>Checkout</p>}
        </Button>
      </form>
    </div>
  )
}