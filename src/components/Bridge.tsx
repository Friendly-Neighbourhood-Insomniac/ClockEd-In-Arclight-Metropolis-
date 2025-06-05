import { useMemo } from 'react'

const SegmentedBridge = ({
  fromPos,
  toPos,
  show
}: {
  fromPos: [number, number, number]
  toPos: [number, number, number]
  show: boolean
}) => {
  const segments = useMemo(() => {
    const dx = toPos[0] - fromPos[0]
    const dz = toPos[2] - fromPos[2]
    const length = Math.sqrt(dx * dx + dz * dz)
    const angle = Math.atan2(dz, dx)
    const numSegments = Math.floor(length / 2)
    const positions = []

    for (let i = 0; i < numSegments; i++) {
      const t = (i + 1) / (numSegments + 1)
      const x = fromPos[0] + dx * t
      const z = fromPos[2] + dz * t
      positions.push([x, 0.1, z])
    }

    return { positions, angle }
  }, [fromPos, toPos])

  if (!show) return null

  return (
    <>
      {segments.positions.map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} rotation={[0, segments.angle, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.2, 0.9]} />
          <meshStandardMaterial color="sienna" />
        </mesh>
      ))}
    </>
  )
}

export default SegmentedBridge
