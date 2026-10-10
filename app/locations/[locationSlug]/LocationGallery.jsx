"use client";
import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function LocationGallery({ media, locationName }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeMedia = media[activeIndex];

  return (
    <>

        <div className="location-detail-gallery">

      <div className="location-detail-thumbnails">
        {media.map((item, index) => (
          <button
            type="button"
            className={`location-detail-thumbnail ${
              index === activeIndex ? "is-active" : ""
            }`}
            key={item.src}
            onClick={() => setActiveIndex(index)}
            aria-label={`View ${locationName} media ${index + 1}`}
          >

{item.type === "video" ? (
  <video
    src={`${item.src}#t=0.1`}
    poster={item.poster}
    muted
    playsInline
    preload="auto"
    className="w-full h-full object-cover"
  />
) : (
  <img
    src={item.src}
    alt=""
  />
)}

          </button>
        ))}
      </div>

      <div className="location-detail-main-image" data-mask="post">
        {activeMedia.type === "video" ? (
          <video
            key={activeMedia.src}
            src={activeMedia.src}
            poster={activeMedia.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            key={activeMedia.src}
            src={activeMedia.src}
            alt={activeMedia.alt || ""}
          />
        )}
      </div>

    </div>
    </>

  );
}