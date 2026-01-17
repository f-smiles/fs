'use client'
import React from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'

export default function ReactMapGl() {  
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        longitude: -75.5,
        latitude: 40.7,
        zoom: 10,
      }}
      style={{
        width: '100dvw',
        height: '100dvh',
      }}
      mapStyle={process.env.NEXT_PUBLIC_MAPBOX_MAP_STYLE}
    >
      <Marker 
        longitude={-75.73039}
        latitude={40.817605}
        style={{ backgroundColor: "#000", width: "24px", height: "24px" }}
        anchor='bottom'
      />
      <Marker 
        longitude={-75.59864}
        latitude={40.661055}
        style={{ backgroundColor: "#000", width: "24px", height: "24px" }}
        anchor='bottom'
      />
      <Marker 
        longitude={-75.51711}
        latitude={40.565945}
        style={{ backgroundColor: "#000", width: "24px", height: "24px" }}
        anchor='bottom'
      />
      <Marker 
        longitude={-75.295623}
        latitude={40.66286}
        style={{ backgroundColor: "#000", width: "24px", height: "24px" }}
        anchor='bottom'
      />
    </Map>
  )
}