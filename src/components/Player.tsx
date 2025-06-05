import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group } from 'three'

const Player = () => {
  const ref = useRef<Group>(null)
  const speed = 0.2
  const [keys, setKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }))
    const handleKeyUp = (e: KeyboardEvent) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }))
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame(() => {
    if (!ref.current) return
    const dir = [0, 0, 0]
    if (keys['w']) dir[2] -= 1
    if (keys['s']) dir[2] += 1
    if (keys['a']) dir[0] -= 1
    if (keys['d']) dir[0] += 1
    const len = Math.hypot(dir[0], dir[2])
    if (len > 0) {
      dir[0] /= len
      dir[2] /= len
      ref.current.position.x += dir[0] * speed
      ref.current.position.z += dir[2] * speed
    }

    // Clamp within bounds
    const r = Math.sqrt(ref.current.position.x ** 2 + ref.current.position.z ** 2)
    if (r > 28) {
      ref.current.position.x *= 27 / r
      ref.current.position.z *= 27 / r
    }
  })

  return (
    <group ref={ref} position={[20, 1, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </group>
  )
}
export default Player
