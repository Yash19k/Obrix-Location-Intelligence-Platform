import React, { useMemo } from 'react'
import { Globe3D } from '@/components/ui/3d-globe'

// Markers: Global avatar/location nodes as in the reference Aceternity demo
const heroGlobeMarkers = [
  {
    lat: 23.0225,
    lng: 72.5714,
    src: 'https://assets.aceternity.com/avatars/6.webp',
    label: 'Ahmedabad',
  },
  {
    lat: 40.7128,
    lng: -74.006,
    src: 'https://assets.aceternity.com/avatars/1.webp',
    label: 'New York',
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    src: 'https://assets.aceternity.com/avatars/2.webp',
    label: 'London',
  },
  {
    lat: 35.6762,
    lng: 139.6503,
    src: 'https://assets.aceternity.com/avatars/3.webp',
    label: 'Tokyo',
  },
  {
    lat: 25.2048,
    lng: 55.2708,
    src: 'https://assets.aceternity.com/avatars/10.webp',
    label: 'Dubai',
  },
  {
    lat: 1.3521,
    lng: 103.8198,
    src: 'https://assets.aceternity.com/avatars/12.webp',
    label: 'Singapore',
  },
  {
    lat: -33.8688,
    lng: 151.2093,
    src: 'https://assets.aceternity.com/avatars/4.webp',
    label: 'Sydney',
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    src: 'https://assets.aceternity.com/avatars/5.webp',
    label: 'Paris',
  },
]

export default function HeroGlobeVisualization() {
  const globeConfig = useMemo(
    () => ({
      radius: 2,
      showAtmosphere: false,
      bumpScale: 1.2,
      autoRotateSpeed: 0.3,
      enableZoom: true,
      enablePan: false,
      minDistance: 3.8,
      maxDistance: 10,
      showWireframe: false,
      ambientIntensity: 0.95,
      pointLightIntensity: 1.7,
      backgroundColor: null, // transparent to blend with Obrix grid
    }),
    []
  )

  return (
    <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center select-none">
      <Globe3D
        markers={heroGlobeMarkers}
        config={globeConfig}
        className="w-full h-[360px] sm:h-[460px] lg:h-[560px]"
      />
    </div>
  )
}
