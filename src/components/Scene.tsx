import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { useGame } from '../context/GameContext'
import Platform from './Platform'
import Bridge from './Bridge'
import Player from './Player'

const positions: [number, number, number][] = [...Array(8)].map((_, i) => {
  const angle = (i / 8) * 2 * Math.PI
  const radius = 20
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
})

const Scene = () => {
  const { state } = useGame()
  return (
    <Canvas gl={{ antialias: true }} shadows dpr={[1, 2]} camera={{ position: [0, 20, 35], fov: 60 }}>
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <color attach="background" args={["#87CEEB"]} />
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true} 
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
      />
      <Suspense fallback={null}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#a0a0a0" />
        </mesh>
        {positions.map((position, idx) => (
          <Platform key={idx + 1} id={idx + 1} position={position} />
        ))}
        <Platform id={9} position={[0, 0, 0]} large />
         {positions.map((_, idx) => (
          <Bridge
            key={idx + 1}
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
