'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { getProduct } from "@/server/actions/get-product"
import { ProductSchema } from "@/types/product-schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DollarSignIcon } from "lucide-react"
import Tiptap from "@/components/dashboard/tiptap"
import { useAction } from "next-safe-action/hooks"
import { editProduct } from "@/server/actions/edit-product"


export default function EditProductForm() {

  const productId = useSearchParams().get('id')

  const router = useRouter()

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
    },
    mode: "onChange",
  })

  const setFormValuesToProduct = async (id: number) => {
    const data = await getProduct(id)
    if (data.error) {
      toast.error(data.error)
      router.push("/dashboard/products")
    }
    if (data.success) {
      form.setValue("title", data.success.title)
      form.setValue("description", data.success.description)
      form.setValue("price", data.success.price)
      form.setValue("id", parseInt(productId!))
    }
  }

  useEffect(() => {
    if (productId) setFormValuesToProduct(parseInt(productId))
  }, [])

  const { execute, status } = useAction(editProduct, {
    onSuccess({ data }) {
      if (data?.error) toast.error(data.error)
      if (data?.success) {
        router.push("/dashboard/products")
        toast.success(data.success)
      }
		},
    onError(error) {
      console.error(error)
    },
  })

  const onSubmit = (values: z.infer<typeof ProductSchema>) => {
    execute(values)
  }

  return (
    <Card>
    <CardHeader>
      <CardTitle>Edit Product</CardTitle>
      <CardDescription>Update product details</CardDescription>
    </CardHeader>
    <CardContent>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Description</FormLabel>
                <FormControl>
                  <Tiptap value={field.value}  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Price</FormLabel>
                <FormControl>
                  <span className="flex items-center gap-2">
                    <DollarSignIcon className="w-8 h-10 p-[6px] bg-muted rounded-md" />
                    <Input className="w-max" type="number" step="0.01" min={0} {...field} />
                  </span>
                </FormControl>
                <FormDescription>Price in USD</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
<FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full lg:w-max"
            disabled={status === 'executing' || !form.formState.isValid || !form.formState.isDirty}
          >
            Save Changes
          </Button>
        </form>
      </Form>

    </CardContent>
  </Card>
  )
}