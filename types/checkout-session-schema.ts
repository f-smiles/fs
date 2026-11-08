import { z } from "zod"

export const CheckoutSessionSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  cart: z.array(
    z.object({
      productID: z.number(),
      variantID: z.number(),
      quantity: z.number(),
      productName: z.string(),
      productVariant: z.string(),
      price: z.number(),
      image: z.string(),
    }),
  ),
  pickupLocation: z.string(),
})