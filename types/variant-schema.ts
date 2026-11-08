import { z } from "zod"

export const VariantSchema = z.object({
  id: z.number().optional(),
  productID: z.number(),
  editMode: z.boolean(),
  variantName: z.string().min(3, { error: "Product type must be at least 3 characters long" }),
  color: z.string().min(3, { error: "Product color must be at least 3 characters long" }),
  tags: z.array(z.string().min(1, { error: "Please provide at least one tag" })),
  variantImages: z.array(z.object({
    id: z.number().optional(),
    key: z.string().optional(),
    url: z.string().refine((url) => url.search("blob:") !== 0, { error: "Please wait for the image to finish uploading" }),
    size: z.number(),
    name: z.string(),
  })).min(1, { error: "Please provide at least one image" }),
})