import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { fromUnixTime } from 'date-fns'
import { stripe } from '@/lib/stripe'
import { db } from '@/server/db'
import { invoices, orderItem, orders, users } from '@/server/schema'


export async function POST(request: Request) {
  let event: Stripe.Event | null = null;

  try {
    // Read the raw request body as text
    const requestText = await request.text()
    const requestBuffer = Buffer.from(requestText)
    // Retrieve the Stripe signature from the headers
    const sig = request.headers.get('stripe-signature')
    const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string
    if (!sig || !signingSecret) {
      console.error('Stripe signature is null');
      return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
    }

    event = stripe.webhooks.constructEvent(requestBuffer, sig, signingSecret)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
    }
  }

  // Handle the event
  if (event) {
    switch (event.type) {
      // charge.succeeded
      // payment_intent.succeeded
      // payment_intent.created
      // checkout.session.completed
      case 'payment_intent.succeeded':
        const retrieveOrder =  await stripe.paymentIntents.retrieve(
          event.data.object.id,
          { expand: ["latest_charge"] }
        )
        const datePaid = retrieveOrder.created
        const orderCharge = retrieveOrder.latest_charge as Stripe.Charge
        await db
          .update(invoices)
          .set({
            status: "paid",
            updated: fromUnixTime(datePaid),
            receiptURL: orderCharge.receipt_url,
            paymentIntentID: retrieveOrder.id,
          }).where(eq(invoices.paymentIntentID, event.data.object.id))
        break;

      case 'checkout.session.async_payment_failed':
        const failedSession = await stripe.checkout.sessions.retrieve(event.data.object.id as string, { expand: ["line_items", "payment_intent"] })
        await stripe.checkout.sessions.expire(failedSession.id)
        break;

      case 'checkout.session.completed':
        const completedSession = await stripe.checkout.sessions.retrieve(event.data.object.id as string, { expand: ["line_items.data.price.product", "payment_intent"] })
        const paymentIntent = completedSession.payment_intent as Stripe.PaymentIntent

        const order = await stripe.paymentIntents.retrieve(paymentIntent.id)
        const charge = await stripe.charges.retrieve(order.latest_charge as string)
        const receiptURL = charge.receipt_url

        const user = await db.query.users.findFirst({
          where: eq(users.customerID, completedSession.customer as string)
        })

        if (!user) return NextResponse.json({ error: 'Failed to find user' }, { status: 400 })

        if (completedSession.payment_status === "paid") {
          const newOrder = await db
            .insert(orders)
            .values({
              userID: user.id,
              total: completedSession.amount_total! / 100,
              status: completedSession.payment_status,
              receiptURL,
              paymentIntentID: paymentIntent.id,
              pickupLocation: completedSession?.metadata?.pickupLocation,
            }).returning()

          const orderItems = completedSession.line_items!.data.map(async(lineItem) => {
            const product = lineItem.price!.product

            if (typeof product !== 'object' || !('metadata' in product)) {
              console.log('Invalid product data:', product)
              return
            }

            const variantID = parseInt(product.metadata.variantID)
            const productID = parseInt(product.metadata.productID)

            await db
              .insert(orderItem)
              .values({
                productVariantID: variantID,
                productID: productID,
                orderID: newOrder[0].id,
                quantity: lineItem.quantity!,
              })
          })
        }
        break;

      default:
        // Unexpected event type
        console.log('Unhandled event type', event.type)
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}