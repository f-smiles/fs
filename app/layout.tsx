import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import "@/public/styles/uploadthing.css";
import App from "./app";

export const metadata: Metadata = {
  title: {
    template: "%s | FreySmiles",
    default: "FreySmiles Orthodontics",
  },
  description: "At FreySmiles Orthodontics, we treat a mix of adults and children with modern braces technology and Invisalign clear aligners, so you see results immediately. We serve 4 locations in the Lehigh Valley: Allentown, Bethlehem, Lehighton, and Schnecksville. Book Now - no referral needed.",
  keywords: ["orthodontics allentown", "orthodontics bethlehem", "orthodontics schnecksville", "orthodontics lehighton", "family centric orthodontic care", "invisalign providers lehigh valley", "braces for kids", "braces for teens", "palatal expanders", "alternative to braces", "alternative to palatal expanders", "free orthodontic consultation", "top rated orthodontist", "board certified"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {  
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="./icon.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <App>
          {children}
        </App>
      </body>
    </html>
  );
}
