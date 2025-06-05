import { createContext, useContext, useState, ReactNode } from 'react'

interface GameState {
  platformProgress: Record<number, number>
  completedPlatforms: Set<number>
  isObjectActive: Record<string, boolean>
}

interface GameContextType {
  state: GameState
  activateObject: (platformId: number, objectId: string) => void
  isPlatformComplete: (platformId: number) => boolean
  canAccessPlatform: (platformId: number) => boolean
}

const GameContext = createContext<GameContextType | null>(null)

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>({
    platformProgress: {},
    completedPlatforms: new Set([1]),
    isObjectActive: {}
  })

  const activateObject = (platformId: number, objectId: string) => {
    setState(prev => {
      const newIsObjectActive = { ...prev.isObjectActive, [objectId]: true }
      const platformObjects = Object.entries(newIsObjectActive)
        .filter(([key]) => key.startsWith(`${platformId}-`) && key in newIsObjectActive)
      const newPlatformProgress = { ...prev.platformProgress, [platformId]: platformObjects.length }
      const newCompleted = new Set(prev.completedPlatforms)
      if (platformObjects.length >= 3) {
        newCompleted.add(platformId + 1)
      }
      return {
        ...prev,
        isObjectActive: newIsObjectActive,
        platformProgress: newPlatformProgress,
        completedPlatforms: newCompleted
      }
    })
  }

  return (
    <GameContext.Provider value={{
      state: state,
      activateObject,
      isPlatformComplete: (id) => state.platformProgress[id] >= 3,
      canAccessPlatform: (id) => state.completedPlatforms.has(id)
    }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame must be used within a GameProvider")
  return ctx
