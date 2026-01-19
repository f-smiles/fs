'use client'
import { useCartStore } from "@/lib/cart-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


export default function PickupLocation() {

  const { setCheckoutProgress, pickupLocation, setPickupLocation } = useCartStore()

  const locations = [
    { label: "Allentown", value: "Allentown", addressLine1: "1251 S Cedar Crest Blvd Suite 210", addressLine2: "Allentown, PA 18103" },
    { label: "Bethlehem", value: "Bethlehem", addressLine1: "2901 Emrick Boulevard", addressLine2: "Bethlehem, PA 18020" },
    { label: "Schnecksville", value: "Schnecksville", addressLine1: "4155 Independence Drive", addressLine2: "Schnecksville, PA 18078" },
    { label: "Lehighton", value: "Lehighton", addressLine1: "1080 Blakeslee Blvd Dr E", addressLine2: "Lehighton, PA 18235" },
  ]

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col items-center w-full mt-4 space-y-6">
        <RadioGroup
          defaultValue={pickupLocation}
          value={pickupLocation}
          onValueChange={setPickupLocation}
          className="w-full mx-auto max-w-max"
        >
          {locations.map((item) => (
            <div key={item.value} className={cn(
              pickupLocation === item.value ? "border border-primary" : "",
              "pl-4 pr-8 py-4 rounded-lg transition-all duration-300 ease-linear text-zinc-900 dark:text-zinc-50  hover:cursor-pointer"
            )}>
              <span className="flex items-center space-x-2">
                <RadioGroupItem value={item.value} id={item.value} />
                <Label htmlFor={item.label}>
                  <p>{item.label}</p>
                </Label>
              </span>
              <div className="ml-6">
                <p>{item.addressLine1}</p>
                <p>{item.addressLine2}</p>
              </div>
            </div>
          ))}
        </RadioGroup>

        <Button onClick={() => setCheckoutProgress("cart-summary")} disabled={pickupLocation === ""} className="w-full max-w-md">
          Continue
        </Button>
      </div>
    </div>
  )
}