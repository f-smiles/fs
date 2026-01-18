import type { Metadata } from "next"
import BookNow from "./book-now"

export const metadata: Metadata = {
  title: "FreySmiles | Book Now",
}
export const dynamic = 'force-static'

export default function Home() {
  return (
    <BookNow />
  )
}
