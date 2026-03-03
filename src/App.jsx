import React from 'react'
import './App.css'
import './index.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Homepage from './pages/homepage'
import Editorpage from './pages/editorpage'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
    <div>
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            iconTheme: {
              primary: '#4aed88',
              secondary: '#1c1e29',
            },
            style: {
              background: '#282a36',
              color: '#fff',
            },
          },
        }}
      />
    </div>
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/editor/:roomid" element={<Editorpage />} />
        </Routes>
      </div>
    </Router>
    
    </>
  )
}

export default App
