import React, { useRef, useMemo, useState, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

// ============================================================================
// Constants - Earth Texture URLs (NASA Blue Marble)
// ============================================================================
export const DEFAULT_EARTH_TEXTURE =
  'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'
export const DEFAULT_BUMP_TEXTURE =
  'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert latitude/longitude to 3D Cartesian coordinates
 */
export function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

// ============================================================================
// Marker Component (Original Aceternity Avatar Pins with Occlusion Check)
// ============================================================================

function Marker({ marker, radius, defaultSize = 0.06, onClick, onHover }) {
  const [hovered, setHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const groupRef = useRef(null)
  const imageGroupRef = useRef(null)
  const { camera } = useThree()

  // Surface position (where the line starts)
  const surfacePosition = useMemo(() => {
    return latLngToVector3(marker.lat, marker.lng, radius * 1.001)
  }, [marker.lat, marker.lng, radius])

  // Top position (where the avatar sits)
  const topPosition = useMemo(() => {
    return latLngToVector3(marker.lat, marker.lng, radius * 1.16)
  }, [marker.lat, marker.lng, radius])

  const lineHeight = useMemo(() => {
    return topPosition.distanceTo(surfacePosition)
  }, [topPosition, surfacePosition])

  // Occlusion check: hide markers when facing away from camera
  useFrame(() => {
    if (!imageGroupRef.current) return

    const worldPos = new THREE.Vector3()
    imageGroupRef.current.getWorldPosition(worldPos)

    const markerDirection = worldPos.clone().normalize()
    const cameraDirection = camera.position.clone().normalize()
    const dot = markerDirection.dot(cameraDirection)

    setIsVisible(dot > 0.1)
  })

  const handlePointerEnter = useCallback(() => {
    setHovered(true)
    onHover?.(marker)
  }, [marker, onHover])

  const handlePointerLeave = useCallback(() => {
    setHovered(false)
    onHover?.(null)
  }, [onHover])

  const handleClick = useCallback(() => {
    onClick?.(marker)
  }, [marker, onClick])

  // Calculate line orientation
  const { lineCenter, lineQuaternion } = useMemo(() => {
    const center = surfacePosition.clone().lerp(topPosition, 0.5)
    const direction = topPosition.clone().sub(surfacePosition).normalize()
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    return { lineCenter: center, lineQuaternion: quaternion }
  }, [surfacePosition, topPosition])

  return (
    <group ref={groupRef} visible={isVisible}>
      {/* Pin line from surface to image */}
      <mesh position={lineCenter} quaternion={lineQuaternion}>
        <cylinderGeometry args={[0.003, 0.003, lineHeight, 8]} />
        <meshBasicMaterial
          color={hovered ? '#ffffff' : '#94a3b8'}
          transparent
          opacity={hovered ? 0.9 : 0.6}
        />
      </mesh>

      {/* Pin point at the surface */}
      <mesh position={surfacePosition} quaternion={lineQuaternion}>
        <coneGeometry args={[0.015, 0.04, 8]} />
        <meshBasicMaterial color={hovered ? '#f97316' : '#ef4444'} />
      </mesh>

      {/* Circular avatar at the top */}
      <group ref={imageGroupRef} position={topPosition}>
        <Html
          transform
          center
          sprite
          distanceFactor={10}
          style={{
            pointerEvents: isVisible ? 'auto' : 'none',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.15s ease-out',
          }}
        >
          <div
            className={cn(
              'cursor-pointer overflow-hidden rounded-full bg-neutral-900 shadow-lg transition-transform duration-200',
              hovered && 'scale-125 shadow-xl ring-1 ring-white/50'
            )}
            style={{
              width: '10px',
              height: '10px',
            }}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            onClick={handleClick}
          >
            {marker.src ? (
              <img
                src={marker.src}
                alt={marker.label || 'Marker'}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-[#315CF5]" />
            )}
          </div>
        </Html>
      </group>
    </group>
  )
}

// ============================================================================
// Rotating Globe with Markers
// ============================================================================

function RotatingGlobe({ config, markers, onMarkerClick, onMarkerHover }) {
  const groupRef = useRef(null)

  // Load Earth texture & elevation bump map
  const [earthTexture, bumpTexture] = useTexture([
    config.textureUrl,
    config.bumpMapUrl,
  ])

  // Optimize texture rendering & anisotropic filtering
  useMemo(() => {
    if (earthTexture) {
      earthTexture.colorSpace = THREE.SRGBColorSpace
      earthTexture.anisotropy = 16
    }
    if (bumpTexture) {
      bumpTexture.anisotropy = 8
    }
  }, [earthTexture, bumpTexture])

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(config.radius, 64, 64)
  }, [config.radius])

  const wireframeGeometry = useMemo(() => {
    return new THREE.SphereGeometry(config.radius * 1.002, 32, 16)
  }, [config.radius])

  return (
    <group ref={groupRef}>
      {/* Base Earth Sphere */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={config.bumpScale * 0.05}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Optional wireframe */}
      {config.showWireframe && (
        <mesh geometry={wireframeGeometry}>
          <meshBasicMaterial
            color={config.wireframeColor}
            wireframe
            transparent
            opacity={0.06}
          />
        </mesh>
      )}

      {/* Markers */}
      {markers.map((marker, index) => (
        <Marker
          key={`marker-${index}-${marker.lat}-${marker.lng}`}
          marker={marker}
          radius={config.radius}
          defaultSize={config.markerSize}
          onClick={onMarkerClick}
          onHover={onMarkerHover}
        />
      ))}
    </group>
  )
}

// ============================================================================
// Subtle Atmospheric Rim Shader (Optional / Natural)
// ============================================================================

function Atmosphere({ radius, color, intensity, blur }) {
  const fresnelPower = Math.max(1.5, 6.0 - blur)

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: new THREE.Color(color) },
        intensity: { value: intensity },
        fresnelPower: { value: fresnelPower },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform float intensity;
        uniform float fresnelPower;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), fresnelPower);
          gl_FragColor = vec4(atmosphereColor, fresnel * intensity);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
  }, [color, intensity, fresnelPower])

  return (
    <mesh scale={[1.02, 1.02, 1.02]}>
      <sphereGeometry args={[radius, 64, 32]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  )
}

// ============================================================================
// Scene Setup
// ============================================================================

function Scene({ markers, config, onMarkerClick, onMarkerHover }) {
  const { camera } = useThree()

  // Set camera angle - comfortably framing the Earth globe
  React.useEffect(() => {
    camera.position.set(0, 0, config.radius * 2.8)
    camera.lookAt(0, 0, 0)
  }, [camera, config.radius])

  return (
    <>
      {/* Natural crisp illumination */}
      <ambientLight intensity={config.ambientIntensity} />
      
      {/* Primary Key Sunlight */}
      <directionalLight
        position={[config.radius * 5, config.radius * 3, config.radius * 5]}
        intensity={config.pointLightIntensity}
        color="#ffffff"
      />
      
      {/* Secondary Soft Fill */}
      <directionalLight
        position={[-config.radius * 4, config.radius * 2, -config.radius * 3]}
        intensity={config.pointLightIntensity * 0.4}
        color="#d0e2ff"
      />

      {/* Rotating Earth with Geospatial Markers */}
      <RotatingGlobe
        config={config}
        markers={markers}
        onMarkerClick={onMarkerClick}
        onMarkerHover={onMarkerHover}
      />

      {/* Atmosphere (if enabled) */}
      {config.showAtmosphere && (
        <Atmosphere
          radius={config.radius}
          color={config.atmosphereColor}
          intensity={config.atmosphereIntensity}
          blur={config.atmosphereBlur}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        enablePan={config.enablePan}
        enableZoom={config.enableZoom}
        minDistance={config.minDistance}
        maxDistance={config.maxDistance}
        rotateSpeed={0.4}
        autoRotate={config.autoRotateSpeed > 0}
        autoRotateSpeed={config.autoRotateSpeed}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

// ============================================================================
// Fallback Placeholder during Texture Loading
// ============================================================================

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-[#DDE3EC] shadow-sm">
        <div className="w-5 h-5 border-2 border-[#315CF5] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#5D6675]">
          Loading globe...
        </span>
      </div>
    </Html>
  )
}

// ============================================================================
// Main Globe3D Component
// ============================================================================

const defaultConfig = {
  radius: 2,
  globeColor: '#1a1a2e',
  textureUrl: DEFAULT_EARTH_TEXTURE,
  bumpMapUrl: DEFAULT_BUMP_TEXTURE,
  showAtmosphere: false,
  atmosphereColor: '#4da6ff',
  atmosphereIntensity: 0.2,
  atmosphereBlur: 3,
  bumpScale: 1,
  autoRotateSpeed: 0.3,
  enableZoom: true,
  enablePan: false,
  minDistance: 4,
  maxDistance: 12,
  initialRotation: { x: 0, y: 0 },
  markerSize: 0.06,
  showWireframe: false,
  wireframeColor: '#4a9eff',
  ambientIntensity: 0.9,
  pointLightIntensity: 1.6,
  backgroundColor: null,
}

export function Globe3D({
  markers = [],
  config = {},
  className = '',
  onMarkerClick,
  onMarkerHover,
}) {
  const mergedConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config]
  )

  return (
    <div className={cn('relative w-full h-[540px] overflow-hidden', className)}>
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 1000,
          position: [0, 0, mergedConfig.radius * 2.8],
        }}
        style={{
          background: mergedConfig.backgroundColor || 'transparent',
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene
            markers={markers}
            config={mergedConfig}
            onMarkerClick={onMarkerClick}
            onMarkerHover={onMarkerHover}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Globe3D
