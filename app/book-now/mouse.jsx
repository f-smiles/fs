import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const lerp = (a, b, n) => (1 - n) * a + n * b;
const getMouseDistance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const getPointerPos = (e) => ({ x: e.pageX, y: e.pageY });

export default function MouseTrail({ images = [], enabled = true }) {
  const containerRef = useRef(null);
  const imageRefs = useRef([]);

  const mousePos = useRef({ x: 0, y: 0 });
  const cacheMousePos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const zIndex = useRef(1);
  const imgIndex = useRef(0);
  const isIdle = useRef(true);
  const activeCount = useRef(0);
  const threshold = 80;

  useEffect(() => {
 const handleMove = (e) => {
      if (!enabled) return; // ignore all motion if disabled
      mousePos.current = getPointerPos(e);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);

   const update = () => {
      // Skip updating if disabled (but keep rAF alive)
      if (!enabled) {
        requestAnimationFrame(update);
        return;
      }

      // Normal behavior when active
      const dist = getMouseDistance(mousePos.current, lastMousePos.current);
      cacheMousePos.current.x = lerp(cacheMousePos.current.x, mousePos.current.x, 0.1);
      cacheMousePos.current.y = lerp(cacheMousePos.current.y, mousePos.current.y, 0.1);

      if (dist > threshold) {
        showNextImage();
        lastMousePos.current = { ...mousePos.current };
      }

      if (isIdle.current && zIndex.current !== 1) zIndex.current = 1;

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [images, enabled]);

  

  const showNextImage = () => {
    if (!imageRefs.current.length) return;

    const img = imageRefs.current[imgIndex.current];
    const rect = img.getBoundingClientRect();
    zIndex.current++;

    gsap.killTweensOf(img);
    gsap.timeline({
      onStart: () => (activeCount.current++, (isIdle.current = false)),
      onComplete: () => {
        if (--activeCount.current === 0) isIdle.current = true;
      },
    })
      .set(img, {
        opacity: 1,
        scale: 0,
        zIndex: zIndex.current,
        x: cacheMousePos.current.x - rect.width / 2,
        y: cacheMousePos.current.y - rect.height / 2,
        position: 'absolute',
      })
      .to(img, {
        duration: 0.4,
        ease: 'power1',
        scale: 1,
        x: mousePos.current.x - rect.width / 2,
        y: mousePos.current.y - rect.height / 2,
      }, 0)
      .to(img.querySelector('div'), {
        duration: 0.4,
        ease: 'power1',
        scale: 1,
        filter: 'brightness(100%)',
      }, 0)
      .to(img, {
        duration: 0.4,
        ease: 'power2',
        opacity: 0,
        scale: 0.2,
      }, 0.45);

      imgIndex.current = Math.floor(Math.random() * imageRefs.current.length);

  };

  return (
    <div ref={containerRef} className="pointer-events-none fixed top-0 left-0 w-full h-full z-50">
      {images.map((src, idx) => (
      <div
      key={idx}
      ref={(el) => (imageRefs.current[idx] = el)}
      style={{
        opacity: 0,
        pointerEvents: 'none',
        position: 'absolute',
      }}
    >
      <img
        src={src}
        style={{
          maxWidth: '80px',
          height: 'auto',
          display: 'block',
        }}
        alt=""
      />
    </div>
    
      ))}
    </div>
  );
}
