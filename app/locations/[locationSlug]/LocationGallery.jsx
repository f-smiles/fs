"use client";
import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function LocationGallery({ media, locationName }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeMedia = media[activeIndex];

const touchStartX = useRef(null);
const touchStartY = useRef(null);

const handleTouchStart = (event) => {
  touchStartX.current = event.touches[0].clientX;
  touchStartY.current = event.touches[0].clientY;
};

const handleTouchEnd = (event) => {
  if (touchStartX.current === null || touchStartY.current === null) {
    return;
  }

  const deltaX = event.changedTouches[0].clientX - touchStartX.current;
  const deltaY = event.changedTouches[0].clientY - touchStartY.current;

  touchStartX.current = null;
  touchStartY.current = null;

  // Ignore vertical scrolling and small accidental gestures.
  if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return;
  }

  if (deltaX < 0) {
    // Swipe left: next image
    setActiveIndex((current) => (current + 1) % media.length);
  } else {
    // Swipe right: previous image
    setActiveIndex((current) => (current - 1 + media.length) % media.length);
  }
};

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

   
<div className="location-detail-main-image" data-mask="post"
 onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}>
  {activeMedia.type === "video" ? (
    <video
      key={activeMedia.src}
      className="location-detail-media-fade"
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
      className="location-detail-media-fade"
      src={activeMedia.src}
      alt={activeMedia.alt || ""}
    />
  )}
</div>


    </div>
    </>

  );
}