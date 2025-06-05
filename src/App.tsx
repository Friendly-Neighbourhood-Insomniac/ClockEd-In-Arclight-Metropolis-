import Scene from './components/Scene'
import { GameProvider } from './context/GameContext'

function App() {
  return (
    <GameProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Scene />
      </div>
    </GameProvider>
  )
}
export default App
