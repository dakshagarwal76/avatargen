import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Upload, Trash2, User, CheckCircle, ImageIcon, Video, X, Plus, Sparkles } from 'lucide-react'

const API = 'http://localhost:8000'

function AvatarCard({ avatar, onDelete }) {
  const [hover, setHover] = useState(false)
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{ width: '100%', aspectRatio: '16/9', backgroundImage: `url(${API}${avatar.thumb_url})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}>
        {hover && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="btn-ghost" style={{ background: 'rgba(244,63,94,0.2)', color: 'var(--rose)', padding: '6px 12px' }} onClick={() => onDelete(avatar.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {avatar.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
          <span style={{ fontWeight: 600, fontSize: 13 }}>{avatar.name}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{avatar.source || 'upload'}</div>
      </div>
    </div>
  )
}

export default function AvatarStudio() {
  const [avatars, setAvatars] = useState([])
  const [builtins, setBuiltins] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [prompt, setPrompt] = useState('realistic indian woman presenter, front-facing portrait, studio light')
  const inputRef = useRef()

  const fetchAll = async () => {
    const [a, b] = await Promise.all([
      axios.get(`${API}/api/avatars`),
      axios.get(`${API}/api/avatars/builtin`),
    ])
    setAvatars(a.data.avatars)
    setBuiltins(b.data.avatars)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleUpload = async () => {
    if (!file || !name.trim()) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name.trim())
    fd.append('is_video', file.type.startsWith('video/') ? 'true' : 'false')
    try {
      await axios.post(`${API}/api/avatars/upload`, fd)
      setShowForm(false); setFile(null); setName(''); setPreview(null)
      fetchAll()
    } finally { setUploading(false) }
  }

  const addBuiltin = async (id) => {
    setUploading(true)
    try { await axios.post(`${API}/api/avatars/add-builtin/${id}`); await fetchAll() }
    finally { setUploading(false) }
  }

  const generateFromPrompt = async () => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('prompt', prompt)
      fd.append('name', `AI Avatar ${new Date().toLocaleTimeString()}`)
      fd.append('seed', `${Math.floor(Math.random() * 100000)}`)
      await axios.post(`${API}/api/avatars/generate`, fd)
      await fetchAll()
    } finally { setUploading(false) }
  }

  return (
    <div style={{ padding: 32, maxWidth: 1150, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Avatar Studio</h1>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: 6 }}>Built-in realistic Indian avatars</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>One click to add curated inbuilt avatars.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginTop: 12 }}>
          {builtins.map(b => (
            <div key={b.id} className="card" style={{ padding: 8 }}>
              <img src={b.preview_url} onError={e => { e.currentTarget.src = b.fallback_preview_url }} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} />
              <img src={b.preview_url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} />
              <div style={{ fontSize: 12, fontWeight: 600, margin: '8px 0' }}>{b.name}</div>
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => addBuiltin(b.id)} disabled={uploading}>Add</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginBottom: 8 }}>Generate avatar from prompt</h3>
        <textarea className="input" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} />
        <button className="btn-primary" onClick={generateFromPrompt} style={{ marginTop: 10 }} disabled={uploading || !prompt.trim()}>
          <Sparkles size={15} /> Generate AI Avatar
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3>Your avatar library</h3>
        <button className="btn-primary" onClick={() => inputRef.current?.click()}><Plus size={15} /> Add Upload</button>
      </div>

      <input ref={inputRef} type="file" style={{ display: 'none' }} accept="image/*,video/*" onChange={e => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f); setName(f.name.replace(/\.[^.]+$/, '')); setPreview(URL.createObjectURL(f)); setShowForm(true)
      }} />

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
          {avatars.map(a => <AvatarCard key={a.id} avatar={a} onDelete={async id => { await axios.delete(`${API}/api/avatars/${id}`); fetchAll() }} />)}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 420, position: 'relative' }}>
            <button className="btn-ghost" style={{ position: 'absolute', right: 10, top: 10, padding: 4 }} onClick={() => setShowForm(false)}><X size={16} /></button>
            {preview && <img src={preview} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />}
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
            <button className="btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : <><CheckCircle size={14} /> Save Avatar</>}</button>
          </div>
        </div>
      )}
    </div>
  )
}
