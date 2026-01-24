import Link from "next/link";
import UserButton from "@/components/auth/user-button";

export const links = [
  {
    title: "TREATMENTS",
    sublinks: ["Invisalign", "Braces", "Early  Orthodontics", "Adult Orthodontics"],
    hrefs: ["/invisalign", "/braces", "/early-orthodontics", "/adult-orthodontics"],
  },
  {
    title: "ABOUT",
    sublinks: ["Team", "Manifesto", "Testimonials", "Locations"],
    hrefs: ["/our-team", "/why-choose-us", "/testimonials", "/#locations"],
  },
  {
    title: "PATIENT",
    sublinks: [
      "Your Care",
      "Financing Treatment",
      "Caring For Your Braces",
      "Patient Portal",
    ],
    hrefs: [
      "/your-care",
      "/financing-treatment",
      "/caring-for-your-braces",
      "https://orthoblink.andisolutions.com/bLink/Login",
    ],
    component: (user) =>
      user ? (
        <UserButton user={user} />
      ) : (
        <Link href="/auth/login">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-xs font-canelathin opacity-60">5.</p>
              <h2 className="text-[16px] tracking-wide font-neuehaas45">
                Login
              </h2>
            </div>
          </div>
        </Link>
      ),
  },

  // NEW: Book
  {
    title: "BOOK",

    hrefs: ["/book-now"],
  },

  // NEW: Shop
  {
    title: "SHOP",

    hrefs: ["/shop/products"],
  },
];
