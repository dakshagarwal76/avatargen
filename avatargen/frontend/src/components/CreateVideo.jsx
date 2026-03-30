import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Mic, Wand2, ChevronDown, Play, Pause, Loader,
  CheckCircle, AlertTriangle, Zap, User, Volume2
} from 'lucide-react'

const API = 'http://localhost:8000'

const RATE_OPTIONS  = ['-30%','-20%','-10%','+0%','+10%','+20%','+30%']
const PITCH_OPTIONS = ['-10Hz','-5Hz','+0Hz','+5Hz','+10Hz']

// ── Language grouper ──────────────────────────────────────────────────────────
function VoicePicker({ voices, languages, value, onChange }) {
  const [open,   setOpen]   = useState(false)
  const [filter, setFilter] = useState('all')
  const ref = useRef()

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const active = voices.find(v => v.id === value)
  const shown  = filter === 'all' ? voices : voices.filter(v => v.lang === filter)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="input"
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left' }}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span style={{ fontSize: 16 }}>{active?.flag || '🎙️'}</span>
        <span style={{ flex: 1 }}>
          {active ? `${active.name} — ${active.lang} (${active.gender})` : 'Select a voice…'}
        </span>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-normal)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          maxHeight: 340, display: 'flex', flexDirection: 'column',
        }}>
          {/* Language tabs */}
          <div style={{
            display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto',
            borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
          }}>
            {['all', ...languages].map(l => (
              <button
                key={l} onClick={() => setFilter(l)} type="button"
                style={{
                  padding: '4px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: filter === l ? 'var(--saffron)' : 'var(--bg-hover)',
                  color: filter === l ? '#fff' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                }}
              >
                {l === 'all' ? 'All' : l}
              </button>
            ))}
          </div>
          {/* Voice list */}
          <div style={{ overflowY: 'auto' }}>
            {shown.map(v => (
              <div
                key={v.id}
                onClick={() => { onChange(v.id); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                  background: value === v.id ? 'rgba(249,115,22,0.08)' : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (value !== v.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (value !== v.id) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 18 }}>{v.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: value === v.id ? 'var(--saffron)' : 'var(--text-primary)' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.lang}</div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 99,
                  background: v.gender === 'Female' ? 'rgba(244,63,94,0.12)' : 'rgba(59,130,246,0.12)',
                  color: v.gender === 'Female' ? '#FB7185' : '#60A5FA', fontWeight: 600, textTransform: 'uppercase',
                }}>
                  {v.gender}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Avatar picker ──────────────────────────────────────────────────────────────
function AvatarPicker({ avatars, value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 10 }}>
      {avatars.map(a => (
        <div
          key={a.id}
          onClick={() => onChange(a.id)}
          style={{
            cursor: 'pointer', borderRadius: 'var(--radius-md)', overflow: 'hidden',
            border: `2px solid ${value === a.id ? 'var(--saffron)' : 'var(--border-subtle)'}`,
            transition: 'border-color 0.15s', background: 'var(--bg-elevated)',
            boxShadow: value === a.id ? '0 0 0 3px rgba(249,115,22,0.2)' : 'none',
          }}
        >
          <div style={{
            width: '100%', aspectRatio: '1',
            backgroundImage: `url(${API}${a.thumb_url})`,
            backgroundSize: 'cover', backgroundPosition: 'center top',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!a.thumb_url && <User size={20} color="var(--text-muted)" />}
          </div>
          <div style={{ padding: '4px 6px', fontSize: 10, fontWeight: 600, textAlign: 'center',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: value === a.id ? 'var(--saffron)' : 'var(--text-secondary)',
          }}>
            {a.name}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Job progress overlay ───────────────────────────────────────────────────────
function JobProgress({ job, onDone }) {
  const done = job.status === 'completed' || job.status === 'failed'

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-normal)',
      borderRadius: 'var(--radius-lg)', padding: 28, marginTop: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {!done
          ? <Loader size={20} color="var(--saffron)" style={{ animation: 'spin 1s linear infinite' }} />
          : job.status === 'completed'
            ? <CheckCircle size={20} color="var(--emerald)" />
            : <AlertTriangle size={20} color="var(--rose)" />}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' }}>
            {job.status === 'completed' ? '🎉 Video Ready!' : job.status === 'failed' ? 'Generation Failed' : 'Generating…'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{job.step}</div>
        </div>
      </div>
      <div className="progress-track" style={{ height: 6, marginBottom: 10 }}>
        <div className="progress-fill" style={{ width: `${job.progress}%` }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: job.status === 'completed' ? 16 : 0 }}>
        {job.progress}% complete
      </div>

      {job.status === 'completed' && (
        <>
          <video
            src={`${API}${job.video_url}`}
            controls
            style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: 16, background: '#000' }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={`${API}${job.video_url}`} download
              className="btn-primary" style={{ textDecoration: 'none', flex: 1, justifyContent: 'center' }}
            >
              ⬇ Download Video
            </a>
            <button className="btn-secondary" onClick={onDone} style={{ flex: 1 }}>
              Create Another
            </button>
          </div>
        </>
      )}

      {job.status === 'failed' && (
        <div style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: 8, fontSize: 13, color: '#FB7185',
        }}>
          {job.error}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CreateVideo() {
  const [voices,   setVoices]   = useState([])
  const [langs,    setLangs]    = useState([])
  const [avatars,  setAvatars]  = useState([])
  const [loading,  setLoading]  = useState(true)

  // Form
  const [title,      setTitle]      = useState('')
  const [script,     setScript]     = useState('')
  const [voice,      setVoice]      = useState('hi-IN-SwaraNeural')
  const [avatarId,   setAvatarId]   = useState('')
  const [rate,       setRate]       = useState('+0%')
  const [pitch,      setPitch]      = useState('+0Hz')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [audioEl]                   = useState(() => new Audio())

  // Job
  const [jobId,   setJobId]   = useState(null)
  const [job,     setJob]     = useState(null)
  const [polling, setPolling] = useState(false)
  const pollRef = useRef()

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/voices`).then(r => { setVoices(r.data.voices); setLangs(r.data.languages) }),
      axios.get(`${API}/api/avatars`).then(r => { setAvatars(r.data.avatars) }),
    ]).finally(() => setLoading(false))
  }, [])

  // Poll job
  useEffect(() => {
    if (!jobId) return
    setPolling(true)
    const poll = async () => {
      const r = await axios.get(`${API}/api/jobs/${jobId}`)
      setJob(r.data)
      if (['completed','failed'].includes(r.data.status)) {
        setPolling(false)
        clearInterval(pollRef.current)
      }
    }
    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  const handlePreview = async () => {
    if (!script.trim() || !voice) return
    setPreviewing(true)
    try {
      const r = await axios.post(`${API}/api/tts/preview`, { text: script, voice, rate, pitch })
      audioEl.src = `${API}${r.data.audio_url}`
      audioEl.play()
      setPreviewUrl(r.data.audio_url)
    } catch (e) {
      alert('Preview failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setPreviewing(false)
    }
  }

  const handleGenerate = async () => {
    if (!script.trim()) return alert('Please enter a script.')
    if (!avatarId)      return alert('Please select an avatar.')

    try {
      const r = await axios.post(`${API}/api/videos/generate`, {
        title:     title || 'My Video',
        tts_text:  script,
        tts_voice: voice,
        tts_rate:  rate,
        tts_pitch: pitch,
        avatar_id: avatarId,
        source:    'script',
      })
      setJobId(r.data.job_id)
      setJob({ status: 'queued', progress: 0, step: 'Queued…' })
    } catch (e) {
      alert('Failed to start: ' + (e.response?.data?.detail || e.message))
    }
  }

  const resetJob = () => { setJobId(null); setJob(null) }

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading studio…
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--saffron)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Studio
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Create Video
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Type a script, choose an Indian voice, pick your avatar — get a lip-sync video in minutes.
        </p>
      </div>

      {!job ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left — Script + Voice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title */}
            <div>
              <label className="field-label">Video Title</label>
              <input className="input" placeholder="e.g. Product Launch Announcement" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Script */}
            <div>
              <label className="field-label">Script</label>
              <textarea
                className="input"
                placeholder="नमस्ते! Type your script in any Indian language or English…"
                value={script}
                onChange={e => setScript(e.target.value)}
                style={{ minHeight: 160 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{script.length} characters</span>
                <button
                  className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={handlePreview} disabled={previewing || !script.trim()}
                >
                  {previewing ? <Loader size={12} /> : <Volume2 size={12} />}
                  {previewing ? 'Generating…' : 'Preview Audio'}
                </button>
              </div>
            </div>

            {/* Voice */}
            <div>
              <label className="field-label">Voice</label>
              {voices.length > 0 && (
                <VoicePicker voices={voices} languages={langs} value={voice} onChange={setVoice} />
              )}
            </div>

            {/* Rate + Pitch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="field-label">Speed</label>
                <select className="input" value={rate} onChange={e => setRate(e.target.value)}>
                  {RATE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Pitch</label>
                <select className="input" value={pitch} onChange={e => setPitch(e.target.value)}>
                  {PITCH_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Right — Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="field-label">Avatar</label>
              {avatars.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                  <User size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ fontSize: 13 }}>No avatars yet.</p>
                  <p style={{ fontSize: 12 }}>Go to <b>Avatar Studio</b> to upload one.</p>
                </div>
              ) : (
                <AvatarPicker avatars={avatars} value={avatarId} onChange={setAvatarId} />
              )}
            </div>

            {/* Selected avatar preview */}
            {avatarId && (
              <div>
                {(() => {
                  const a = avatars.find(av => av.id === avatarId)
                  return a ? (
                    <div style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border-accent)',
                      borderRadius: 'var(--radius-md)', padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                        backgroundImage: `url(${API}${a.thumb_url})`,
                        backgroundSize: 'cover', backgroundPosition: 'center top',
                      }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>✓ {a.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.type} avatar selected</div>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}

            {/* Tech info */}
            <div style={{
              background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                How it works
              </div>
              {[
                { icon: '🎙️', step: 'edge-tts generates Indian speech from your script' },
                { icon: '🔄', step: 'Wav2Lip syncs the avatar lips to the audio' },
                { icon: '🎬', step: 'FFmpeg renders the final MP4 video' },
                { icon: '💸', step: 'Completely free — no API keys needed' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>{s.icon}</span><span>{s.step}</span>
                </div>
              ))}
            </div>

            {/* Generate button */}
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
              onClick={handleGenerate}
              disabled={!script.trim() || !avatarId}
            >
              <Wand2 size={17} /> Generate Video
            </button>
          </div>
        </div>
      ) : (
        <JobProgress job={job} onDone={resetJob} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
