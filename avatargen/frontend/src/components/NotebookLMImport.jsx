import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  BookOpen, Upload, Music2, User, Wand2, CheckCircle,
  Loader, AlertTriangle, X, Info
} from 'lucide-react'

const API = 'http://localhost:8000'

function JobProgress({ job, onDone }) {
  const done = job.status === 'completed' || job.status === 'failed'
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-normal)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {!done
          ? <Loader size={20} color="var(--saffron)" style={{ animation: 'spin 1s linear infinite' }} />
          : job.status === 'completed'
            ? <CheckCircle size={20} color="var(--emerald)" />
            : <AlertTriangle size={20} color="var(--rose)" />}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' }}>
            {job.status === 'completed' ? '🎉 Video Ready!' : job.status === 'failed' ? 'Generation Failed' : 'Processing NotebookLM Audio…'}
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
          <video src={`${API}${job.video_url}`} controls
            style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: 16, background: '#000' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <a href={`${API}${job.video_url}`} download
              className="btn-primary" style={{ textDecoration: 'none', flex: 1, justifyContent: 'center' }}>
              ⬇ Download Video
            </a>
            <button className="btn-secondary" onClick={onDone} style={{ flex: 1 }}>Create Another</button>
          </div>
        </>
      )}
      {job.status === 'failed' && (
        <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: 8, fontSize: 13, color: '#FB7185' }}>
          {job.error}
        </div>
      )}
    </div>
  )
}

export default function NotebookLMImport() {
  const [avatars,    setAvatars]    = useState([])
  const [avatarId,   setAvatarId]   = useState('')
  const [audioFile,  setAudioFile]  = useState(null)
  const [audioId,    setAudioId]    = useState(null)
  const [audioDur,   setAudioDur]   = useState(null)
  const [audioName,  setAudioName]  = useState('')
  const [title,      setTitle]      = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [jobId,      setJobId]      = useState(null)
  const [job,        setJob]        = useState(null)
  const [dragOver,   setDragOver]   = useState(false)
  const inputRef  = useRef()
  const pollRef   = useRef()

  useEffect(() => {
    axios.get(`${API}/api/avatars`).then(r => {
      setAvatars(r.data.avatars)
      if (r.data.avatars.length) setAvatarId(r.data.avatars[0].id)
    })
  }, [])

  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      const r = await axios.get(`${API}/api/jobs/${jobId}`)
      setJob(r.data)
      if (['completed','failed'].includes(r.data.status)) clearInterval(pollRef.current)
    }
    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  const handleAudioDrop = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['mp3','wav','m4a','ogg','aac'].includes(ext)) {
      alert('Please upload an MP3, WAV, M4A, OGG, or AAC file.')
      return
    }
    setAudioFile(file)
    setAudioName(file.name)
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await axios.post(`${API}/api/audio/upload`, fd)
      setAudioId(r.data.audio_id)
      setAudioDur(r.data.duration)
    } catch (e) {
      alert('Upload failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setUploading(false)
    }
  }

  const handleGenerate = async () => {
    if (!audioId)   return alert('Please upload audio first.')
    if (!avatarId)  return alert('Please select an avatar.')
    try {
      const r = await axios.post(`${API}/api/videos/from-notebooklm`, {
        avatar_id:   avatarId,
        audio_id:    audioId,
        title:       title || 'NotebookLM Video',
      })
      setJobId(r.data.job_id)
      setJob({ status: 'queued', progress: 0, step: 'Queued…' })
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  const reset = () => {
    setJobId(null); setJob(null); setAudioFile(null); setAudioId(null)
    setAudioDur(null); setAudioName(''); setTitle('')
  }

  function fmtDur(s) {
    if (!s) return ''
    const m = Math.floor(s/60), sec = Math.round(s%60)
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--violet)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Import
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={22} color="var(--violet)" /> NotebookLM Import
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Turn your NotebookLM podcast into a video with a talking avatar.
        </p>
      </div>

      {!job ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* How to export from NotebookLM */}
          <div style={{
            background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 'var(--radius-lg)', padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Info size={15} color="#A78BFA" />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#A78BFA', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                How to export from NotebookLM
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
              {[
                { step: '1', desc: 'Open your NotebookLM notebook' },
                { step: '2', desc: 'Go to Audio Overview tab' },
                { step: '3', desc: 'Click "⋮" → Download audio' },
                { step: '4', desc: 'Upload the .wav or .mp3 file here' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'rgba(124,58,237,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#A78BFA', flexShrink: 0,
                  }}>
                    {s.step}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audio upload */}
          <div>
            <label className="field-label">NotebookLM Audio File</label>
            <div
              onDrop={e => { e.preventDefault(); setDragOver(false); handleAudioDrop(e.dataTransfer.files[0]) }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !audioId && inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--violet)' : audioId ? 'var(--emerald)' : 'var(--border-normal)'}`,
                borderRadius: 'var(--radius-lg)', padding: '28px',
                textAlign: 'center', cursor: audioId ? 'default' : 'pointer',
                background: dragOver ? 'rgba(124,58,237,0.04)' : audioId ? 'rgba(16,185,129,0.04)' : 'transparent',
                transition: 'all 0.2s', position: 'relative',
              }}
            >
              {uploading ? (
                <>
                  <Loader size={28} color="var(--saffron)" style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                  <p style={{ fontWeight: 600 }}>Uploading…</p>
                </>
              ) : audioId ? (
                <>
                  <button
                    className="btn-ghost" style={{ position: 'absolute', top: 10, right: 10, padding: 6 }}
                    onClick={e => { e.stopPropagation(); setAudioId(null); setAudioFile(null); setAudioName(''); setAudioDur(null) }}
                  >
                    <X size={14} />
                  </button>
                  <CheckCircle size={28} color="var(--emerald)" style={{ marginBottom: 8 }} />
                  <p style={{ fontWeight: 700, color: 'var(--emerald)' }}>Audio Uploaded!</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {audioName} {audioDur ? `· ${fmtDur(audioDur)}` : ''}
                  </p>
                </>
              ) : (
                <>
                  <Music2 size={28} color={dragOver ? 'var(--violet)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
                  <p style={{ fontWeight: 600 }}>{dragOver ? 'Drop it!' : 'Drop your NotebookLM audio here'}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>MP3, WAV, M4A, OGG, AAC supported</p>
                </>
              )}
              <input ref={inputRef} type="file" accept="audio/*" style={{ display: 'none' }}
                onChange={e => handleAudioDrop(e.target.files[0])} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="field-label">Video Title</label>
            <input className="input" placeholder="e.g. NotebookLM Deep Dive — Quantum Physics"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Avatar */}
          <div>
            <label className="field-label">Select Avatar</label>
            {avatars.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                <User size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No avatars. Go to <b>Avatar Studio</b> first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {avatars.map(a => (
                  <div
                    key={a.id} onClick={() => setAvatarId(a.id)}
                    style={{
                      cursor: 'pointer', borderRadius: 'var(--radius-md)', overflow: 'hidden',
                      border: `2px solid ${avatarId === a.id ? 'var(--saffron)' : 'var(--border-subtle)'}`,
                      width: 80, transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{
                      width: '100%', aspectRatio: '1',
                      backgroundImage: `url(${API}${a.thumb_url})`,
                      backgroundSize: 'cover', backgroundPosition: 'center top',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: !a.thumb_url ? 'var(--bg-elevated)' : undefined,
                    }}>
                      {!a.thumb_url && <User size={18} color="var(--text-muted)" />}
                    </div>
                    <div style={{ padding: '3px 6px', fontSize: 10, fontWeight: 600, textAlign: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: avatarId === a.id ? 'var(--saffron)' : 'var(--text-secondary)',
                    }}>
                      {a.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate */}
          <button
            className="btn-primary"
            style={{ width: '100%', padding: 14, fontSize: 15, justifyContent: 'center' }}
            onClick={handleGenerate}
            disabled={!audioId || !avatarId || uploading}
          >
            <Wand2 size={17} /> Generate Video from NotebookLM
          </button>
        </div>
      ) : (
        <JobProgress job={job} onDone={reset} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
