"use client";

import { usePathname } from "next/navigation";
import PreloaderWrapper from "./products/preloader";

export default function ShopLayout({ children }) {
  const pathname = usePathname();

  const isProductPage = pathname.startsWith("/shop/products/");


  if (isProductPage) {
    return children;
  }

  return <PreloaderWrapper>{children}</PreloaderWrapper>;
}