import { useGame } from '../context/GameContext'
import InteractiveObject from './InteractiveObject'

const Platform = ({
  id,
  position,
  large = false,
}: {
  id: number
  position: [number, number, number]
  large?: boolean
}) => {
  const radius = large ? 6 : 3
  const objectPositions: [number, number, number][] = [
    [position[0] - 1, 0.5, position[2] - 1],
    [position[0] + 1, 0.5, position[2]],
    [position[0], 0.5, position[2] + 1],
  ]
  return (
    <>
      <mesh position={position} receiveShadow>
        <cylinderGeometry args={[radius, radius, 1, 32]} />
        <meshStandardMaterial color={large ? 'slategray' : 'gray'} />
      </mesh>
      {!large &&
        objectPositions.map((pos, i) => (
          <InteractiveObject key={i} platformId={id} objectId={`${id}-obj${i}`} position={pos} />
        ))}
    </>
  )
}
export default Platform
