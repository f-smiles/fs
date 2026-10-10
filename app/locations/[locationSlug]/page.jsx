import { notFound } from "next/navigation";
import LocationGallery from "./LocationGallery";
import Link from "next/link";
import LocationTextReveal from "./LocationTextReveal";

const LOCATIONS = {
  allentown: {
    name: "Allentown",
    eyebrow: "Our Original Location",
    phone: "(610) 437-4748",
    directionsUrl:
  "https://www.google.com/maps/dir/?api=1&destination=1251+S+Cedar+Crest+Blvd+Suite+210+Allentown+PA&travelmode=driving",

    heroTitle: "1251 S Cedar Crest Blvd #210",
    heroCopy:
      "Our original location, Located across from Lehigh Valley Hospital. Equipped with iCat 3D imaging technology and multiple itero scanners for precise and convenient treatment. Private consultation rooms and an open bay clinic offer both breathy and discreet appointment experience. Beverages always available upon request. ",

media: [
    {
    type: "video",
    src: "/videos/cbctscan.mp4",

  },
  {
    type: "image",
    src: "/images/all1.png",
    alt: "FreySmiles Allentown office",
  },

  {
    type: "image",
    src: "/images/all2.png",
    alt: "FreySmiles Allentown treatment area",
  },
  {
    type: "video",
    src: "/videos/allentown-treatment.mp4",

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
      "Our most maze-like location. With Dr. Daniel Frey as your guide, you will appreciate the lushness of a quality Orthodontic experience.",

media: [
  {
    type: "image",
    src: "/images/beth3.png",
    alt: "FreySmiles Bethlehem office",
  },
  {
    type: "image",
    src: "/images/beth2.png",
    alt: "FreySmiles Bethlehem office",
  },
  {
    type: "image",
    src: "/images/beth4.png",
    alt: "FreySmiles Bethlehem treatment area",
  },
  {
    type: "video",
    src: "/videos/allentown-treatment.mp4",
    poster: "/images/allentown-treatment-poster.jpg",
  },
],

    introTitle: "Our Bethlehem Office",
    introCopy: "Bethlehem-specific introduction goes here.",

    featureOneTitle: "Technology",
    featureOneCopy: "Bethlehem-specific technology copy goes here.",
    featureOneImage: "/images/bethlehem-tech.jpg",

    featureTwoTitle: "The Office",
    featureTwoCopy: "Bethlehem-specific office copy goes here.",
    featureTwoImage: "/images/bethlehem-office.jpg",

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
    heroCopy: "Our newest location, located adjacent to Rita’s Italian Ice. Equipped with 3D imaging capabilities and multiple itero scanners for the same standard of excellence. Expect modern finishings in an industry standard clinic size. Plenty of room to squash your smile goals.",
media: [
  {
    type: "image",
    src: "/images/lehighton.png",
    alt: "FreySmiles lehighton office",
  },
   {
    type: "image",
    src: "/images/lehighton2.png",
    alt: "FreySmiles lehighton office",
  },
],
    introTitle: "Our Lehighton Office",
    introCopy: "Lehighton-specific introduction goes here.",

    featureOneTitle: "Technology",
    featureOneCopy: "Lehighton-specific technology copy.",
    featureOneImage: "/images/lehighton-tech.jpg",

    featureTwoTitle: "The Office",
    featureTwoCopy: "Lehighton-specific office copy.",
    featureTwoImage: "/images/lehighton-office.jpg",

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
    heroCopy: "CONVENIENTLY TUCKED IN THE HIGHLANDS OF PARKLAND SCHOOL DISTRICT SINCE 2005. A stones throw from route 309, this location FEATURES an expansive light-filled CLINIC with MULTIPLE PRIVATE CONSULTATION ROOMS, AND A VIDEO GAME NOOK. Both on-deck and main reception lounge options await. Elevate your smile with us in Schnecksville today!",

media: [
  {
    type: "image",
    src: "/images/sch.png",
    alt: "FreySmiles Schnecksville office",
  },
 {
    type: "image",
    src: "/images/sch2.png",
    alt: "FreySmiles Schnecksville office",
  },

],

    introTitle: "Our Schnecksville Office",
    introCopy: "Schnecksville-specific introduction goes here.",

    featureOneTitle: "Technology",
    featureOneCopy: "Schnecksville-specific technology copy.",
    featureOneImage: "/images/schnecksville-tech.jpg",

    featureTwoTitle: "The Office",
    featureTwoCopy: "Schnecksville-specific office copy.",
    featureTwoImage: "/images/schnecksville-office.jpg",

    address: "SCHNECKSVILLE ADDRESS",
    phone: "CALL US",
  }

};
const LOCATION_ORDER = [
  "allentown",
  "bethlehem",
  "schnecksville",
  "lehighton",
];

export default function LocationPage({ params }) {
  const location = LOCATIONS[params.locationSlug];

  if (!location) {
    notFound();
  }
const currentIndex = LOCATION_ORDER.indexOf(params.locationSlug);

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

      <header className="location-detail-heading">
       
     <h1 className="location-detail-title">
  <LocationTextReveal key={params.locationSlug}>
    {location.name}
  </LocationTextReveal>
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
      key={`${params.locationSlug}-address`}
      delay={0.1}
    >
      {location.heroTitle}
    </LocationTextReveal>
  </h2>


            <p>
    <LocationTextReveal
      key={`${params.locationSlug}-description`}
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