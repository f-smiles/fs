"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import PreloaderWrapper from "./products/preloader";

export default function ShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isProductPage = pathname.startsWith("/shop/products/");


  if (isProductPage) {
    return children;
  }

  return  <PreloaderWrapper disablePreloader={false}>
    {children}
  </PreloaderWrapper>;
}