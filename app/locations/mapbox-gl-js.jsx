'use client'
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './style.css'

export default function MapboxGLJS() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  const innerCursor = useRef(null)
  const outerCursor = useRef(null)
  const horizontalLine = useRef(null)
  const verticalLine = useRef(null)
  const showCursor = useRef(false)
  const showCrosshair = useRef(false)
  const outerCursorSpeed = useRef(0)
  const mouseX = useRef(-100)
  const mouseY = useRef(-100)

  // INIT CURSOR
  useEffect(() => {
    if (!outerCursor.current || !innerCursor.current) return

    gsap.set([innerCursor.current, outerCursor.current, horizontalLine.current, verticalLine.current], {
      x: -1000,
      y: -1000,
    })

    const revealCursor = () => {
      gsap.set(innerCursor.current, {
        x: mouseX.current,
        y: mouseY.current,
      })
      gsap.set(outerCursor.current, {
        x: mouseX.current - outerCursor.current.getBoundingClientRect().width / 2,
        y: mouseY.current - outerCursor.current.getBoundingClientRect().height / 2,
      })
      setTimeout(() => {
        outerCursorSpeed.current = 0.2
      }, 100)
      showCursor.current = true
    }
    const updateCursor = (e) => {
      mouseX.current = e.clientX
      mouseY.current = e.clientY
    }
    document.addEventListener('mousemove', revealCursor)
    document.addEventListener('mousemove', updateCursor)

    return () => {
      document.removeEventListener('mousemove', revealCursor)
      document.removeEventListener('mousemove', updateCursor)
    }
  }, [])

  // MAPBOX
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    const map = (mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: process.env.NEXT_PUBLIC_MAPBOX_MAP_STYLE,
      center: [-75.5, 40.7],
      zoom: 10,
      minZoom: 8,
      maxZoom: 14,
    }))
   
    const createMarker = (name) => {
      const el = document.createElement('div')
      const innerEl = document.createElement('div')
      innerEl.className = 'marker marker-pop'
      el.appendChild(innerEl)

      el.addEventListener('mousemove', (e) => {
        showCrosshair.current = true
        showCursor.current = false
        gsap.set(horizontalLine.current, {
          x: e.clientX,
          y: e.clientY,
          opacity: 1,
        })
        gsap.set(verticalLine.current, {
          x: e.clientX,
          y: e.clientY,
          opacity: 1,
        })
      })

      el.addEventListener('mouseleave', (e) => {
        showCrosshair.current = false
        showCursor.current = true
        gsap.set(horizontalLine.current, {
          opacity: 0,
        })
        gsap.set(verticalLine.current, {
          opacity: 0,
        })
      })

      return el
    }

    new mapboxgl
      .Marker({ element: createMarker('lehighton') })
      .setLngLat([-75.73039, 40.817605])
      .addTo(map) 
    
    new mapboxgl
      .Marker({ element: createMarker('schnecksville') })
      .setLngLat([-75.59864, 40.661055])
      .addTo(map) 
    
    new mapboxgl
      .Marker({ element: createMarker('allentown') })
      .setLngLat([-75.51711, 40.565945])
      .addTo(map)
    
    new mapboxgl
      .Marker({ element: createMarker('bethlehem') })
      .setLngLat([-75.295623, 40.66286])
      .addTo(map)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* circle cursor */}
      <div ref={innerCursor} className='circle-cursor circle-cursor--inner' />
      <div ref={outerCursor} className='circle-cursor circle-cursor--outer' />

      {/* crosshair cursor */}
      <div ref={horizontalLine} className='cursor-line cursor-line--horizontal' />
      <div ref={verticalLine} className='cursor-line cursor-line--vertical' />
    </div>
  )
}