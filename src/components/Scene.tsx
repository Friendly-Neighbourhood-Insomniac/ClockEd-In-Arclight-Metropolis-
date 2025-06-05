import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { useGame } from '../context/GameContext'
import Platform from './Platform'
import Bridge from './Bridge'
import Player from './Player'

const positions = [...Array(8)].map((_, i) => {
  const angle = (i / 8) * 2 * Math.PI
  const radius = 20
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
})

const Scene = () => {
  const { state } = useGame()
  return (
    <Canvas shadows camera={{ position: [0, 20, 35], fov: 60 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <color attach="background" args={["#87CEEB"]} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      <Suspense fallback={null}>
        {positions.map((pos, idx) => (
          <Platform key={idx + 1} id={idx + 1} position={pos as [number, number, number]} />
        ))}
        <Platform id={9} position={[0, 0, 0]} large />
        {positions.map((pos, idx) => (
          <Bridge
            key={idx + 1}
            from={idx + 1}
            to={idx + 2 > 8 ? 9 : idx + 2}
            show={state.completedPlatforms.has(idx + 2 > 8 ? 9 : idx + 2)}
            fromPos={positions[idx]}
            toPos={idx + 2 > 8 ? [0, 0, 0] : positions[idx + 1]}
          />
        ))}
        <Player />
      </Suspense>
    </Canvas>
  )
}
export default Scene
