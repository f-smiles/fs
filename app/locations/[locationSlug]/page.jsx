import { notFound } from "next/navigation";
import LocationGallery from "./LocationGallery";
import Link from "next/link";



const LOCATIONS = {
  allentown: {
    name: "Allentown",
    eyebrow: "Our Original Location",

    heroTitle: "1251 S Cedar Crest Blvd #210",
    heroCopy:
      "Our original location, Located across from Lehigh Valley Hospital. Equipped with iCat 3D imaging technology and multiple itero scanners for precise and convenient treatment. Private consultation rooms and an open bay clinic offer both breathy and discreet appointment experience. Beverages always available upon request. ",

media: [
  {
    type: "image",
    src: "/images/allentowntemp.png",
    alt: "FreySmiles Allentown office",
  },
  {
    type: "video",
    src: "/videos/cbctscan.mp4",

  },
  {
    type: "image",
    src: "/images/allentown-2.jpg",
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
    phone: "ALLENTOWN PHONE",
  },

  bethlehem: {
    name: "Bethlehem",
    eyebrow: "FreySmiles Bethlehem",

    heroTitle: "2901 Emrick Blvd #104",
    heroCopy:
      "Our most maze-like location. With Dr. Daniel Frey as your guide, you will appreciate the lushness of a quality Orthodontic experience.",

media: [
  {
    type: "image",
    src: "/images/beth1.jpeg",
    alt: "FreySmiles Bethlehem office",
  },
  {
    type: "video",
    src: "/videos/allentown-office.mp4",
    poster: "/images/allentown-video-poster.jpg",
  },
  {
    type: "image",
    src: "/images/allentown-2.jpg",
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
    phone: "BETHLEHEM PHONE",
  },


  lehighton: {
    name: "Lehighton",
    eyebrow: "FreySmiles Lehighton",

    heroTitle: "1080 Blakeslee Blvd Dr E",
    heroCopy: "Our newest location, located adjacent to Rita’s Italian Ice. Equipped with 3D imaging capabilities and multiple itero scanners for the same standard of excellence. Expect modern finishings in an industry standard clinic size. Plenty of room to squash your smile goals.",
media: [
  {
    type: "image",
    src: "/images/lehighton.png",
    alt: "FreySmiles lehighton office",
  },
  {
    type: "video",
    src: "/videos/allentown-office.mp4",
    poster: "/images/allentown-video-poster.jpg",
  },
  {
    type: "image",
    src: "/images/allentown-2.jpg",
    alt: "FreySmiles lehighton treatment area",
  },
  {
    type: "video",
    src: "/videos/allentown-treatment.mp4",
    poster: "/images/allentown-treatment-poster.jpg",
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
    phone: "LEHIGHTON PHONE",
  },
    schnecksville: {
    name: "Schnecksville",
    eyebrow: "FreySmiles Schnecksville",

    heroTitle: "4155 Independence Drive",
    heroCopy: "CONVENIENTLY TUCKED IN THE HIGHLANDS OF PARKLAND SCHOOL DISTRICT SINCE 2005. A stones throw from route 309, this location FEATURES an expansive light-filled CLINIC with MULTIPLE PRIVATE CONSULTATION ROOMS, AND A VIDEO GAME NOOK. Both on-deck and main reception lounge options await. Elevate your smile with us in Schnecksville today!",

media: [
  {
    type: "image",
    src: "/images/sch1.png",
    alt: "FreySmiles Schnecksville office",
  },
 {
    type: "image",
    src: "/images/sch2.png",
    alt: "FreySmiles Schnecksville office",
  },
  {
    type: "image",
    src: "/images/allentown-2.jpg",
    alt: "FreySmiles Schnecksville office",
  },
  {
    type: "video",
    src: "/videos/allentown-treatment.mp4",
    poster: "/images/allentown-treatment-poster.jpg",
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
    phone: "SCHNECKSVILLE PHONE",
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
   <main className="fixed location-detail-page">

      <header className="location-detail-heading">
       
        <h1 className="location-detail-title">
          {location.name}
        </h1>
      </header>

      <section className="location-detail-layout">

        {/* LEFT */}
        <div className="location-detail-content">

<div className="location-detail-nav">
  {/* Blurred glow layer */}
  <div className="location-nav-blur" aria-hidden="true">
    <span className="location-nav-glow" />
  </div>

  {/* Sharp glow layer */}
  <div className="location-nav-glow" aria-hidden="true" />

<Link
  href={`/locations/${previousSlug}`}
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
            <h2>{location.heroTitle}</h2>

            <p>{location.heroCopy}</p>

<div className="location-detail-actions">
  <a
    className="location-detail-button"
    href={location.directionsUrl}
    target="_blank"
    rel="noreferrer"
  >
    <span>Get Directions</span>
    <span>↗</span>
  </a>

  <a
    className="location-detail-button"
    href={`tel:${location.phone}`}
  >
    <span>Call Us</span>
    <span>↗</span>
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