"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";

type AddToCartProps = {
  price?: number;
  image?: string;
  title?: string;
  variantName?: string;
  variantID?: number;
  productID?: number;
};

export default function AddToCart({
  price = 0,
  image = "",
  title = "Product",
  variantName = "",
  variantID = 0,
  productID = 0,
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartStore();

  const safeImage = image || "/images/fallback.png";

  const handleAdd = () => {
    if (!variantID || !productID) {
      toast.error("Unable to add product.");
      return;
    }

    toast.success(
      `Added ${title} ${variantName ? `- ${variantName}` : ""} to your cart`,
    );

    addToCart({
      id: productID,
      name: `${title}${variantName ? ` - ${variantName}` : ""}`,
      variant: { quantity, variantID },
      price,
      image: safeImage,
    });
  };

  return (
    <div className="flex gap-2 mb-4">
      <div className="mb-6">
        <div className="flex items-center justify-between w-48 h-12 px-6 border border-gray-200 bg-white">
          <button
            onClick={() => quantity > 1 && setQuantity(quantity - 1)}
            disabled={quantity <= 1}
            className="text-[12px] text-gray-500 hover:text-black transition disabled:opacity-30"
          >
            −
          </button>

          <span className="text-base font-neuehaas45 text-black">
            {quantity}
          </span>

          <button
            onClick={() => setQuantity(quantity + 1)}
            className="text-[12px] text-gray-500 hover:text-black transition"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="flex-1 h-12 bg-[#A7EEB3] text-black text-[11px] font-neuehaas45 uppercase tracking-wider hover:bg-green-300 transition"
      >
        Add to Cart
      </button>
    </div>
  );
}
