import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import api from './api'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NewCampaign from './pages/NewCampaign'
import Preview from './pages/Preview'
import Search from './pages/Search'
import SendProgress from './pages/SendProgress'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'

export default function App() {
  const [profileComplete, setProfileComplete] = useState(null)
  const location = useLocation()

  useEffect(() => {
    api.get('/profile')
      .then((res) => setProfileComplete(res.data.is_complete))
      .catch(() => setProfileComplete(false))
  }, [location.pathname])

  useEffect(() => {
    // Smoothly scroll to top on page navigation
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  useEffect(() => {
    // Fallback for browsers without native animation-timeline scroll()
    if (!window.CSS || !CSS.supports || !CSS.supports('animation-timeline', 'scroll()')) {
      const bar = document.getElementById('scroll-progress')
      if (!bar) return
      const onScroll = () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight
        if (totalHeight <= 0) return
        const pct = Math.min(1, Math.max(0, window.scrollY / totalHeight))
        bar.style.transform = `scaleX(${pct})`
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Show nothing while checking profile status
  if (profileComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div id="scroll-progress" aria-hidden="true" />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div key={location.pathname} className="animate-page-enter">
          <Routes>
            <Route
              path="/"
              element={
                profileComplete ? <Dashboard /> : <Navigate to="/profile" replace />
              }
            />
            <Route path="/profile" element={<Profile onSave={() => setProfileComplete(true)} />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/campaign/new"
              element={
                profileComplete ? <NewCampaign /> : <Navigate to="/profile" replace />
              }
            />
            <Route path="/search" element={profileComplete ? <Search /> : <Navigate to="/profile" replace />} />
            <Route path="/campaign/:campaignId/preview" element={<Preview />} />
            <Route path="/campaign/:campaignId/send" element={<SendProgress />} />
            <Route path="/campaign/:campaignId/followup/preview" element={<Preview isFollowUp />} />
            <Route path="/campaign/:campaignId/followup/send" element={<SendProgress isFollowUp />} />
            <Route
              path="/campaigns"
              element={
                profileComplete ? <Campaigns /> : <Navigate to="/profile" replace />
              }
            />
            <Route path="/campaign/:campaignId" element={<CampaignDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
