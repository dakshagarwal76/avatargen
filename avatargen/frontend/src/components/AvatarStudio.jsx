import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Upload, Trash2, User, CheckCircle, ImageIcon, Video, X, Plus } from 'lucide-react'

const API = 'http://localhost:8000'

function AvatarCard({ avatar, onDelete }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: 'var(--bg-elevated)',
        backgroundImage: `url(${API}${avatar.thumb_url})`,
        backgroundSize: 'cover', backgroundPosition: 'center top',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!avatar.thumb_url && <User size={32} color="var(--text-muted)" />}
        {hover && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              Preview
            </button>
            <button
              className="btn-ghost"
              style={{ background: 'rgba(244,63,94,0.2)', color: 'var(--rose)', padding: '6px 12px' }}
              onClick={() => onDelete(avatar.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {avatar.type === 'video'
            ? <Video size={12} color="var(--violet)" />
            : <ImageIcon size={12} color="var(--saffron)" />}
          <span style={{ fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {avatar.name}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'capitalize' }}>
          {avatar.type} avatar
        </div>
      </div>
    </div>
  )
}

export default function AvatarStudio() {
  const [avatars,   setAvatars]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver,  setDragOver]  = useState(false)
  const [showForm,  setShowForm]  = useState(false)
  const [name,      setName]      = useState('')
  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const inputRef = useRef()

  const fetchAvatars = () => {
    axios.get(`${API}/api/avatars`).then(r => setAvatars(r.data.avatars)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAvatars() }, [])

  const handleFileSelect = (f) => {
    if (!f) return
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    const url = URL.createObjectURL(f)
    setPreview(url)
    setShowForm(true)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFileSelect(f)
  }

  const handleUpload = async () => {
    if (!file || !name.trim()) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name.trim())
    fd.append('is_video', file.type.startsWith('video/') ? 'true' : 'false')
    try {
      await axios.post(`${API}/api/avatars/upload`, fd)
      setShowForm(false)
      setFile(null)
      setName('')
      setPreview(null)
      fetchAvatars()
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this avatar?')) return
    await axios.delete(`${API}/api/avatars/${id}`)
    fetchAvatars()
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--saffron)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Studio
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Avatar Studio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
            Upload photos or video clips as your talking avatars. Tip: use a clear front-facing photo for best results.
          </p>
        </div>
        <button className="btn-primary" onClick={() => inputRef.current?.click()}>
          <Plus size={15} /> Add Avatar
        </button>
      </div>

      {/* Tips */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: 12, marginBottom: 28,
      }}>
        {[
          { emoji: '📸', title: 'Clear face photo', desc: 'Well-lit, front-facing portrait works best' },
          { emoji: '🎥', title: 'Short video clip', desc: '5–30s clip with face centered on screen' },
          { emoji: '🇮🇳', title: 'Indian avatars', desc: 'Any real person photo works — include your team!' },
        ].map(t => (
          <div key={t.title} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>{t.emoji}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--saffron)' : 'var(--border-normal)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 28,
          background: dragOver ? 'rgba(249,115,22,0.04)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <Upload size={28} color={dragOver ? 'var(--saffron)' : 'var(--text-muted)'} style={{ marginBottom: 10 }} />
        <p style={{ fontWeight: 600, marginBottom: 4 }}>
          {dragOver ? 'Drop it here!' : 'Drag & drop or click to upload'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          JPG, PNG, WebP, MP4, MOV, WebM — max 50MB
        </p>
        <input
          ref={inputRef} type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          style={{ display: 'none' }}
          onChange={e => handleFileSelect(e.target.files[0])}
        />
      </div>

      {/* Upload form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(4px)',
        }}>
          <div className="card" style={{ width: 420, padding: 28, position: 'relative' }}>
            <button
              className="btn-ghost" style={{ position: 'absolute', top: 12, right: 12, padding: 6 }}
              onClick={() => { setShowForm(false); setFile(null); setName(''); setPreview(null) }}
            >
              <X size={16} />
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
              Name your avatar
            </h3>
            {preview && (
              <div style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)',
                overflow: 'hidden', marginBottom: 18, background: 'var(--bg-elevated)',
              }}>
                {file?.type.startsWith('video/') ? (
                  <video src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                ) : (
                  <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                )}
              </div>
            )}
            <label className="field-label">Avatar Name</label>
            <input
              className="input"
              placeholder="e.g. Priya — Marketing Lead"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ marginBottom: 18 }}
              onKeyDown={e => e.key === 'Enter' && handleUpload()}
              autoFocus
            />
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleUpload} disabled={uploading || !name.trim()}>
              {uploading ? 'Uploading…' : <><CheckCircle size={15} /> Save Avatar</>}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : avatars.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <User size={40} style={{ marginBottom: 14, opacity: 0.3, display: 'block', margin: '0 auto 14px' }} />
          <p style={{ fontWeight: 600, marginBottom: 6 }}>No avatars yet</p>
          <p style={{ fontSize: 13 }}>Upload a photo or video to create your first avatar</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {avatars.map(a => <AvatarCard key={a.id} avatar={a} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}
