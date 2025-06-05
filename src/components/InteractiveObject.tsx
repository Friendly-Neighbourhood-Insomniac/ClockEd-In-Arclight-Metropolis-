import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useGame } from '../context/GameContext'
import { a, useSpring } from '@react-spring/three'

const InteractiveObject = ({
  position,
  platformId,
  objectId
}: {
  position: [number, number, number]
  platformId: number
  objectId: string
}) => {
  const groupRef = useRef<Group>(null)
  const { state, activateObject, canAccessPlatform } = useGame()
  const isActive = state.isObjectActive[objectId]
  const isAccessible = canAccessPlatform(platformId)

  const [hovered, setHovered] = useState(false)

  const { scale } = useSpring({
    scale: isActive ? 1.3 : hovered ? 1.1 : 1,
    config: { mass: 1, tension: 210, friction: 12 }
  })

  const handleClick = () => {
    if (isAccessible && !isActive) {
      activateObject(platformId, objectId)
    }
  }

  useFrame((_, delta) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y += delta * 0.8
    }
  })

  return (
    <a.group
      ref={groupRef}
      scale={scale}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.2, 12]} />
        <meshStandardMaterial
          color={isActive ? '#22c55e' : '#f59e0b'}
          emissive={isActive ? '#22c55e' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
    </a.group>
  )
}
export default InteractiveObject
