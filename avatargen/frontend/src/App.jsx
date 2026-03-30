import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import AvatarStudio from './components/AvatarStudio'
import CreateVideo from './components/CreateVideo'
import NotebookLMImport from './components/NotebookLMImport'
import VideoLibrary from './components/VideoLibrary'

export default function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/avatars"      element={<AvatarStudio />} />
          <Route path="/create"       element={<CreateVideo />} />
          <Route path="/notebooklm"   element={<NotebookLMImport />} />
          <Route path="/library"      element={<VideoLibrary />} />
          <Route path="*"             element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
