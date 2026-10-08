'use client'

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"

import { ProductSchema } from "@/types/product-schema"
import { createProduct } from "@/server/actions/create-product"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Tiptap from "@/components/dashboard/tiptap"


export default function ProductForm() {

  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
    },
    mode: "onChange",
  })

  const { execute, status } = useAction(createProduct, {
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
        <CardTitle>Create Product</CardTitle>
        <CardDescription>Enter details of your product.</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Tiptap value={field.value} />
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
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      onFocus={() => {
                        if (field.value === 0) field.onChange("")
                      }}
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-max"
                      {...field}
                    />
                  </FormControl>
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
                    <Input {...field} />
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
              Create product
            </Button>
          </form>
        </Form>
      </CardContent>

    </Card>
  )
}
