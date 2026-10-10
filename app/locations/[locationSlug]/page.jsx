import { notFound } from "next/navigation";
import LocationGallery from "./LocationGallery";
import Link from "next/link";
import LocationTextReveal from "./LocationTextReveal";
import LocationCharacterReveal from "./LocationCharReveal";

const LOCATIONS = {
  allentown: {
    name: "Allentown",
    eyebrow: "FreySmiles Allentown",
    phone: "(610) 437-4748",
    directionsUrl:
  "https://www.google.com/maps/dir/?api=1&destination=1251+S+Cedar+Crest+Blvd+Suite+210+Allentown+PA&travelmode=driving",

    heroTitle: "1251 S Cedar Crest Blvd #210",
    heroCopy:
      "Our oldest location, Located across from Lehigh Valley Hospital. Equipped with iCat 3D imaging technology and multiple itero scanners for precise and convenient treatment. Private consultation rooms and an open bay clinic offer both breathy and discreet appointment experiences. Beverages always available upon request. ",

media: [
    {
    type: "video",
    src: "/videos/locations/cbctscan.mp4",

  },
  {
    type: "image",
    src: "/images/locations/all1.png",
    alt: "FreySmiles Allentown office",
  },

  {
    type: "image",
    src: "/images/locations/all2.png",
    alt: "FreySmiles Allentown treatment area",
  },

],

    introTitle: "Designed Around Better Treatment",
    introCopy:
      "Equipped with i-CAT 3D imaging technology and multiple iTero scanners for precise and convenient treatment.",

    featureOneTitle: "Technology",
    featureOneCopy:
      "Advanced imaging and digital scanning allow our doctors to diagnose and treatment plan with greater precision.",
    featureOneImage: "/images/allentown-tech.jpg",

    featureTwoTitle: "The Office",
    featureTwoCopy:
      "Private consultation rooms and an open-bay clinic provide spaces for both private conversations and comfortable treatment.",
    featureTwoImage: "/images/allentown-office.jpg",

    address: "ALLENTOWN ADDRESS",
    phone: "Call US",
  },

  bethlehem: {
    name: "Bethlehem",
    eyebrow: "FreySmiles Bethlehem",
    phone: "(610) 437-4748",
    directionsUrl:
  "https://www.google.com/maps/dir/?api=1&destination=2901+Emrick+Blvd+Suite+104+Bethlehem+PA&travelmode=driving",
    heroTitle: "2901 Emrick Blvd #104",
    heroCopy:
      "Moments away from St Luke's Anderson, Our largest and most maze-like office. With Dr. Daniel Frey as your guide, partake in the lushness of a quality Orthodontic experience. Fresh ground coffee all day and a fridge stocked for the whole family. Crush your fit bit and smile goals in our lofty club house. Stretch out in our game room but don't forget non compliance will always be met with push-up and pull-up requirements. Free wi-fi for all guests.",

media: [
  {
    type: "image",
    src: "/images/locations/beth3.png",
    alt: "FreySmiles Bethlehem office",
  },
  {
    type: "image",
    src: "/images/locations/beth2.png",
    alt: "FreySmiles Bethlehem office",
  },
  {
    type: "image",
    src: "/images/locations/beth4.png",
    alt: "FreySmiles Bethlehem treatment area",
  },

],

    introTitle: "Our Bethlehem Office",
    introCopy: "Bethlehem-specific introduction goes here.",

    featureOneTitle: "Technology",
    featureOneCopy: "Bethlehem-specific technology copy goes here.",
    featureOneImage: "/images/locations/bethlehem-tech.jpg",

    featureTwoTitle: "The Office",
    featureTwoCopy: "Bethlehem-specific office copy goes here.",
    featureTwoImage: "/images/locations/bethlehem-office.jpg",

    address: "BETHLEHEM ADDRESS",
    phone: "CALL US",
  },


  lehighton: {
    name: "Lehighton",
    eyebrow: "FreySmiles Lehighton",
    phone: "(610) 437-4748",
     directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=1080+Blakeslee+Blvd+Dr+E+Lehighton+PA+18235&travelmode=driving",

    heroTitle: "1080 Blakeslee Blvd Dr E",
    heroCopy: "Our newest location, located adjacent to Rita's Italian Ice. Equipped with 3D imaging capabilities and multiple itero scanners for the same standard of excellence. Expect modern finishings in an industry standard clinic size. Plenty of room to squash your smile goals. A brushing station that's never crowded, extra good brushing earns free italian ice during open season",
media: [
  {
    type: "image",
    src: "/images/locations/lehighton.png",
    alt: "FreySmiles lehighton office",
  },
   {
    type: "image",
    src: "/images/locations/lehighton2.png",
    alt: "FreySmiles lehighton office",
  },
],
    introTitle: "Our Lehighton Office",
    introCopy: "Lehighton-specific introduction goes here.",

    featureOneTitle: "Technology",
    featureOneCopy: "Lehighton-specific technology copy.",
    featureOneImage: "/images/locations/lehighton-tech.jpg",

    featureTwoTitle: "The Office",
    featureTwoCopy: "Lehighton-specific office copy.",
    featureTwoImage: "/images/locations/lehighton-office.jpg",

    address: "LEHIGHTON ADDRESS",
    phone: "CALL US",
  },
    schnecksville: {
    name: "Schnecksville",
    eyebrow: "FreySmiles Schnecksville",
    phone: "(610) 437-4748",
directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=4155+Independence+Drive+Schnecksville+PA&travelmode=driving",

    heroTitle: "4155 Independence Drive",
    heroCopy: "CONVENIENTLY TUCKED IN THE HIGHLANDS OF PARKLAND SCHOOL DISTRICT SINCE 2005. A stones throw from route 309, this location FEATURES an expansive light-filled CLINIC with MULTIPLE PRIVATE CONSULTATION ROOMS, AND A VIDEO GAME NOOK. Both on-deck and main reception lounge options await. Come Help feed our salt-water fish and Elevate your smile with us in Schnecksville today!",

media: [
  {
    type: "image",
    src: "/images/locations/sch.png",
    alt: "FreySmiles Schnecksville office",
  },
 {
    type: "image",
    src: "/images/locations/sch2.png",
    alt: "FreySmiles Schnecksville office",
  },

],

    introTitle: "Our Schnecksville Office",
    introCopy: "Schnecksville-specific introduction goes here.",

    featureOneTitle: "Technology",
    featureOneCopy: "Schnecksville-specific technology copy.",
    featureOneImage: "/images/locations/schnecksville-tech.jpg",

    featureTwoTitle: "The Office",
    featureTwoCopy: "Schnecksville-specific office copy.",
    featureTwoImage: "/images/locations/schnecksville-office.jpg",

    address: "SCHNECKSVILLE ADDRESS",
    phone: "CALL US",
  }

};
const LOCATION_ORDER = [
  "allentown",
  "bethlehem",
  "lehighton",
    "schnecksville",
];

export default async function LocationPage({ params }) {
  const { locationSlug } = await params
  const location = LOCATIONS[locationSlug];

  if (!location) {
    notFound();
  }
const currentIndex = LOCATION_ORDER.indexOf(locationSlug);

const previousSlug =
  LOCATION_ORDER[
    (currentIndex - 1 + LOCATION_ORDER.length) % LOCATION_ORDER.length
  ];

const nextSlug =
  LOCATION_ORDER[
    (currentIndex + 1) % LOCATION_ORDER.length
  ];
  return (
   <main className=" location-detail-page">
<Link href="/book-now" className="unicorn-search">
  <span className="unicorn-cloud-background" aria-hidden="true">
    <video autoPlay muted loop playsInline preload="metadata">
      <source src="/videos/locations/clouds.mp4" type="video/mp4" />
    </video>
  </span>

  <span className="unicorn-button-label">Book Now</span>

  <span className="input-ball-arrow" aria-hidden="true">
    ↗
  </span>
</Link>
<header className="location-detail-heading">
  <h1 className="location-detail-title">
    <LocationCharacterReveal
      key={locationSlug}
      delay={0.15}
      stagger={0.055}
      duration={0.6}
    >
      {location.name}
    </LocationCharacterReveal>
  </h1>
</header>
      <section className="location-detail-layout">

        {/* LEFT */}
        <div className="location-detail-content">

<div className="location-detail-nav">

  <div className="location-nav-blur" aria-hidden="true">
    <span className="location-nav-glow" />
  </div>


  <div className="location-nav-glow" aria-hidden="true" />

<Link
  href={`/locations/${previousSlug}`}
  replace
  className="location-detail-nav-arrow"
  aria-label={`Previous location: ${LOCATIONS[previousSlug].name}`}
>
  <span
    className="location-dot-arrow location-dot-arrow-left"
    aria-hidden="true"
  >
 {Array.from({ length: 10 }, (_, i) => (
  <span className="location-dot" key={i} />
))}
  </span>
</Link>

<span>{location.eyebrow}</span>

<Link
  href={`/locations/${nextSlug}`}
  replace
  className="location-detail-nav-arrow"
  aria-label={`Next location: ${LOCATIONS[nextSlug].name}`}
>
  <span
    className="location-dot-arrow location-dot-arrow-right"
    aria-hidden="true"
  >
   {Array.from({ length: 10 }, (_, i) => (
  <span className="location-dot" key={i} />
))}
  </span>
</Link>
</div>

          <div className="location-detail-copy">
        <h2>
    <LocationTextReveal
      key={`${locationSlug}-address`}
      delay={0.1}
    >
      {location.heroTitle}
    </LocationTextReveal>
  </h2>


            <p>
    <LocationTextReveal
      key={`${locationSlug}-description`}
      delay={0.2}
    >
      {location.heroCopy}
    </LocationTextReveal>
  </p>

<div className="location-detail-actions">
  <a
    className="location-detail-button"
    href={location.directionsUrl}
    target="_blank"
    rel="noreferrer"
  >
    <span>Get Directions</span>
    <span><svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 33 32"
  className="h-full text-current fill-current w-[0.85em] ml-[0.2em] mb-[0.2em]"
  style={{ enableBackground: "new 0 0 33 32" }}
>
  <path d="m3.3 4.7 21.1.1L0 28.6 3.5 32 28.1 8l.1 20.8 4.9-4.7L33 0H8.2L3.3 4.7z" />
</svg></span>
  </a>

<a
  className="location-detail-button"
  href="tel:+16104374748"
>
  <span>{location.phone}</span>
  <span><svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 33 32"
  className="h-full text-current fill-current w-[0.85em] ml-[0.2em] mb-[0.2em]"
  style={{ enableBackground: "new 0 0 33 32" }}
>
  <path d="m3.3 4.7 21.1.1L0 28.6 3.5 32 28.1 8l.1 20.8 4.9-4.7L33 0H8.2L3.3 4.7z" />
</svg></span>
</a>
</div>
          </div>

        </div>

        {/* RIGHT */}
        <LocationGallery
          media={location.media}
          locationName={location.name}
        />

      </section>

    </main>
  );
}