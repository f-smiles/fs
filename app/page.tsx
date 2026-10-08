import type { Metadata } from "next"
import BookNow from "@/components/book-now/book-now"

export const metadata: Metadata = {
  title: "FreySmiles | Braces & Invisalign in the Lehigh Valley",
  description: "Book an orthodontic consultation. Meet our team and consult with us - no referral needed. We treat a mix of adults and children with modern braces tech and Invisalign clear aligners. Results are on the way - this is the first step. Submit photos and meet virtually to discuss general treatment timing and expenses.",
  keywords: ["book orthodontic consultation", "orthodontic consultation", "virtual consultation", "family centric orthodontic care", "invisalign providers lehigh valley", "braces for kids", "braces for teens", "palatal expanders", "alternative to braces", "alternative to palatal expanders", "free orthodontic consultation", "top rated orthodontist", "board certified", "book now"],
}
export const dynamic = 'force-static'

export default function Home() {
  return (
    <BookNow />
  )
}
