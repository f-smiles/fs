"use server"

import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { users } from "@/server/schema"
import { stripe } from "@/lib/stripe"
import { actionClient } from "@/lib/safe-action"
import { CheckoutSessionSchema } from "@/types/checkout-session-schema"


export const createCheckoutSession = actionClient
  .schema(CheckoutSessionSchema)
  .action(async ({ parsedInput: { amount, currency, cart, pickupLocation }}) => {
    const user = await auth()
    
    // if (!user) return { error: "Please login to continue with your purchase" }
    
    if (!amount) return { error: "No items to checkout" }

    // const dbUser = await db.query.users.findFirst({
    //     where: eq(users.id, user?.user.id!)
    //   })
    // if (!dbUser) return { error: "No matching database user found" }

    let customerID: string | undefined = undefined
    
    if (user?.user.id) {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user?.user.id!)
      })
      if (!dbUser) return { error: "No matching database user found" }
      customerID = dbUser.customerID as string
    }

    const header = await headers()
    const origin = header.get("origin") as string

    const cartItems = cart.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: `${item.productName} - ${item.productVariant}`,
          images: [item.image],
          metadata: {
            productID: item.productID,
            variantID: item.variantID,
          },
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      line_items: cartItems,
      metadata: {
        pickupLocation,
      },
      payment_intent_data: {
        metadata: {
          pickupLocation,
        },
      },
      billing_address_collection: "auto",
      mode: 'payment',
      submit_type: "auto",
      allow_promotion_codes: true,
      customer: customerID,
      // customer: dbUser.customerID as string,
      payment_method_types: ['card'],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/products`,
    })

    return {
      success: {
        url: session.url,
        paymentIntentID: session.payment_intent as string,
        checkoutSessionID: session.id as string,
        // pickupLocation,
      }
    }
  })