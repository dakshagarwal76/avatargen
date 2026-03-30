import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Video, BookOpen, Film,
  Sparkles, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/avatars',    icon: Users,           label: 'Avatar Studio' },
  { to: '/create',     icon: Video,           label: 'Create Video' },
  { to: '/notebooklm', icon: BookOpen,        label: 'NotebookLM' },
  { to: '/library',    icon: Film,            label: 'Video Library' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{
      width:       collapsed ? '68px' : '220px',
      minHeight:   '100vh',
      background:  'var(--bg-void)',
      borderRight: '1px solid var(--border-subtle)',
      display:     'flex',
      flexDirection: 'column',
      transition:  'width 0.25s ease',
      position:    'sticky',
      top:         0,
      flexShrink:  0,
      zIndex:      50,
    }}>

      {/* Logo */}
      <div style={{
        padding:     '20px 16px',
        display:     'flex',
        alignItems:  'center',
        gap:         '10px',
        borderBottom:'1px solid var(--border-subtle)',
        overflow:    'hidden',
        whiteSpace:  'nowrap',
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, var(--saffron), var(--gold))',
          borderRadius: '9px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
        }}>
          <Sparkles size={16} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
              AvatarGen
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AI Video Studio
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display:     'flex',
              alignItems:  'center',
              gap:         '10px',
              padding:     '10px',
              borderRadius:'var(--radius-sm)',
              textDecoration: 'none',
              color:        isActive ? 'var(--saffron-glow)' : 'var(--text-secondary)',
              background:   isActive ? 'rgba(249,115,22,0.10)' : 'transparent',
              fontWeight:   isActive ? 600 : 400,
              fontSize:     14,
              marginBottom: 2,
              transition:   'all 0.15s ease',
              overflow:     'hidden',
              whiteSpace:   'nowrap',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} style={{ flexShrink: 0, color: isActive ? 'var(--saffron)' : 'inherit' }} />
                {!collapsed && <span style={{ fontFamily: 'var(--font-body)' }}>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Free badge */}
      {!collapsed && (
        <div style={{
          margin: '0 8px 8px',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Zap size={13} color="var(--emerald)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--emerald)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              100% Free
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Powered by edge-tts + Wav2Lip. No API costs.
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '12px',
          background:     'transparent',
          border:         'none',
          borderTop:      '1px solid var(--border-subtle)',
          color:          'var(--text-muted)',
          cursor:         'pointer',
          transition:     'color 0.15s',
        }}
        onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
