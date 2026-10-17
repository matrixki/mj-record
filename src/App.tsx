import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Player from './pages/Player'
import { SheetDataProvider } from './context/SheetDataProvider'
import './App.css'

// Start each page at the top when navigating between them
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <SheetDataProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:name" element={<Player />} />
      </Routes>
    </SheetDataProvider>
  )
}

export default App
