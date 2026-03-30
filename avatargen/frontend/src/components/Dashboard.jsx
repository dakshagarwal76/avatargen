import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Video, Users, Clock, Zap, ArrowRight,
  Film, BookOpen, TrendingUp, Activity,
  CheckCircle, AlertCircle, Circle
} from 'lucide-react'

const API = 'http://localhost:8000'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-sm)',
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function StatusDot({ status }) {
  const map = {
    completed: { color: 'var(--emerald)',  icon: CheckCircle },
    failed:    { color: 'var(--rose)',     icon: AlertCircle },
    processing:{ color: 'var(--saffron)',  icon: Activity },
    queued:    { color: 'var(--text-muted)', icon: Circle },
  }
  const cfg = map[status] || map.queued
  return (
    <span className={`badge badge-${status === 'completed' ? 'green' : status === 'failed' ? 'red' : status === 'processing' ? 'saffron' : ''}`}
      style={{ background: `${cfg.color}18`, color: cfg.color }}>
      <span className="pulse-dot" style={{ background: cfg.color, width: 6, height: 6 }} />
      {status}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [jobs,    setJobs]   = useState([])
  const [health,  setHealth] = useState(null)
  const [loading, setLoading]= useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/jobs`).then(r => setJobs(r.data.jobs)),
      axios.get(`${API}/api/health`).then(r => setHealth(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const completed  = jobs.filter(j => j.status === 'completed').length
  const processing = jobs.filter(j => ['processing','queued'].includes(j.status)).length
  const failed     = jobs.filter(j => j.status === 'failed').length
  const recent     = jobs.slice(0, 5)

  function fmtTime(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
  }

  function fmtDuration(secs) {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    const s = Math.round(secs % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }} className="fade-up">
        <div style={{ fontSize: 11, color: 'var(--saffron)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Welcome back
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
          AvatarGen Studio
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Free AI video generation with Indian avatars & voices — powered by Wav2Lip + edge-tts
        </p>
      </div>

      {/* System health */}
      {health && (
        <div style={{
          display: 'flex', gap: 12, marginBottom: 28,
          background: health.status === 'ok' ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
          border: `1px solid ${health.status === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
          borderRadius: 'var(--radius-md)', padding: '12px 16px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: health.status === 'ok' ? 'var(--emerald)' : 'var(--rose)', marginRight: 8 }}>
            {health.status === 'ok' ? '✓ System Ready' : '⚠ System Degraded'}
          </span>
          {Object.entries(health.checks || {}).map(([k, v]) => (
            <span key={k} style={{ fontSize: 12, color: v ? 'var(--emerald)' : 'var(--rose)', marginRight: 12 }}>
              {v ? '✓' : '✗'} {k}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={Film}     label="Videos Created"  value={completed}  color="var(--emerald)" sub="All time" />
        <StatCard icon={Activity} label="Processing"      value={processing} color="var(--saffron)" sub="In queue" />
        <StatCard icon={AlertCircle} label="Failed"       value={failed}     color="var(--rose)"    sub="Needs attention" />
        <StatCard icon={Zap}      label="Free Tier"       value="∞"          color="var(--gold)"    sub="No cost, no limits" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 32 }}>
        {[
          {
            icon: Video, color: 'var(--saffron)', to: '/create',
            title: 'Create from Script',
            desc: 'Type your script, pick an Indian voice, generate a lip-sync video.',
            badge: 'Most Popular',
          },
          {
            icon: BookOpen, color: 'var(--violet)', to: '/notebooklm',
            title: 'Import NotebookLM',
            desc: 'Upload your NotebookLM podcast audio and add a talking avatar to it.',
            badge: 'New',
          },
          {
            icon: Users, color: 'var(--emerald)', to: '/avatars',
            title: 'Manage Avatars',
            desc: 'Upload photos or short video clips to use as talking avatars.',
            badge: null,
          },
        ].map(({ icon: Icon, color, to, title, desc, badge }) => (
          <div
            key={to} className="card"
            onClick={() => navigate(to)}
            style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
          >
            {badge && (
              <span style={{
                position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700,
                background: `${color}20`, color, padding: '2px 8px', borderRadius: 99,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {badge}
              </span>
            )}
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{title}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, color, fontSize: 13, fontWeight: 600 }}>
              Get started <ArrowRight size={13} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Recent Jobs</h2>
          <button className="btn-ghost" onClick={() => navigate('/library')}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
            <Video size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No videos yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {recent.map((job, i) => (
              <div key={job.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                {/* Thumb */}
                <div style={{
                  width: 48, height: 36, borderRadius: 6, flexShrink: 0, overflow: 'hidden',
                  background: 'var(--bg-elevated)',
                  backgroundImage: job.thumb_url ? `url(${API}${job.thumb_url})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!job.thumb_url && <Video size={14} color="var(--text-muted)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {job.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {fmtTime(job.created_at)} · {job.source === 'notebooklm' ? '📓 NotebookLM' : '📝 Script'}
                  </div>
                </div>
                {job.status === 'processing' && (
                  <div style={{ width: 80 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${job.progress || 0}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{job.progress || 0}%</div>
                  </div>
                )}
                {job.duration && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {fmtDuration(job.duration)}
                  </div>
                )}
                <StatusDot status={job.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
